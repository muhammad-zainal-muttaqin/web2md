# web2md

> Web to Markdown. One click. No tracking. No servers.

A minimal Chrome extension that converts the current tab — or pasted HTML — into clean Markdown.

## Features

- **One-click conversion** — click the icon, click Convert, get Markdown.
- **Paste HTML fallback** — for paywalled / login-walled pages, paste the raw HTML and convert offline.
- **Robust content extraction** — a curl.md-style pipeline ranks multiple candidate roots (site rules → semantic tags → 30+ selectors → density scan), then **falls back automatically when a candidate is too thin**, so you never get "header only" output.
- **Per-site rules** — dedicated content roots for GitHub, Wikipedia, MDN, Stack Overflow, Reddit, dev.to, Medium, Substack; easy to extend.
- **Safe noise stripping** — removes reader settings, chapter nav, comments, ads, tracker pixels, sidebars, and ~80 class/id/role/aria-label patterns, with **content protection + link-density filtering** so layout wrappers (Elementor, Gutenberg `wp-block`, etc.) never take the article body down with them.
- **Absolute links** — relative `href`/`src` are resolved against the page URL; highlighted code blocks are flattened to clean fenced code.
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
│   ├── sakuranovel-sample.html  # Novel reader sample (regression)
│   ├── elementor-sample.html    # WordPress/Elementor wrapper sample (header-only fix)
│   ├── link-heavy-nav.html      # Link-density filtering sample
│   └── spa-shell.html           # SPA detection sample
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
2. Click **Convert**. The popup calls `chrome.scripting.executeScript` to scroll the page (to trigger lazy-loaded content) and read `document.documentElement.outerHTML` of the active tab, along with the tab URL.
3. The HTML is fed into a **curl.md-style extraction pipeline** (ported to vanilla JS — no build step, no dependencies):
   - **Candidate selection** — collects multiple candidate content roots: per-site rules first (e.g. GitHub `.markdown-body`, Wikipedia `#mw-content-text`), then semantic tags (`<main>`, `<article>`, `[role=main]`), then 30+ selectors, then a density scan. Each is scored by text length, paragraph count, and link density.
   - **Clean passes** run on the chosen candidate: `stripNoise` (≈80 noise patterns + tracker pixels) with **content protection** so an element holding most of the text is never removed, plus **link-density filtering** that drops nav/related/footer blocks made mostly of links; `resolveLinks` (relative → absolute); `normalizePreCode` (flatten highlighted code); `stripEmpty` (drop hollow wrappers).
   - **Thin-content fallback** — if the top candidate converts to too little (`<120` chars / `≤3` lines / no prose), the next candidate is tried, and finally the whole `<body>`. The best non-thin result wins, so a header-only wrapper can never be the final output.
4. The cleaned DOM is walked to produce GFM-flavored Markdown — headings, paragraphs, lists (including task lists), blockquotes, code blocks, tables, links, images, emphasis, strikethrough, definition lists, `<details>`.
5. The first heading is auto-removed if it duplicates the page title. Metadata (title, description, author, published date, canonical URL, JSON-LD) plus the extraction `method` and an approximate `tokens` count are surfaced in the **Meta** tab.
6. Result is shown in three tabs: Markdown / Raw / Meta.

The execution happens in the **ISOLATED** world — page scripts are not affected, and the extension never sees the page's JavaScript context. SPA shells (`#__next`, `#__nuxt`, `#app`, …) are detected and flagged; because the live rendered DOM is read, their content is still captured.

## Limitations

- Cross-origin iframes are not extracted.
- Shadow DOM trees are not traversed.
- Pages that explicitly block extension content scripts (rare) need the Paste HTML fallback.

## License

MIT — see [LICENSE](LICENSE). Copyright © 2026 Zainal.
