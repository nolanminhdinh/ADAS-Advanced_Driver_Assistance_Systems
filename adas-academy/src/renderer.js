import { Marked } from 'marked';
import DOMPurify from 'dompurify';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const escapeHTML = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const renderMath = (text, displayMode) => katex.renderToString(text.trim(), {
  displayMode,
  throwOnError: false,
  strict: 'ignore',
  trust: false,
});

// Tokenizing math before Markdown handles emphasis preserves LaTeX underscores
// and backslashes, while Marked still treats fenced code and code spans as code.
const mathExtensions = [
  {
    name: 'mathBlock',
    level: 'block',
    start(source) {
      const index = source.search(/^[ \t]{0,3}\$\$/m);
      return index < 0 ? undefined : index;
    },
    tokenizer(source) {
      const match = /^[ \t]{0,3}\$\$([\s\S]+?)\$\$[ \t]*(?:\n|$)/.exec(source);
      if (match) return { type: 'mathBlock', raw: match[0], text: match[1] };
    },
    renderer(token) {
      return `<div class="math-block">${renderMath(token.text, true)}</div>\n`;
    },
  },
  {
    name: 'mathInline',
    level: 'inline',
    start(source) {
      const index = source.indexOf('$');
      return index < 0 ? undefined : index;
    },
    tokenizer(source) {
      const display = /^\$\$([\s\S]+?)\$\$/.exec(source);
      if (display) return { type: 'mathInline', raw: display[0], text: display[1], display: true };
      const inline = /^\$((?:\\.|[^$\\\n])+?)\$(?!\$)/.exec(source);
      if (inline && !/^\s|\s$/.test(inline[1])) {
        return { type: 'mathInline', raw: inline[0], text: inline[1], display: false };
      }
    },
    renderer(token) {
      return renderMath(token.text, token.display);
    },
  },
];

function materialLink(href, source) {
  if (!/\.md(?:[?#]|$)/i.test(href) || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(href)) return href;
  if (href.startsWith('/materials/')) return href;
  try {
    const origin = 'https://adas-academy.invalid';
    const sourcePath = String(source).replaceAll('\\', '/').replace(/^\/?materials\//, '').replace(/^\/+/, '');
    const base = new URL(`/materials/${sourcePath || 'README.md'}`, origin);
    const resolved = new URL(href.startsWith('/') ? `/materials/${href.replace(/^\/+/, '')}` : href, base);
    return resolved.pathname.startsWith('/materials/') ? `${resolved.pathname}${resolved.search}${resolved.hash}` : href;
  } catch {
    return href;
  }
}

/** Render repository Markdown as sanitized lesson HTML. */
export function renderMarkdown(markdown, source = '') {
  const parser = new Marked({
    gfm: true,
    breaks: false,
    async: false,
    extensions: mathExtensions,
    renderer: {
      code({ text, lang }) {
        const language = (lang || '').split(/\s/)[0].toLowerCase().replace(/[^\w+-]/g, '');
        if (language === 'mermaid') return `<pre class="mermaid">${escapeHTML(text)}</pre>\n`;
        const languageClass = language ? ` class="language-${language}"` : '';
        return `<div class="code-block"><button type="button" class="copy-code" aria-label="Chép đoạn mã">Chép mã</button><pre><code${languageClass}>${escapeHTML(text)}\n</code></pre></div>\n`;
      },
      table({ header, rows, align }) {
        const cell = (item, index, tag) => {
          const alignment = ['left', 'center', 'right'].includes(align[index]) ? ` style="text-align:${align[index]}"` : '';
          return `<${tag}${tag === 'th' ? ' scope="col"' : ''}${alignment}>${this.parser.parseInline(item.tokens)}</${tag}>`;
        };
        const heading = `<thead><tr>${header.map((item, index) => cell(item, index, 'th')).join('')}</tr></thead>`;
        const body = `<tbody>${rows.map((row) => `<tr>${row.map((item, index) => cell(item, index, 'td')).join('')}</tr>`).join('')}</tbody>`;
        return `<div class="table-scroll" tabindex="0" role="region" aria-label="Bảng nội dung"><table>${heading}${body}</table></div>\n`;
      },
      link({ href, title, tokens }) {
        const url = materialLink(href, source);
        const titleAttribute = title ? ` title="${escapeHTML(title)}"` : '';
        const externalAttributes = /^https?:\/\//i.test(url) ? ' target="_blank" rel="noopener noreferrer"' : '';
        return `<a href="${escapeHTML(url)}"${titleAttribute}${externalAttributes}>${this.parser.parseInline(tokens)}</a>`;
      },
    },
  });

  const cleanHTML = DOMPurify.sanitize(parser.parse(String(markdown ?? '')), {
    ADD_ATTR: ['target', 'rel'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'style'],
  });

  // Raw Markdown HTML can contain links too; apply the same external-link policy.
  const template = document.createElement('template');
  template.innerHTML = cleanHTML;
  for (const link of template.content.querySelectorAll('a[href]')) {
    const href = link.getAttribute('href');
    if (/^https?:\/\//i.test(href) || /^\/\//.test(href)) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    } else if (link.target === '_blank') {
      link.rel = 'noopener noreferrer';
    }
  }
  return template.innerHTML;
}

let mermaidPromise;

function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'neutral',
        fontFamily: 'inherit',
        suppressErrorRendering: true,
      });
      return mermaid;
    }).catch((error) => {
      mermaidPromise = undefined;
      throw error;
    });
  }
  return mermaidPromise;
}

function diagramFallback(node, source) {
  node.classList.remove('mermaid');
  node.classList.add('diagram-fallback');
  node.setAttribute('aria-label', 'Mã nguồn sơ đồ');
  node.textContent = `Chưa thể hiển thị sơ đồ. Bạn có thể đọc mã nguồn bên dưới:\n\n${source}`;
}

/** Enhance only diagrams in this lesson; a failed diagram preserves its source. */
export async function enhanceDiagrams(container) {
  if (!container?.querySelectorAll) return;
  const nodes = [...container.querySelectorAll('.mermaid:not([data-processed])')];
  if (container.matches?.('.mermaid:not([data-processed])')) nodes.unshift(container);
  if (!nodes.length) return;
  const sources = new Map(nodes.map((node) => [node, node.textContent]));
  let mermaid;
  try {
    mermaid = await loadMermaid();
  } catch {
    for (const node of nodes) diagramFallback(node, sources.get(node));
    return;
  }
  for (const node of nodes) {
    if (!container.contains(node) || node.hasAttribute('data-processed')) continue;
    try {
      await mermaid.run({ nodes: [node] });
    } catch {
      diagramFallback(node, sources.get(node));
    }
  }
}
