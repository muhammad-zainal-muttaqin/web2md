const fs = require('fs');
const path = require('path');
const https = require('https');
const { JSDOM } = require('jsdom');

const URL = process.argv[2] || 'test/wikipedia.html';

function load(url) {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return new Promise((resolve, reject) => {
      const req = https.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return load(res.headers.location).then(resolve, reject);
        }
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
        let data = '';
        res.on('data', (c) => data += c);
        res.on('end', () => resolve(data));
      });
      req.on('error', reject);
      req.setTimeout(30000, () => req.destroy(new Error('timeout')));
    });
  }
  return fs.promises.readFile(url, 'utf8');
}

const popupJs = fs.readFileSync(path.join(__dirname, '..', 'popup.js'), 'utf8');
const start = popupJs.indexOf('const MAIN_SELECTORS');
const end = popupJs.indexOf('async function readTabHTML');
const converter = popupJs.slice(start, end);

const stub = `
  globalThis.document = dom.window.document;
  globalThis.DOMParser = dom.window.DOMParser;
  ${converter}
  return htmlToMd(html);
`;

async function run() {
  console.log(`loading ${URL}...`);
  const html = await load(URL);
  console.log(`got ${html.length} bytes`);

  const dom = new JSDOM('');
  const fn = new Function('html', 'dom', stub);
  const result = fn(html, dom);

  console.log(`\n=== title ===\n${result.meta.title}\n`);
  console.log(`=== meta ===`);
  for (const [k, v] of Object.entries(result.meta)) {
    console.log(`${k.padEnd(12)} ${v}`);
  }
  console.log(`\n=== markdown (${result.md.length} chars) ===\n`);
  console.log(result.md);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
