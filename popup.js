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

// Per-site extraction rules (curl.md style). Highest-priority content roots
// for known sites; falls back to the generic candidate scan when no rule hits.
const SITE_RULES = [
  { match: /(^|\.)github\.com$/i, contentSelectors: ['.markdown-body', 'article.markdown-body', '#readme article', '.repository-content'] },
  { match: /(^|\.)wikipedia\.org$/i, contentSelectors: ['#mw-content-text .mw-parser-output', '#mw-content-text', '#bodyContent'] },
  { match: /(^|\.)developer\.mozilla\.org$/i, contentSelectors: ['main#content', 'article.main-page-content', '.main-page-content'] },
  { match: /(^|\.)stackoverflow\.com$/i, contentSelectors: ['#mainbar', '.question', '.answer'] },
  { match: /(^|\.)medium\.com$/i, contentSelectors: ['article'] },
  { match: /(^|\.)reddit\.com$/i, contentSelectors: ['shreddit-post', '[data-test-id="post-content"]', '.thing'] },
  { match: /(^|\.)dev\.to$/i, contentSelectors: ['#article-body', '.crayons-article__main', 'article'] },
  { match: /(^|\.)substack\.com$/i, contentSelectors: ['.available-content', 'article'] },
];

function matchRule(hostname) {
  if (!hostname) return null;
  return SITE_RULES.find((r) => r.match.test(hostname)) || null;
}

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
const ABSOLUTE_HREF_RE = /^(https?:|mailto:|tel:|data:|javascript:|vbscript:|#)/i;
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

// ── Content extraction (curl.md-style pipeline) ──────────────────────────────

function linkTextLength(node) {
  let total = 0;
  node.querySelectorAll('a').forEach((a) => {
    total += (a.textContent || '').trim().length;
  });
  return total;
}

function linkDensity(node) {
  const text = (node.textContent || '').trim().length;
  if (!text) return 0;
  return linkTextLength(node) / text;
}

// Readability-flavoured score: reward prose, punish link-heavy nav blocks.
function scoreCandidate(node) {
  const text = (node.textContent || '').trim();
  const len = text.length;
  if (len < 50) return 0;
  const density = linkDensity(node);
  const paras = node.querySelectorAll('p').length;
  const commas = (text.match(/,|，|、/g) || []).length;
  let score = len;
  score -= len * density * 1.5;
  score += paras * 25;
  score += commas * 3;
  if (density > 0.5) score *= 0.3;
  return score;
}

// Collect an ordered list of candidate content roots instead of committing to
// one. Site-rule selectors are tried first, then semantic tags, then the
// generic selector list, then a density scan.
function collectCandidates(doc, rule) {
  const root = doc.body;
  if (!root) return [];
  const seen = new Set();
  const candidates = [];
  const add = (node, selector, boost = 0) => {
    if (!node || node.nodeType !== 1 || seen.has(node)) return;
    const text = (node.textContent || '').trim();
    if (text.length < 50) return;
    seen.add(node);
    candidates.push({ node, selector, score: scoreCandidate(node) + boost });
  };

  if (rule && rule.contentSelectors) {
    for (const sel of rule.contentSelectors) {
      root.querySelectorAll(sel).forEach((n) => add(n, 'rule:' + sel, 1e7));
    }
  }
  ['main article', 'article', 'main', '[role="main"]'].forEach((sel) => {
    root.querySelectorAll(sel).forEach((n) => add(n, sel));
  });
  for (const sel of MAIN_SELECTORS) {
    root.querySelectorAll(sel).forEach((n) => add(n, sel));
  }
  const densityNodes = root.querySelectorAll('div, section, article');
  const scanLimit = Math.min(densityNodes.length, 4000); // bound work on huge pages
  for (let i = 0; i < scanLimit; i++) add(densityNodes[i], 'density');

  candidates.sort((a, b) => b.score - a.score);
  return candidates;
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

// Pass 1: strip noise. Unlike a blunt class match, an element is protected from
// removal when it holds most of the candidate's text — that means we'd be
// gutting real content (the over-strip that produced "header only" output).
function stripNoise(root) {
  for (const tag of NOISE_TAGS) {
    root.querySelectorAll(tag).forEach((el) => el.remove());
  }

  const totalText = (root.textContent || '').trim().length || 1;

  for (const el of Array.from(root.querySelectorAll('*'))) {
    if (!root.contains(el)) continue;
    if (!shouldSkipEl(el)) continue;
    const elText = (el.textContent || '').trim().length;
    if (elText > totalText * 0.6) continue; // too big to be noise — keep content
    el.remove();
  }

  // Link-density removal: drop nav/menu/related blocks made mostly of links.
  for (const el of Array.from(root.querySelectorAll('div, section, ul, ol, nav'))) {
    if (!root.contains(el)) continue;
    const text = (el.textContent || '').trim();
    if (text.length < 40) continue;
    const nonLink = text.length - linkTextLength(el);
    if (linkDensity(el) > 0.6 && nonLink < 80) el.remove();
  }

  root.querySelectorAll('img').forEach((img) => {
    if (shouldSkipImg(img)) img.remove();
  });

  root.querySelectorAll('a[href]').forEach((a) => {
    const href = (a.getAttribute('href') || '').trim();
    if (JAVASCRIPT_HREF_RE.test(href) || href === '#') {
      const text = a.textContent || '';
      if (text.trim()) {
        const span = a.ownerDocument.createElement('span');
        span.textContent = text;
        a.replaceWith(span);
      } else {
        a.remove();
      }
    }
  });

  root.querySelectorAll('[style]').forEach((el) => el.removeAttribute('style'));
  root.querySelectorAll('[width="0"], [height="0"]').forEach((el) => el.remove());

  return root;
}

// Pass 2: resolve relative href/src to absolute using the page base URL.
function resolveLinks(root, baseUrl) {
  if (!baseUrl) return root;
  const fix = (el, attr) => {
    const v = (el.getAttribute(attr) || '').trim();
    if (!v || ABSOLUTE_HREF_RE.test(v)) return;
    try {
      el.setAttribute(attr, new URL(v, baseUrl).href);
    } catch (e) {
      /* leave as-is on invalid URL */
    }
  };
  root.querySelectorAll('a[href]').forEach((a) => fix(a, 'href'));
  root.querySelectorAll('img').forEach((img) => {
    ['src', 'data-src', 'data-lazy-src', 'data-original'].forEach((at) => {
      if (img.hasAttribute(at)) fix(img, at);
    });
  });
  return root;
}

// Pass 3: flatten syntax-highlighted code so span-soup doesn't leak markers.
function normalizePreCode(root) {
  root.querySelectorAll('pre').forEach((pre) => {
    pre.querySelectorAll('.line-number, .line-numbers-rows, .linenos, .gutter, [aria-hidden="true"]').forEach((n) => n.remove());
    const code = pre.querySelector('code') || pre;
    if (code.children.length > 0) {
      const text = code.textContent || '';
      while (code.firstChild) code.removeChild(code.firstChild);
      code.textContent = text;
    }
  });
  return root;
}

// Pass 4: remove now-empty wrappers left behind by the earlier passes.
function stripEmpty(root) {
  const SEL = 'div, section, span, p, li, ul, ol, article, header, footer, aside, blockquote';
  let changed = true;
  let guard = 0;
  while (changed && guard < 5) {
    changed = false;
    guard++;
    for (const el of Array.from(root.querySelectorAll(SEL))) {
      if (!root.contains(el)) continue;
      const text = (el.textContent || '').trim();
      const hasMedia = el.querySelector('img, pre, table, code, hr');
      if (!text && !hasMedia) {
        el.remove();
        changed = true;
      }
    }
  }
  return root;
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

// Escape markdown link/image text and wrap awkward URLs so parentheses or
// spaces in a destination can't break the surrounding [text](url) syntax
// (e.g. Wikipedia's .../Convention_(norm)).
function mdLinkText(s) {
  return (s || '').replace(/([\[\]])/g, '\\$1');
}

function mdUrl(href) {
  const h = (href || '').trim();
  if (!h) return h;
  if (/[\s()<>]/.test(h)) return '<' + h.replace(/</g, '%3C').replace(/>/g, '%3E') + '>';
  return h;
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
    return `[${mdLinkText(text)}](${mdUrl(href)})`;
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
    return `![${mdLinkText(alt)}](${mdUrl(src)})`;
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
    return `![${mdLinkText(alt)}](${mdUrl(src)})\n\n`;
  }

  if (tag === 'figure') {
    const img = node.querySelector('img');
    const cap = node.querySelector('figcaption');
    let out = '';
    if (img) {
      const alt = imgAlt(img);
      const src = imgSrc(img);
      if (src) out += `![${mdLinkText(alt)}](${mdUrl(src)})\n\n`;
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

// Run the full clean+convert pipeline on a single candidate node.
function convertNode(srcNode, doc, baseUrl, opts) {
  if (!srcNode) return '';
  const clone = srcNode.cloneNode(true);
  // Neutralise the root's own identity so it can't be skipped as "noise" and
  // so it survives the empty/strip passes — descendants are still evaluated.
  if (clone.removeAttribute) {
    ['class', 'id', 'role', 'aria-label', 'aria-hidden'].forEach((a) => clone.removeAttribute(a));
  }
  stripNoise(clone);
  resolveLinks(clone, baseUrl);
  normalizePreCode(clone);
  stripEmpty(clone);
  if (!opts || opts.dedupFirstHeading !== false) {
    dedupHeadings(clone, opts && opts.pageTitle);
  }
  let md;
  try {
    md = block(clone);
  } catch (e) {
    // Deeply nested / pathological DOM can overflow the recursion — fall back
    // to plain text so we still return content instead of crashing the popup.
    md = normalizeWhitespace(clone.textContent || '');
  }
  return collapseBlankLines(md);
}

// curl.md-style "thin content" guard: a few chars, a couple lines, or no prose.
function isThin(md) {
  if (!md) return true;
  const trimmed = md.trim();
  if (trimmed.length < 120) return true;
  const lines = trimmed.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length <= 3) return true;
  const hasProse = lines.some((l) => {
    const t = l.trim();
    if (/^#{1,6}\s/.test(t)) return false;
    return t.length > 60;
  });
  return !hasProse;
}

// Try candidates in score order, stop at the first solid one, and always keep a
// full-body fallback. Pick the best non-thin result by length so a header-only
// candidate can never win when a richer extraction exists.
function extractBest(doc, opts, rule, baseUrl) {
  const candidates = collectCandidates(doc, rule).slice(0, 8);
  const results = [];
  for (const c of candidates) {
    const md = convertNode(c.node, doc, baseUrl, opts);
    results.push({ md, method: c.selector, len: md.trim().length });
    if (!isThin(md)) break;
  }
  const bestSoFar = results.slice().sort((a, b) => b.len - a.len)[0];
  if (!bestSoFar || isThin(bestSoFar.md)) {
    const bodyMd = convertNode(doc.body, doc, baseUrl, opts);
    results.push({ md: bodyMd, method: 'body', len: bodyMd.trim().length });
  }
  const nonThin = results.filter((r) => !isThin(r.md));
  const pool = nonThin.length ? nonThin : results;
  pool.sort((a, b) => b.len - a.len);
  return pool[0] || { md: '', method: 'none' };
}

function detectSpa(doc) {
  const mounts = ['#__next', '#__nuxt', '#app', '#root', '[data-reactroot]', '[data-server-rendered]'];
  for (const sel of mounts) {
    const el = doc.querySelector(sel);
    if (el && (el.textContent || '').trim().length < 50) return true;
  }
  return false;
}

function getBaseUrl(doc, fallback) {
  const tryUrl = (v) => {
    if (!v) return '';
    try {
      return new URL(v).href;
    } catch (e) {
      return '';
    }
  };
  return (
    tryUrl(doc.querySelector('base[href]')?.getAttribute('href')) ||
    tryUrl(doc.querySelector('link[rel="canonical"]')?.getAttribute('href')) ||
    tryUrl(getMeta(doc, 'og:url')) ||
    tryUrl(fallback) ||
    ''
  );
}

function getHostname(url) {
  if (!url) return '';
  try {
    return new URL(url).hostname;
  } catch (e) {
    return '';
  }
}

function estimateTokens(text) {
  if (!text) return 0;
  return Math.round(text.length / 4); // ~4 chars/token, approximate
}

function extractMeta(doc) {
  const meta = {
    title: getMeta(doc, 'og:title') || getMeta(doc, 'title') || doc.title || '',
    description: getMeta(doc, 'description') || getMeta(doc, 'og:description') || '',
    author: getMeta(doc, 'author') || getMeta(doc, 'article:author') || '',
    published: getMeta(doc, 'article:published_time') || getMeta(doc, 'og:article:published_time') || '',
    site: getMeta(doc, 'og:site_name') || '',
    url: doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || getMeta(doc, 'og:url') || '',
  };

  try {
    doc.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
      const raw = s.textContent || '';
      if (!raw || raw.length > 250000) return; // skip empty / pathologically large blobs
      const data = JSON.parse(raw);
      if (!data) return;
      let nodes = Array.isArray(data) ? data : [data];
      const graphed = [];
      for (const n of nodes) {
        if (n && Array.isArray(n['@graph'])) graphed.push(...n['@graph']);
        else graphed.push(n);
      }
      for (const obj of graphed) {
        if (!obj || typeof obj !== 'object') continue;
        if (!meta.title && obj.headline) meta.title = String(obj.headline);
        if (!meta.description && obj.description) meta.description = String(obj.description);
        if (!meta.published && obj.datePublished) meta.published = String(obj.datePublished);
        if (!meta.author && obj.author) {
          meta.author = typeof obj.author === 'string' ? obj.author : (obj.author.name || '');
        }
      }
    });
  } catch (e) {
    /* ignore malformed JSON-LD */
  }
  return meta;
}

function htmlToMd(html, opts = {}) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  if (!doc || !doc.body) return { md: '', meta: {} };

  const meta = extractMeta(doc);
  const baseUrl = getBaseUrl(doc, opts.baseUrl);
  const rule = matchRule(getHostname(baseUrl || meta.url || opts.baseUrl));
  const spa = detectSpa(doc);

  const best = extractBest(doc, { ...opts, pageTitle: meta.title }, rule, baseUrl);

  meta.method = best.method + (rule ? ' +rule' : '');
  meta.tokens = String(estimateTokens(best.md));
  if (spa) meta.spa = 'yes';

  return { md: best.md, meta };
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
    let baseUrl = '';
    if (mode === 'paste') {
      const ta = document.querySelector('#html-input');
      html = ta.value.trim();
      if (!html) throw new Error('Paste HTML first');
    } else {
      const captured = await readTabHTML();
      html = captured.html;
      baseUrl = captured.url;
    }
    const { md, meta } = htmlToMd(html, { baseUrl });
    const title = (meta.title || 'untitled').replace(/[^\w\s-]/g, '').trim().slice(0, 80) || 'untitled';
    state.current = { md, raw: html, meta: { ...meta, title } };
    document.getElementById('result-section').hidden = false;
    renderView('md');
    setBusy(false);
    if (!md.trim()) {
      setStatus(meta.spa === 'yes'
        ? 'SPA shell — let the page finish loading, then Convert'
        : 'No readable content found — try Paste HTML', 'error');
      return;
    }
    const extra = meta.spa === 'yes' ? ' · SPA (live DOM)' : '';
    setStatus(`Converted ${md.length.toLocaleString()} chars${extra}`, 'success');
  } catch (e) {
    setBusy(false);
    setStatus(e.message || 'Failed', 'error');
  }
}

const RESTRICTED_URL_RE = /^(chrome|edge|brave|opera|vivaldi|about|chrome-extension|moz-extension|devtools|view-source):/i;
const WEBSTORE_RE = /\/\/(chrome\.google\.com\/webstore|chromewebstore\.google\.com|microsoftedge\.microsoft\.com)\//i;

async function readTabHTML() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error('No active tab');
  const url = tab.url || '';
  if (RESTRICTED_URL_RE.test(url) || WEBSTORE_RE.test(url)) {
    throw new Error('Can’t read browser pages — use Paste HTML');
  }
  let results;
  try {
    results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: async () => {
        const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
        // Nudge lazy-loaded / infinite-scroll content into the DOM before capture.
        try {
          const h = document.body ? document.body.scrollHeight : 0;
          window.scrollTo(0, h);
          await sleep(350);
          window.scrollTo(0, 0);
        } catch (e) {
          /* ignore scroll failures (e.g. restricted pages) */
        }
        await sleep(250);
        return document.documentElement.outerHTML;
      },
    });
  } catch (e) {
    throw new Error('Can’t access this page — try Paste HTML');
  }
  const html = results && results[0] ? results[0].result : '';
  if (!html) throw new Error('Empty page — nothing to convert');
  return { html, url };
}

async function copyToClipboard() {
  const data = getCurrentResult();
  if (!data.md) return;
  try {
    await navigator.clipboard.writeText(data.md);
    setStatus('Copied to clipboard', 'success');
  } catch (e) {
    setStatus('Copy failed — select the text manually', 'error');
  }
}

function downloadMarkdown() {
  const data = getCurrentResult();
  if (!data.md) return;
  const title = (data.meta?.title || 'untitled').replace(/[^\w\s-]/g, '').trim().slice(0, 80) || 'untitled';
  const blob = new Blob([data.md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title}.md`;
  a.click();
  // Defer revoke so the download isn't cancelled before it starts.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
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
