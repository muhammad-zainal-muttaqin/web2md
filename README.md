# web2md

> Web to Markdown. One click. No tracking. No servers.

A minimal Chrome extension that converts the current tab — or pasted HTML — into clean Markdown.

## Features

- **One-click conversion** — click the icon, click Convert, get Markdown.
- **Paste HTML fallback** — for paywalled / login-walled pages, paste the raw HTML and convert offline.
- **Smart content extraction** — 30+ site-aware selectors pick the main article (Wikipedia, GitHub, Reddit, Stack Overflow, MDN, dev.to, blogs, docs sites), with density-based fallback for the long tail.
- **Aggressive noise stripping** — removes reader settings, chapter nav, comments, ads, tracker pixels, sidebars, and ~80 other class/id/role/aria-label patterns.
- **GFM output** — strikethrough, task lists, tables, fenced code blocks, definition lists, `<details>`, `<mark>`, sub/sup.
- **Copy or download** — clipboard copy or `.md` download named after the page title.
- **Three output views** — Markdown / Raw HTML / Page Meta.
- **Light + dark theme** — auto-adapts to your system.
- **Privacy first** — zero network calls, zero analytics, zero storage.

## Install

1. Open `chrome://extensions` (or `edge://extensions`, `brave://extensions`).
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this `web2md/` folder.

See [docs/install](https://muhammad-zainal-muttaqin.github.io/web2md/install) for details and a step-by-step.

## Usage

Open any page → click the `web2md` icon → click **Convert**.

For paywalled pages: View Source (`Ctrl+U`) → Select All (`Ctrl+A`) → Copy (`Ctrl+C`) → switch to **Paste HTML** mode in the popup → Paste → **Convert**.

See [docs/usage](https://muhammad-zainal-muttaqin.github.io/web2md/usage) for more.

## Project structure

```
web2md/
├── manifest.json       # MV3 manifest
├── popup.html          # Popup UI
├── popup.css           # Popup styles (light + dark)
├── popup.js            # Content extraction + Markdown converter
├── icons/              # 16/32/48/128 px toolbar icons
├── scripts/
│   ├── gen-icons.cjs   # Regenerate icons (Node, no deps)
│   └── test-popup.cjs  # Local converter test (requires jsdom)
├── test/
│   └── sakuranovel-sample.html  # Synthetic sample for testing
├── docs/               # VitePress documentation site
│   ├── .vitepress/
│   ├── index.md
│   ├── install.md
│   ├── usage.md
│   ├── changelog.md
│   └── license.md
├── .github/
│   └── workflows/
│       └── deploy-docs.yml   # Auto-deploy docs to GitHub Pages
├── LICENSE
├── CHANGELOG.md
└── README.md
```

## Documentation

The full documentation site is built with [VitePress](https://vitepress.dev/) and auto-deployed to GitHub Pages on every push to `main`:

- Source: `docs/`
- Workflow: `.github/workflows/deploy-docs.yml`
- Live: https://muhammad-zainal-muttaqin.github.io/web2md

To run locally:

```sh
cd docs
pnpm install
pnpm run docs:dev
```

## Development

To run the converter test locally:

```sh
npm install --no-save jsdom
node scripts/test-popup.cjs test/sakuranovel-sample.html
```

Or point it at any URL or local HTML file:

```sh
node scripts/test-popup.cjs https://example.com/article
node scripts/test-popup.cjs ./my-page.html
```

To regenerate icons:

```sh
node scripts/gen-icons.cjs
```

## Permissions

The extension requests the minimum:

- `activeTab` — read the current tab when you click Convert.
- `scripting` — inject the content-extraction script.

It does **not** request `<all_urls>`, history, storage, cookies, or any other broad permission.

## How it works

1. Click the toolbar icon to open the popup.
2. Click **Convert**. The popup calls `chrome.scripting.executeScript` to read `document.documentElement.outerHTML` of the active tab.
3. The HTML is fed into a content extractor that:
   - Tries 30+ site-aware CSS selectors in order (`main article`, `article`, `.post-content`, `.markdown-body`, `.chapter-content`, etc.).
   - Falls back to a density-based selector that picks the element with the highest text-to-link ratio.
   - Strips `script`, `style`, `nav`, `footer`, `aside`, `form`, `input`, `button`, `iframe`, `svg`, `figure`, and ~80 noise patterns matched by class/id/role/aria-label.
   - Removes tracker pixels (histats, GA, GTM, FB, etc.) and 1×1 images.
   - Replaces `javascript:` and `#` hrefs with plain text.
4. The cleaned DOM is walked to produce GFM-flavored Markdown — headings, paragraphs, lists (including task lists), blockquotes, code blocks, tables, links, images, emphasis, strikethrough, definition lists, `<details>`.
5. The first heading is auto-removed if it duplicates the page title.
6. Result is shown in three tabs: Markdown / Raw / Meta.

The execution happens in the **ISOLATED** world — page scripts are not affected, and the extension never sees the page's JavaScript context.

## Limitations

- Cross-origin iframes are not extracted.
- Shadow DOM trees are not traversed.
- Pages that explicitly block extension content scripts (rare) need the Paste HTML fallback.

## License

MIT — see [LICENSE](LICENSE). Copyright © 2026 Zainal.
