const MAIN_SELECTORS = [
  'main article',
  'article',
  'main',
  '[role="main"]',
  '.main-content',
  '.post-content',
  '.article-body',
  '.entry-content',
  '.content',
  '#content',
  '#main',
  '.markdown-body',
  '.repository-content',
  '.docs-content',
  '.post',
  '.article',
  '.story-body',
  '.thread',
  '.comment-body',
  '.thing',
  '.bookcontent',
  '.novelbody',
  '.novel_view',
  '#honbun',
  '.p-novel',
  '#novel_contents',
  '#js_content',
  '#article-view',
  '.article-view',
  '.post__body',
  '.post-body',
  '.body',
  '#body',
];

const SKIP_TAGS = new Set([
  'script', 'style', 'noscript', 'iframe', 'svg', 'path',
  'header', 'footer', 'nav', 'aside', 'form', 'button',
  'figure', 'figcaption', 'canvas', 'video', 'audio',
]);

const BLOCK_TAGS = new Set([
  'p', 'div', 'section', 'article', 'main', 'header', 'footer',
  'nav', 'aside', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'pre', 'table', 'tr', 'figure', 'br', 'hr',
]);

function setStatus(text, state = '') {
  const el = document.getElementById('status');
  if (!el) return;
  el.dataset.state = state;
  el.querySelector('.text').textContent = text;
}

function setSourceMode(mode) {
  document.querySelectorAll('.seg').forEach((b) => {
    b.classList.toggle('active', b.dataset.mode === mode);
  });
  const paste = document.querySelector('.paste-area');
  paste.hidden = mode !== 'paste';
}

function getMeta(doc, name) {
  const els = doc.getElementsByTagName('meta');
  for (const el of els) {
    const attr = (el.getAttribute('name') || el.getAttribute('property') || '').toLowerCase();
    if (attr === name.toLowerCase()) return el.getAttribute('content') || '';
  }
  return '';
}

function pickMain(doc) {
  const root = doc.body;
  if (!root) return null;
  let best = null;
  let bestScore = 0;
  for (const sel of MAIN_SELECTORS) {
    const node = root.querySelector(sel);
    if (!node) continue;
    const text = (node.textContent || '').trim();
    if (text.length < 100) continue;
    const score = text.length - (node.querySelectorAll('a, button, nav').length * 5);
    if (score > bestScore) {
      best = node;
      bestScore = score;
    }
  }
  if (best) return best;
  const all = root.querySelectorAll('div, section, article');
  for (const node of all) {
    const text = (node.textContent || '').trim();
    if (text.length > bestScore) {
      best = node;
      bestScore = text.length;
    }
  }
  return best || root;
}

function clean(root) {
  const cloned = root.cloneNode(true);
  for (const tag of SKIP_TAGS) {
    cloned.querySelectorAll(tag).forEach((el) => el.remove());
  }
  cloned.querySelectorAll('[aria-hidden="true"]').forEach((el) => el.remove());
  cloned.querySelectorAll('.ad, .ads, .advert, .advertisement, .sidebar, .comments, .related, .share, .social, .breadcrumb, .menu, .pagination, .nav, .footer, .header').forEach((el) => el.remove());
  return cloned;
}

function escapeMd(text) {
  return text.replace(/([\\`*_{}\[\]()#+\-.!|])/g, '\\$1');
}

function inline(node) {
  if (node.nodeType === 3) return node.nodeValue.replace(/\s+/g, ' ');
  if (node.nodeType !== 1) return '';
  const tag = node.tagName.toLowerCase();
  if (tag === 'br') return '\n';
  if (tag === 'a') {
    const href = node.getAttribute('href') || '';
    const text = Array.from(node.childNodes).map(inline).join('').trim();
    if (!text || !href || href.startsWith('javascript:')) return text;
    return `[${text}](${href})`;
  }
  if (tag === 'strong' || tag === 'b') {
    const text = Array.from(node.childNodes).map(inline).join('').trim();
    return text ? `**${text}**` : '';
  }
  if (tag === 'em' || tag === 'i') {
    const text = Array.from(node.childNodes).map(inline).join('').trim();
    return text ? `*${text}*` : '';
  }
  if (tag === 'code') {
    const text = node.textContent || '';
    return `\`${text.replace(/`/g, '\\`')}\``;
  }
  if (tag === 'img') {
    const alt = node.getAttribute('alt') || '';
    const src = node.getAttribute('src') || '';
    if (!src) return '';
    return `![${alt}](${src})`;
  }
  if (SKIP_TAGS.has(tag)) return '';
  return Array.from(node.childNodes).map(inline).join('');
}

function block(node, depth = 0) {
  if (node.nodeType === 3) {
    const text = node.nodeValue.trim();
    return text ? text + '\n\n' : '';
  }
  if (node.nodeType !== 1) return '';
  const tag = node.tagName.toLowerCase();
  if (SKIP_TAGS.has(tag)) return '';
  if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
    const level = parseInt(tag[1]);
    const text = Array.from(node.childNodes).map(inline).join('').trim();
    return text ? '#'.repeat(level) + ' ' + text + '\n\n' : '';
  }
  if (tag === 'p') {
    const text = Array.from(node.childNodes).map(inline).join('').trim();
    return text ? text + '\n\n' : '';
  }
  if (tag === 'blockquote') {
    const inner = Array.from(node.childNodes).map((n) => block(n, depth + 1)).join('').trim();
    return inner ? inner.split('\n').map((l) => '> ' + l).join('\n') + '\n\n' : '';
  }
  if (tag === 'pre') {
    const code = node.querySelector('code') || node;
    const text = (code.textContent || '').replace(/\n$/, '');
    return '```\n' + text + '\n```\n\n';
  }
  if (tag === 'ul' || tag === 'ol') {
    const items = Array.from(node.children).filter((c) => c.tagName.toLowerCase() === 'li');
    return items.map((li, i) => {
      const text = Array.from(li.childNodes).map((n) => block(n, depth + 1)).join('').trim();
      const marker = tag === 'ol' ? `${i + 1}.` : '-';
      return text ? marker + ' ' + text.replace(/\n+/g, '\n  ') + '\n' : '';
    }).join('') + '\n';
  }
  if (tag === 'table') {
    return renderTable(node) + '\n\n';
  }
  if (tag === 'hr') return '\n---\n\n';
  if (tag === 'img') {
    const alt = node.getAttribute('alt') || '';
    const src = node.getAttribute('src') || '';
    return src ? `![${alt}](${src})\n\n` : '';
  }
  if (BLOCK_TAGS.has(tag)) {
    return Array.from(node.childNodes).map((n) => block(n, depth + 1)).join('');
  }
  return Array.from(node.childNodes).map((n) => block(n, depth + 1)).join('');
}

function renderTable(table) {
  const rows = Array.from(table.querySelectorAll('tr'));
  if (!rows.length) return '';
  const out = [];
  for (let i = 0; i < rows.length; i++) {
    const cells = Array.from(rows[i].querySelectorAll('th, td'));
    if (!cells.length) continue;
    const line = '| ' + cells.map((c) => Array.from(c.childNodes).map(inline).join('').trim().replace(/\|/g, '\\|')).join(' | ') + ' |';
    out.push(line);
    if (i === 0) {
      out.push('| ' + cells.map(() => '---').join(' | ') + ' |');
    }
  }
  return out.join('\n');
}

function htmlToMd(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const main = pickMain(doc);
  if (!main) return { md: '', meta: {} };
  const cleaned = clean(main);
  const md = block(cleaned).replace(/\n{3,}/g, '\n\n').trim();
  return {
    md,
    meta: {
      title: getMeta(doc, 'title') || doc.title || '',
      description: getMeta(doc, 'description') || '',
      author: getMeta(doc, 'author') || '',
      url: doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || '',
    },
  };
}

function getActiveMode() {
  const active = document.querySelector('.seg.active');
  return active ? active.dataset.mode : 'current';
}

function getCurrentResult() {
  return state.current || { md: '', raw: '', meta: {} };
}

function renderView(view) {
  document.querySelectorAll('.rtab').forEach((b) => {
    b.classList.toggle('active', b.dataset.view === view);
  });
  const out = document.getElementById('output');
  const data = getCurrentResult();
  if (view === 'raw') {
    out.textContent = data.raw || '';
    out.className = 'output raw';
  } else if (view === 'meta') {
    const m = data.meta || {};
    out.textContent = Object.entries(m).map(([k, v]) => `${k.padEnd(12)} ${v}`).join('\n');
    out.className = 'output meta';
  } else {
    out.textContent = data.md || '';
    out.className = 'output';
  }
}

function setBusy(busy) {
  document.getElementById('convert').disabled = busy;
  document.getElementById('copy').disabled = busy || !state.current?.md;
  document.getElementById('download').disabled = busy || !state.current?.md;
}

const state = { current: null };

async function runConversion() {
  const mode = getActiveMode();
  setBusy(true);
  setStatus('Converting…', 'loading');
  try {
    let html = '';
    if (mode === 'paste') {
      const ta = document.querySelector('#html-input');
      html = ta.value.trim();
      if (!html) throw new Error('Paste HTML first');
    } else {
      html = await readTabHTML();
    }
    const { md, meta } = htmlToMd(html);
    const title = (meta.title || 'untitled').replace(/[^\w\s-]/g, '').trim().slice(0, 80) || 'untitled';
    state.current = { md, raw: html, meta: { ...meta, title } };
    document.getElementById('result-section').hidden = false;
    renderView('md');
    setBusy(false);
    setStatus(`Converted ${md.length.toLocaleString()} chars`, 'success');
  } catch (e) {
    setBusy(false);
    setStatus(e.message || 'Failed', 'error');
  }
}

async function readTabHTML() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error('No active tab');
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      return sleep(250).then(() => document.documentElement.outerHTML);
    },
  });
  return result || '';
}

async function copyToClipboard() {
  const data = getCurrentResult();
  if (!data.md) return;
  await navigator.clipboard.writeText(data.md);
  setStatus('Copied to clipboard', 'success');
}

function downloadMarkdown() {
  const data = getCurrentResult();
  if (!data.md) return;
  const title = data.meta?.title || 'untitled';
  const blob = new Blob([data.md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

document.querySelectorAll('.seg').forEach((btn) => {
  btn.addEventListener('click', () => setSourceMode(btn.dataset.mode));
});
document.querySelectorAll('.rtab').forEach((btn) => {
  btn.addEventListener('click', () => renderView(btn.dataset.view));
});
document.getElementById('convert').addEventListener('click', runConversion);
document.getElementById('copy').addEventListener('click', copyToClipboard);
document.getElementById('download').addEventListener('click', downloadMarkdown);
