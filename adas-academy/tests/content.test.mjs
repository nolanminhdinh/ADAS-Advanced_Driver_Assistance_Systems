import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, access, mkdtemp, mkdir, copyFile, cp, rm } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { quizQuestions } from '../src/quiz-data.js';

const execute = promisify(execFile);
const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const materialsRoot = join(appRoot, 'public', 'materials');
const generator = join(appRoot, 'scripts', 'generate-content.mjs');
let content;

before(async () => {
  await execute(process.execPath, [generator], { cwd: appRoot });
  content = JSON.parse(await readFile(join(appRoot, 'src', 'content.json'), 'utf8'));
});

test('the curriculum contains eight chapters and 39 distinct, readable lessons', () => {
  assert.deepEqual(content.chapters.map((chapter) => chapter.id), [1, 2, 3, 4, 5, 6, 7, 8]);
  const lessons = content.chapters.flatMap((chapter) => chapter.lessons);
  assert.equal(lessons.length, 39);
  assert.equal(new Set(lessons.map((lesson) => lesson.id)).size, lessons.length);
  for (const chapter of content.chapters) {
    assert.ok(['foundation', 'engineering', 'practice'].includes(chapter.category));
    assert.ok(chapter.title.length > 0);
    for (const [index, lesson] of chapter.lessons.entries()) {
      assert.equal(lesson.id, `${chapter.id}-${index + 1}`);
      assert.ok(lesson.title.length > 0);
      assert.ok(lesson.markdown.trim().length > 0, `${lesson.id} must contain source content`);
      assert.ok(Number.isInteger(lesson.minutes) && lesson.minutes >= 2);
    }
  }
});

test('every question refers to an existing lesson in its chapter and has a valid answer', () => {
  const lessonChapters = new Map(content.chapters.flatMap((chapter) => chapter.lessons.map((lesson) => [lesson.id, chapter.id])));
  assert.equal(quizQuestions.length, 16);
  assert.equal(new Set(quizQuestions.map((question) => question.id)).size, quizQuestions.length);
  for (const question of quizQuestions) {
    assert.equal(lessonChapters.get(question.lessonId), question.chapter, `Invalid lesson reference for ${question.id}`);
    assert.equal(question.options.length, 4);
    assert.equal(new Set(question.options).size, question.options.length);
    assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < question.options.length);
    assert.ok(question.question.trim() && question.explanation.trim());
  }
  for (let chapter = 1; chapter <= 8; chapter++) {
    assert.equal(quizQuestions.filter((question) => question.chapter === chapter).length, 2);
  }
});

test('all referenced Markdown sources are packaged at their public materials paths', async () => {
  const sources = new Set([
    ...content.chapters.flatMap((chapter) => chapter.lessons.map((lesson) => lesson.source)),
    ...content.resources.map((resource) => resource.source),
    'explanations/README.md',
  ]);
  assert.equal(content.resources.length, 3);
  const fusion = content.resources.find(resource => resource.id === 'sensor-fusion');
  assert.equal((fusion.markdown.match(/```mermaid/g) || []).length, 2);
  for (const source of sources) {
    const absolutePath = resolve(materialsRoot, source);
    assert.ok(absolutePath.startsWith(`${materialsRoot}${sep}`), `Source escapes materials directory: ${source}`);
    await access(absolutePath);
    assert.ok((await readFile(absolutePath, 'utf8')).trim().length > 0, `Empty source: ${source}`);
  }
});

test('the packaged app rebuilds the identical curriculum without its parent repository', async () => {
  const temporaryRoot = await mkdtemp(join(tmpdir(), 'adas-academy-content-'));
  try {
    const isolatedApp = join(temporaryRoot, 'app');
    const isolatedScriptDirectory = join(isolatedApp, 'scripts');
    await mkdir(isolatedScriptDirectory, { recursive: true });
    await copyFile(generator, join(isolatedScriptDirectory, 'generate-content.mjs'));
    await cp(materialsRoot, join(isolatedApp, 'public', 'materials'), { recursive: true });
    const result = await execute(process.execPath, [join(isolatedScriptDirectory, 'generate-content.mjs')], { cwd: isolatedApp });
    assert.match(result.stdout, /packaged materials/);
    const isolatedContent = JSON.parse(await readFile(join(isolatedApp, 'src', 'content.json'), 'utf8'));
    assert.deepEqual(isolatedContent, content);
  } finally {
    // Only clean the dedicated directory just created within the OS temp root.
    const temporaryParent = `${resolve(tmpdir())}${sep}`;
    assert.ok(resolve(temporaryRoot).startsWith(temporaryParent));
    assert.ok(temporaryRoot.includes('adas-academy-content-'));
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});
