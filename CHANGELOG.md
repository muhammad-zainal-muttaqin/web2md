# Changelog

All notable changes to web2md are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] — 2026-06-26

Robust extraction overhaul, applying the technology behind [wevm/curl.md](https://github.com/wevm/curl.md) (its `parse → strip → resolve → convert` pipeline and thin-content fallback) as a zero-dependency, no-build vanilla port.

### Added
- **Candidate-based content selection** — instead of committing to one element, multiple candidate roots are collected (site rules → semantic tags → 30+ selectors → density scan) and scored by text length, paragraph count, and link density.
- **Thin-content fallback chain** — when a candidate converts to too little (`<120` chars / `≤3` lines / no prose), the next candidate is tried, then the whole `<body>`; the best non-thin result wins. **Fixes the "header only, no content" failure.**
- **Per-site rules** — dedicated content roots for GitHub, Wikipedia, MDN, Stack Overflow, Reddit, dev.to, Medium, Substack (easy to extend).
- **Link-density filtering** — nav/related/footer blocks made mostly of links are dropped.
- **Link resolution** — relative `href`/`src` resolved to absolute URLs against the page/canonical URL.
- **Code normalization** — syntax-highlighted `<pre>`/`<code>` flattened to clean fenced blocks; line-number gutters removed.
- **Empty-wrapper stripping** — hollow containers left after cleaning are removed.
- **Richer Meta** — JSON-LD / Open Graph metadata (author, published date, site, canonical), plus the extraction `method` and an approximate `tokens` count.
- **SPA detection** — `#__next` / `#__nuxt` / `#app` / `#root` shells are detected and flagged.
- **Lazy-load capture** — the page is scrolled before reading the DOM so lazy/infinite-scroll content is included.
- New test fixtures: `elementor-sample.html`, `link-heavy-nav.html`, `spa-shell.html`.

### Changed
- Noise stripping is now **content-aware**: an element holding most of the candidate's text is protected from removal, so layout wrappers (Elementor, Gutenberg `wp-block`, `wpb_wrapper`) no longer take the article body with them.
- Removed the over-aggressive `elementor` / `wp-block` / `wpb_wrapper` / `flavor` patterns from the noise list.

### Hardened
- **Safer Markdown output** — link/image text escapes `[` `]`, and destinations containing spaces or parentheses are wrapped in `<…>` so URLs like `…/Convention_(norm)` no longer break the surrounding link.
- **Crash-proof conversion** — the DOM walk is wrapped so a pathologically deep page falls back to plain text instead of overflowing the stack.
- **Bounded work** — the density scan is capped (≤4000 nodes) so huge pages can't freeze the popup; oversized JSON-LD blobs are skipped.
- **Restricted pages** — `chrome://`, `view-source:`, extension and Web Store URLs report a clear "use Paste HTML" message; `executeScript` failures and empty results are handled gracefully.
- **Resilient UI** — clipboard failures surface a helpful message, empty extractions prompt Paste HTML, and the download object URL is revoked on a delay so the file isn't cancelled.

### Notes
- Still zero network calls, zero analytics, zero dependencies, no build step.

## [1.0.0] — 2026-06-04

Initial open-source release.

### Added
- Manifest V3 with `activeTab` + `scripting` permissions only.
- One-click conversion of the current tab to Markdown.
- Paste-HTML mode for paywalled / login-walled pages.
- 30+ site-aware content selectors (Wikipedia, GitHub, Reddit, Stack Overflow, MDN, dev.to, etc.).
- Density-based fallback selector for the long tail.
- **Aggressive noise stripping** — removes reader settings, chapter nav, comments, ads, tracker pixels, sidebars, and ~80 class/id/role/aria-label patterns.
- **GFM output** — strikethrough, task lists, tables, fenced code blocks, definition lists, `<details>`, `<mark>`, sub/sup.
- **First-heading dedup** — auto-removes a heading that duplicates the page title.
- **Tracker pixel removal** — histats, GA, GTM, FB, etc.
- **`javascript:` / `#` link cleanup** — replaced with plain text.
- Light + dark theme via `prefers-color-scheme`.
- Copy to clipboard, download as `.md` (named after page title).
- Markdown / Raw / Meta output views.
- 250ms SPA settle delay before extraction.
- VitePress documentation site with GitHub Pages auto-deploy.
- Procedural icon generator (no external image dependencies).
- Local test harness (`scripts/test-popup.cjs`) with synthetic sample.

### Notes
- Zero network calls. Zero analytics. Zero tracking.
- The extension runs entirely in the browser. No data leaves the user's machine.
