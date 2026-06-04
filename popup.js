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
  '.chapter-content',
  '.chapter__content',
  '.reading-content',
  '.reading-content__inner',
  '.reader-content',
  '#chapter-content',
  '#chapter-container',
  '#reader-content',
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

const NOISE_TAGS = new Set([
  'script', 'style', 'noscript', 'iframe', 'svg', 'path', 'link', 'meta',
  'form', 'button', 'input', 'select', 'textarea', 'label', 'fieldset', 'legend',
  'figure', 'figcaption', 'canvas', 'video', 'audio', 'source', 'track',
  'object', 'embed', 'param', 'applet',
]);

const BLOCK_TAGS = new Set([
  'p', 'div', 'section', 'article', 'main', 'header', 'footer',
  'nav', 'aside', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'pre', 'table', 'tr', 'figure', 'br', 'hr', 'details', 'summary',
]);

const NOISE_ID_CLASS_RE = new RegExp([
  'reader[-_ ]?settings?',
  'settings?',
  'reading[-_ ]?settings?',
  'font[-_ ]?size',
  'text[-_ ]?size',
  'font[-_ ]?family',
  'font[-_ ]?selector',
  'font[-_ ]?changer',
  'theme[-_ ]?switcher',
  'controls?',
  'control[-_ ]?bar',
  'nav(igation)?',
  'menu',
  'breadcrumb',
  'pagination',
  'pager',
  'sidebar',
  'side[-_ ]?bar',
  'footer',
  'site[-_ ]?footer',
  'page[-_ ]?footer',
  'header',
  'site[-_ ]?header',
  'page[-_ ]?header',
  'banner',
  'share',
  'sharing',
  'social',
  'follow',
  'related',
  'recommend',
  'popular',
  'trending',
  'comment',
  'disqus',
  'reply',
  'respond',
  'form',
  'search',
  'login',
  'signin',
  'signup',
  'register',
  'subscribe',
  'newsletter',
  'ad[-_ ]?(vert|block|slot|wrap|inner|content|container|holder|unit)?',
  'advert(isement|ising)?',
  'sponsor',
  'promo(tion)?',
  'popup',
  'modal',
  'cookie',
  'notice',
  'alert',
  'toolbar',
  'tabpanel',
  'tablist',
  'tags?',
  'categories?',
  'archive',
  'histats',
  'tracker',
  'analytics',
  'stat(s|istics)?',
  'rating',
  'vote',
  'reaction',
  'byline',
  'author[-_ ]?(info|bio|box)',
  'post[-_ ]?meta',
  'article[-_ ]?meta',
  'entry[-_ ]?meta',
  'meta[-_ ]?info',
  'posted',
  'published',
  'modified',
  'chapters?[-_ ]?nav',
  'chapter[-_ ]?navigation',
  'series[-_ ]?nav',
  'next[-_ ]?prev',
  'prev[-_ ]?next',
  'wp[-_ ]?block',
  'elementor',
  'wpb_wrapper',
  'flavor',
  'next[-_ ]?chapter',
  'prev[-_ ]?chapter',
  'chapter[-_ ]?list',
  'table[-_ ]?of[-_ ]?contents',
  'toc',
  'index[-_ ]?list',
  'series[-_ ]?info',
  'series[-_ ]?description',
  'series[-_ ]?cover',
  'bookmark',
  'report',
  'flag',
  'edit[-_ ]?link',
  'screen[-_ ]?reader',
  'skip[-_ ]?link',
  'a11y',
  'sr[-_ ]?only',
  'visually[-_ ]?hidden',
  'overflow[-_ ]?announce',
].join('|'), 'i');

const NOISE_ARIA_LABEL_RE = new RegExp([
  'navigation', 'comment', 'menu', 'footer', 'sidebar', 'header', 'share',
  'social', 'related', 'search', 'login', 'signup', 'register', 'subscribe',
  'newsletter', 'advert', 'ad', 'promo', 'popup', 'modal', 'cookie', 'banner',
  'notice', 'alert', 'chapter', 'series', 'settings', 'theme', 'font',
].join('|'), 'i');

const NOISE_ROLES = new Set([
  'navigation', 'banner', 'contentinfo', 'search', 'complementary',
  'form', 'dialog', 'menu', 'menubar', 'toolbar', 'tablist', 'tab',
  'tabpanel', 'status', 'alert', 'log', 'marquee', 'timer',
]);

const JAVASCRIPT_HREF_RE = /^(javascript|vbscript|data):/i;
const TRACKER_DOMAIN_RE = /(sstatic\d*\.histats\.com|google-analytics\.com|googletagmanager\.com|doubleclick\.net|facebook\.com\/tr|analytics\.twitter\.com|connect\.facebook\.net|mc\.yandex\.ru|hotjar\.com|cdn\.segment\.io|mixpanel\.com|amplitude\.com|fullstory\.com|logrocket\.com)/i;

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
    const linkPenalty = node.querySelectorAll('a').length * 3;
    const score = text.length - linkPenalty;
    if (score > bestScore) {
      best = node;
      bestScore = score;
    }
  }
  if (best) return best;
  const all = root.querySelectorAll('div, section, article');
  for (const node of all) {
    const text = (node.textContent || '').trim();
    const linkPenalty = node.querySelectorAll('a').length * 3;
    const score = text.length - linkPenalty;
    if (score > bestScore) {
      best = node;
      bestScore = score;
    }
  }
  return best || root;
}

function shouldSkipEl(el) {
  if (!el || el.nodeType !== 1) return false;
  if (el.hasAttribute('aria-hidden') && el.getAttribute('aria-hidden') !== 'false') return true;
  const role = (el.getAttribute('role') || '').toLowerCase();
  if (role && NOISE_ROLES.has(role)) return true;
  const ariaLabel = el.getAttribute('aria-label') || '';
  if (ariaLabel && NOISE_ARIA_LABEL_RE.test(ariaLabel)) return true;
  const id = el.id || '';
  if (id && NOISE_ID_CLASS_RE.test(id)) return true;
  const cls = (typeof el.className === 'string' && el.className) || '';
  if (cls && NOISE_ID_CLASS_RE.test(cls)) return true;
  const data = el.getAttribute('data-testid') || el.getAttribute('data-component') || el.getAttribute('data-role') || '';
  if (data && NOISE_ID_CLASS_RE.test(data)) return true;
  return false;
}

function shouldSkipImg(img) {
  const src = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || '';
  const w = parseInt(img.getAttribute('width') || '0', 10);
  const h = parseInt(img.getAttribute('height') || '0', 10);
  const style = (img.getAttribute('style') || '').toLowerCase();
  if (style.includes('display:none') || style.includes('display: none') || style.includes('visibility:hidden') || style.includes('visibility: hidden')) return true;
  if (w > 0 && w < 4) return true;
  if (h > 0 && h < 4) return true;
  if (TRACKER_DOMAIN_RE.test(src)) return true;
  if (/\b(pixel|tracker|trck|counter|stat|spacer|blank|tracking)\b/i.test(src)) return true;
  if (img.getAttribute('alt') === '' && img.getAttribute('role') === 'presentation') return true;
  return false;
}

function clean(root) {
  const cloned = root.cloneNode(true);

  for (const tag of NOISE_TAGS) {
    cloned.querySelectorAll(tag).forEach((el) => el.remove());
  }

  const all = Array.from(cloned.querySelectorAll('*'));
  for (const el of all) {
    if (shouldSkipEl(el)) {
      el.remove();
    }
  }

  cloned.querySelectorAll('img').forEach((img) => {
    if (shouldSkipImg(img)) img.remove();
  });

  cloned.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href') || '';
    if (JAVASCRIPT_HREF_RE.test(href.trim())) {
      const text = a.textContent || '';
      if (text.trim()) {
        const span = cloned.ownerDocument.createElement('span');
        span.textContent = text;
        a.replaceWith(span);
      } else {
        a.remove();
      }
    } else if (href === '#') {
      const text = a.textContent || '';
      if (text.trim()) {
        const span = cloned.ownerDocument.createElement('span');
        span.textContent = text;
        a.replaceWith(span);
      } else {
        a.remove();
      }
    }
  });

  cloned.querySelectorAll('[style]').forEach((el) => el.removeAttribute('style'));
  cloned.querySelectorAll('[width="0"], [height="0"]').forEach((el) => el.remove());

  return cloned;
}

function normalizeWhitespace(s) {
  return s.replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim();
}

function getCleanText(node) {
  return normalizeWhitespace(node.textContent || '');
}

function escapeMd(text) {
  return text.replace(/([\\`*_{}\[\]()#+\-.!|>])/g, '\\$1');
}

function getAttr(node, name) {
  return (node.getAttribute(name) || '').trim();
}

function imgAlt(img) {
  return getAttr(img, 'alt') || getAttr(img, 'title') || 'image';
}

function imgSrc(img) {
  return getAttr(img, 'src') || getAttr(img, 'data-src') || getAttr(img, 'data-lazy-src') || getAttr(img, 'data-original') || '';
}

function inline(node) {
  if (node.nodeType === 3) {
    return node.nodeValue.replace(/[\t ]+/g, ' ').replace(/\n/g, ' ');
  }
  if (node.nodeType !== 1) return '';
  const tag = node.tagName.toLowerCase();
  if (NOISE_TAGS.has(tag)) return '';
  if (shouldSkipEl(node)) return '';
  if (tag === 'br') return '\n';
  if (tag === 'a') {
    const href = getAttr(node, 'href');
    const text = Array.from(node.childNodes).map(inline).join('').trim();
    if (!text) return '';
    if (!href) return text;
    if (JAVASCRIPT_HREF_RE.test(href) || href === '#') return text;
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
  if (tag === 'del' || tag === 's' || tag === 'strike') {
    const text = Array.from(node.childNodes).map(inline).join('').trim();
    return text ? `~~${text}~~` : '';
  }
  if (tag === 'code' && node.parentElement && node.parentElement.tagName.toLowerCase() !== 'pre') {
    const text = node.textContent || '';
    return text ? `\`${text.replace(/`/g, '\\`')}\`` : '';
  }
  if (tag === 'img') {
    const alt = imgAlt(node);
    const src = imgSrc(node);
    if (!src) return '';
    return `![${alt}](${src})`;
  }
  if (tag === 'mark') {
    const text = Array.from(node.childNodes).map(inline).join('').trim();
    return text ? `==${text}==` : '';
  }
  if (tag === 'sub') {
    const text = Array.from(node.childNodes).map(inline).join('').trim();
    return text ? `~${text}~` : '';
  }
  if (tag === 'sup') {
    const text = Array.from(node.childNodes).map(inline).join('').trim();
    return text ? `^${text}^` : '';
  }
  if (tag === 'abbr' || tag === 'acronym') {
    const title = getAttr(node, 'title');
    const text = Array.from(node.childNodes).map(inline).join('').trim();
    if (title && text) return `${text} (${title})`;
    return text;
  }
  if (tag === 'kbd' || tag === 'samp') {
    const text = node.textContent || '';
    return text ? `\`${text}\`` : '';
  }
  if (tag === 'q') {
    const text = Array.from(node.childNodes).map(inline).join('').trim();
    return text ? `“${text}”` : '';
  }
  if (tag === 'cite') {
    const text = Array.from(node.childNodes).map(inline).join('').trim();
    return text ? `*${text}*` : '';
  }
  if (tag === 'dfn') {
    const text = Array.from(node.childNodes).map(inline).join('').trim();
    return text ? `*${text}*` : '';
  }
  if (tag === 'small') {
    return Array.from(node.childNodes).map(inline).join('');
  }
  if (tag === 'u') {
    const text = Array.from(node.childNodes).map(inline).join('').trim();
    return text;
  }
  if (tag === 'span' || tag === 'font') {
    return Array.from(node.childNodes).map(inline).join('');
  }
  return Array.from(node.childNodes).map(inline).join('');
}

function isBlock(tag) {
  return BLOCK_TAGS.has(tag) || ['dl', 'dt', 'dd', 'address', 'hr', 'div'].includes(tag);
}

function isListItem(node) {
  return node.nodeType === 1 && node.tagName.toLowerCase() === 'li';
}

function isChecklistItem(li) {
  const text = li.textContent || '';
  return /^\s*\[[ xX✓]\]\s*/.test(text);
}

function block(node, depth = 0) {
  if (node.nodeType === 3) {
    const text = node.nodeValue.replace(/\s+/g, ' ').trim();
    return text ? text + '\n\n' : '';
  }
  if (node.nodeType !== 1) return '';
  const tag = node.tagName.toLowerCase();
  if (NOISE_TAGS.has(tag)) return '';
  if (shouldSkipEl(node)) return '';

  if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
    const level = parseInt(tag[1]);
    const text = normalizeWhitespace(Array.from(node.childNodes).map(inline).join(''));
    if (!text) return '';
    return '#'.repeat(level) + ' ' + text + '\n\n';
  }

  if (tag === 'p') {
    const text = normalizeWhitespace(Array.from(node.childNodes).map(inline).join(''));
    return text ? text + '\n\n' : '';
  }

  if (tag === 'blockquote') {
    const inner = normalizeWhitespace(Array.from(node.childNodes).map((n) => block(n, depth + 1)).join(''));
    if (!inner) return '';
    return inner.split('\n').map((l) => l ? '> ' + l : '>').join('\n') + '\n\n';
  }

  if (tag === 'pre') {
    const code = node.querySelector('code') || node;
    const lang = getAttr(code, 'class').match(/language-(\S+)/i)?.[1] || getAttr(node, 'class').match(/language-(\S+)/i)?.[1] || '';
    const text = (code.textContent || '').replace(/\n$/, '');
    return '```' + lang + '\n' + text + '\n```\n\n';
  }

  if (tag === 'ul' || tag === 'ol') {
    const items = Array.from(node.children).filter(isListItem);
    if (!items.length) {
      return Array.from(node.childNodes).map((n) => block(n, depth + 1)).join('');
    }
    let out = '';
    items.forEach((li, i) => {
      const marker = tag === 'ol' ? `${i + 1}.` : '-';
      const inner = normalizeWhitespace(Array.from(li.childNodes).map((n) => block(n, depth + 1)).join(''));
      if (!inner) return;
      const checklist = isChecklistItem(li);
      let content = inner;
      if (checklist) {
        const m = li.textContent.match(/^\s*\[( |x|X|✓)\]\s*/);
        const checked = m && m[1].toLowerCase() === 'x' || (m && m[1] === '✓');
        content = inner.replace(/^\s*/, '');
        const actualMarker = checked ? '- [x]' : '- [ ]';
        out += actualMarker + ' ' + content.replace(/\n+/g, '\n  ') + '\n';
      } else {
        out += marker + ' ' + content.replace(/\n+/g, '\n  ') + '\n';
      }
    });
    return out + '\n';
  }

  if (tag === 'dl') {
    let out = '';
    Array.from(node.children).forEach((child) => {
      const t = child.tagName.toLowerCase();
      if (t === 'dt') {
        const text = normalizeWhitespace(Array.from(child.childNodes).map(inline).join(''));
        if (text) out += '**' + text + '**\n';
      } else if (t === 'dd') {
        const text = normalizeWhitespace(Array.from(child.childNodes).map(inline).join(''));
        if (text) out += ': ' + text + '\n';
      }
    });
    return out + '\n';
  }

  if (tag === 'table') {
    return renderTable(node) + '\n\n';
  }

  if (tag === 'hr') return '\n---\n\n';

  if (tag === 'img') {
    const alt = imgAlt(node);
    const src = imgSrc(node);
    if (!src) return '';
    return `![${alt}](${src})\n\n`;
  }

  if (tag === 'figure') {
    const img = node.querySelector('img');
    const cap = node.querySelector('figcaption');
    let out = '';
    if (img) {
      const alt = imgAlt(img);
      const src = imgSrc(img);
      if (src) out += `![${alt}](${src})\n\n`;
    }
    if (cap) {
      const text = normalizeWhitespace(Array.from(cap.childNodes).map(inline).join(''));
      if (text) out += `*${text}*\n\n`;
    }
    return out;
  }

  if (tag === 'details') {
    const summary = node.querySelector('summary');
    const inner = Array.from(node.childNodes).filter((n) => n.nodeType !== 1 || n.tagName.toLowerCase() !== 'summary').map((n) => block(n, depth + 1)).join('');
    const sumText = summary ? normalizeWhitespace(Array.from(summary.childNodes).map(inline).join('')) : 'Details';
    return `<details>\n<summary>${sumText}</summary>\n\n${inner.trim()}\n\n</details>\n\n`;
  }

  if (BLOCK_TAGS.has(tag) || tag === 'div' || tag === 'section' || tag === 'article') {
    return Array.from(node.childNodes).map((n) => block(n, depth + 1)).join('');
  }

  return Array.from(node.childNodes).map((n) => block(n, depth + 1)).join('');
}

function renderTable(table) {
  const rows = Array.from(table.querySelectorAll('tr'));
  if (!rows.length) return '';
  const out = [];
  let hasHeader = false;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const ths = Array.from(row.querySelectorAll('th'));
    const tds = Array.from(row.querySelectorAll('td'));
    const cells = ths.length ? ths : tds;
    if (!cells.length) continue;
    if (ths.length) hasHeader = true;
    const line = '| ' + cells.map((c) => normalizeWhitespace(Array.from(c.childNodes).map(inline).join('')).replace(/\|/g, '\\|').replace(/\n+/g, ' ')).join(' | ') + ' |';
    out.push(line);
    if (i === 0 && !hasHeader && tds.length) {
      out.push('| ' + cells.map(() => '---').join(' | ') + ' |');
    }
  }
  if (out.length && !hasHeader && out[0].startsWith('|') && out.length > 1) {
    // already added separator after first row above
  } else if (out.length && hasHeader) {
    out.splice(1, 0, '| ' + Array.from(rows[0].querySelectorAll('th')).map(() => '---').join(' | ') + ' |');
  }
  return out.join('\n');
}

function dedupHeadings(root, pageTitle) {
  if (!pageTitle) return;
  const norm = pageTitle.toLowerCase().replace(/\s+/g, ' ').trim();
  if (!norm) return;
  const firstHeading = root.querySelector('h1, h2, h3');
  if (!firstHeading) return;
  const headingText = (firstHeading.textContent || '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (headingText === norm) {
    firstHeading.remove();
  }
}

function collapseBlankLines(s) {
  return s.replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

function htmlToMd(html, opts = {}) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const main = pickMain(doc);
  if (!main) return { md: '', meta: {} };
  const cleaned = clean(main);

  const pageTitle = getMeta(doc, 'title') || doc.title || '';
  if (opts.dedupFirstHeading !== false) {
    dedupHeadings(cleaned, pageTitle);
  }

  const md = collapseBlankLines(block(cleaned));

  return {
    md,
    meta: {
      title: pageTitle,
      description: getMeta(doc, 'description') || '',
      author: getMeta(doc, 'author') || '',
      url: doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || '',
    },
  };
}

const state = { current: null };

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
