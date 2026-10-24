import { readFile, readdir, mkdir, writeFile, stat, copyFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(appRoot, '..');
const materialsRoot = join(appRoot, 'public', 'materials');

async function isDirectory(path) {
  try {
    return (await stat(path)).isDirectory();
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function copyMarkdownDirectory(sourceDirectory, destinationDirectory) {
  await mkdir(destinationDirectory, { recursive: true });
  const entries = await readdir(sourceDirectory, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = join(sourceDirectory, entry.name);
    const destinationPath = join(destinationDirectory, entry.name);
    if (entry.isDirectory()) await copyMarkdownDirectory(sourcePath, destinationPath);
    else if (entry.isFile() && entry.name.endsWith('.md')) await copyFile(sourcePath, destinationPath);
  }
}

// The original repository stays the authoring source. Packaged Markdown also
// makes this app rebuildable after only adas-academy/ is uploaded or exported.
const hasRepositorySources = await isDirectory(join(repoRoot, 'chapters'));
const sourceRoot = hasRepositorySources ? repoRoot : materialsRoot;
if (hasRepositorySources) {
  await copyMarkdownDirectory(join(repoRoot, 'chapters'), join(materialsRoot, 'chapters'));
  await copyMarkdownDirectory(join(repoRoot, 'explanations'), join(materialsRoot, 'explanations'));
  await copyFile(join(repoRoot, 'README.md'), join(materialsRoot, 'README.md'));
}

// Short labels and descriptions are editorial navigation aids; the lesson body
// is always read from the repository rather than duplicated here.
const chapterMetadata = {
  1: {
    title: 'Tổng quan kiến trúc hệ thống ADAS và tiêu chuẩn công nghiệp',
    shortTitle: 'Nền tảng ADAS',
    description: 'Hiểu các cấp độ tự hành, kiến trúc hệ thống và tư duy an toàn với ISO 26262, SOTIF.',
    category: 'foundation',
    icon: 'layers',
  },
  2: {
    title: 'Cảm biến và dung hợp dữ liệu',
    shortTitle: 'Cảm biến & Fusion',
    description: 'Khám phá camera, radar, siêu âm, LiDAR và cách EKF kết hợp thông tin cảm biến.',
    category: 'foundation',
    icon: 'radar',
  },
  3: {
    title: 'Tính năng ADAS và thuật toán điều khiển',
    shortTitle: 'Điều khiển & ADAS',
    description: 'Từ TTC, AEB và ACC đến điều khiển bám làn, Stanley, MPC và tình huống biên.',
    category: 'engineering',
    icon: 'route',
  },
  4: {
    title: 'Giám sát khoang lái DMS, OMS và trải nghiệm HMI',
    shortTitle: 'DMS, OMS & HMI',
    description: 'Tìm hiểu theo dõi người lái, PERCLOS, bảo vệ hành khách và giao tiếp người – xe.',
    category: 'engineering',
    icon: 'eye',
  },
  5: {
    title: 'Hạ tầng tính toán và mạng truyền thông trên xe',
    shortTitle: 'Tính toán & Mạng',
    description: 'Kết nối kiến trúc E/E, bộ điều khiển miền, Safety Core, CAN-FD và Automotive Ethernet.',
    category: 'engineering',
    icon: 'cpu',
  },
  6: {
    title: 'Kiểm thử, hiệu chuẩn cảm biến và tiêu chuẩn NCAP',
    shortTitle: 'Kiểm thử & NCAP',
    description: 'Học V-Model, MIL/SIL/HIL/VIL, hiệu chuẩn cảm biến và các tình huống đánh giá an toàn.',
    category: 'practice',
    icon: 'shield-check',
  },
  7: {
    title: 'Lộ trình thực hành và dự án capstone',
    shortTitle: 'Dự án thực hành',
    description: 'Thực hành Stanley với CARLA, đọc openpilot và xây dựng bản thử nghiệm DMS bằng Python.',
    category: 'practice',
    icon: 'code',
  },
  8: {
    title: 'Kiểm thử và thẩm định hệ thống chuyên sâu',
    shortTitle: 'System V&V',
    description: 'Đi sâu vào truy xuất yêu cầu, tiêm lỗi HIL, thử nghiệm sa hình và phân tích log đo kiểm.',
    category: 'practice',
    icon: 'flask-conical',
  },
};

const acronyms = [
  'ADAS', 'SAE', 'J3016', 'ODD', 'DDT', 'MRC', 'TOR', 'ISO', 'ASIL', 'HARA', 'SOTIF',
  'DMS', 'OMS', 'HMI', 'PERCLOS', 'EAR', 'TTC', 'AEB', 'ACC', 'LKA', 'LCA', 'ALC',
  'MPC', 'PID', 'LQR', 'EKF', 'UKF', 'GNSS', 'IMU', 'USS', 'FMCW', 'MMWAVE', 'CMOS',
  'HDR', 'LFM', 'FPS', 'E/E', 'ECU', 'CAN-FD', 'CAN', 'SOME/IP', 'AUTOSAR', 'MCU',
  'SoC', 'TOPS', 'HIL', 'SIL', 'MIL', 'VIL', 'NCAP', 'ASPICE', 'RTM', 'CARLA',
  'V&V', 'V2X', 'MDF4', 'BLF', 'ASC', 'PCAP', 'PCAPNG', 'FP', 'FN', 'TP', 'TN',
];

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function cleanTitle(rawTitle) {
  const text = rawTitle
    .replace(/^#+\s*/, '')
    .replace(/\s+#+\s*$/, '')
    .replace(/^CHƯƠNG\s+\d+\s*[:.\-–]?\s*/iu, '')
    .replace(/^\d+(?:\.\d+)*[.)]?\s+/, '')
    .replace(/\*\*|__/g, '')
    .trim();

  // Source headings are in uppercase. Sentence case makes them easier to scan,
  // while the established abbreviations stay recognizable.
  if (text !== text.toLocaleUpperCase('vi')) return text;
  let result = text.toLocaleLowerCase('vi');
  result = result.charAt(0).toLocaleUpperCase('vi') + result.slice(1);
  for (const abbreviation of acronyms.sort((a, b) => b.length - a.length)) {
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(abbreviation)}(?![\\p{L}\\p{N}])`, 'giu');
    result = result.replace(pattern, abbreviation);
  }
  const names = {
    vinfast: 'VinFast', vinai: 'VinAI', tesla: 'Tesla', 'mercedes-benz': 'Mercedes-Benz',
    'việt nam': 'Việt Nam', stanley: 'Stanley', 'comma.ai': 'Comma.ai', openpilot: 'openpilot',
    python: 'Python', mirrorsense: 'MirrorSense', jellyview: 'JellyView', lidar: 'LiDAR',
  };
  for (const [lower, proper] of Object.entries(names)) {
    result = result.replace(new RegExp(escapeRegExp(lower), 'giu'), proper);
  }
  return result;
}

function estimateMinutes(markdown) {
  const codeBlocks = [...markdown.matchAll(/```[^\n]*\n([\s\S]*?)```/g)];
  const codeLines = codeBlocks.reduce((total, block) => total + block[1].split('\n').length, 0);
  const prose = markdown.replace(/```[\s\S]*?```/g, '').replace(/[#*|_$`<>]/g, ' ');
  const words = prose.split(/\s+/u).filter(Boolean).length;
  return Math.max(2, Math.ceil(words / 180 + codeLines / 18));
}

function splitLessons(markdown) {
  const lines = markdown.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split('\n');
  const sections = [];
  const preamble = [];
  let current = null;
  let fence = null;

  for (const line of lines) {
    const fenceMatch = line.match(/^\s{0,3}(`{3,}|~{3,})(.*)$/);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      if (!fence) fence = { character: marker[0], length: marker.length };
      else if (marker[0] === fence.character && marker.length >= fence.length && !fenceMatch[2].trim()) fence = null;
      (current ? current.lines : preamble).push(line);
      continue;
    }

    const heading = !fence && line.match(/^ {0,3}##\s+(.+?)\s*$/);
    if (heading) {
      if (current) sections.push(current);
      current = { title: cleanTitle(heading[1]), lines: [] };
    } else {
      (current ? current.lines : preamble).push(line);
    }
  }
  if (current) sections.push(current);
  const introduction = preamble.filter((line) => !/^#\s/.test(line) && !/^\s*---+\s*$/.test(line)).join('\n').trim();
  if (introduction && sections.length) sections[0].lines.unshift(introduction, '');
  return sections.map((section) => ({
    title: section.title,
    markdown: section.lines.join('\n').replace(/(?:\n\s*---+\s*)+$/g, '').trim(),
  }));
}

const chapterFiles = (await readdir(join(sourceRoot, 'chapters')))
  .filter((file) => /^0[1-8]_.+\.md$/.test(file))
  .sort();

if (chapterFiles.length !== 8) throw new Error(`Expected 8 chapter source files, found ${chapterFiles.length}.`);

const chapters = [];
for (const filename of chapterFiles) {
  const id = Number(filename.slice(0, 2));
  const source = `chapters/${filename}`;
  const markdown = await readFile(join(sourceRoot, source), 'utf8');
  const lessons = splitLessons(markdown).map((lesson, index) => ({
    id: `${id}-${index + 1}`,
    ...lesson,
    minutes: estimateMinutes(lesson.markdown),
    source,
  }));
  if (!lessons.length) throw new Error(`No lesson headings found in ${source}.`);
  chapters.push({ id, ...chapterMetadata[id], lessons });
}

const asilSource = 'explanations/chuong_01/ma_tran_asil_iso26262.md';
const asilMarkdown = await readFile(join(sourceRoot, asilSource), 'utf8');
const readmeMarkdown = await readFile(join(sourceRoot, 'README.md'), 'utf8');
const references = splitLessons(readmeMarkdown).find((section) => /trích dẫn tài liệu tham khảo/iu.test(section.title));
const fusionStart = readmeMarkdown.indexOf('### 2.4.');
const fusionEnd = readmeMarkdown.indexOf('##### 1. Vector', fusionStart);
const resources = [
  {
    id: 'asil-matrix',
    title: 'Giải thích ma trận ASIL theo ISO 26262',
    icon: 'shield',
    description: 'Giải mã Severity, Exposure, Controllability và cách đọc ma trận ASIL.',
    markdown: asilMarkdown.replace(/^#\s+[^\n]+\n/, '').trim(),
    source: asilSource,
  },
  ...(references ? [{ id: 'references', title: 'Tài liệu tham khảo và bản quyền', icon: 'book', description: 'Các nguồn tham khảo được liệt kê trong giáo trình và thông tin về nội dung.', markdown: references.markdown, source: 'README.md' }] : []),
  ...(fusionStart >= 0 && fusionEnd > fusionStart ? [{ id: 'sensor-fusion', title: 'Luồng dung hợp Camera–Radar', icon: 'radar', description: 'Quan sát hai sơ đồ trực quan về dung hợp cảm biến và chu trình ước lượng EKF.', markdown: readmeMarkdown.slice(fusionStart, fusionEnd).trim(), source: 'README.md' }] : []),
];

await mkdir(join(appRoot, 'src'), { recursive: true });
await writeFile(join(appRoot, 'src', 'content.json'), `${JSON.stringify({ chapters, resources }, null, 2)}\n`, 'utf8');
console.log(`Generated ${chapters.length} chapters, ${chapters.reduce((total, chapter) => total + chapter.lessons.length, 0)} lessons and ${resources.length} resources from ${hasRepositorySources ? 'repository sources' : 'packaged materials'}.`);
