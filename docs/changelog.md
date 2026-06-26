# Changelog

## [1.1.0] — 2026-06-26

Robust extraction overhaul, applying the technology behind [wevm/curl.md](https://github.com/wevm/curl.md) as a zero-dependency, no-build vanilla port.

- **Candidate-based content selection** — multiple candidate roots (site rules → semantic tags → 30+ selectors → density scan) scored by text length, paragraph count, and link density.
- **Thin-content fallback chain** — tries the next candidate, then the whole `<body>`, when a candidate is too thin. **Fixes the "header only, no content" failure.**
- **Per-site rules** for GitHub, Wikipedia, MDN, Stack Overflow, Reddit, dev.to, Medium, Substack.
- **Link-density filtering** drops nav/related/footer link blocks.
- **Content-aware noise stripping** — protects elements holding most of the text, so Elementor / Gutenberg `wp-block` wrappers no longer remove the article body.
- **Link resolution** (relative → absolute) and **highlighted-code flattening**.
- **Richer Meta** — JSON-LD / Open Graph (author, date, canonical) plus extraction `method` and approximate `tokens`.
- **SPA detection** and **lazy-load capture** (scroll before reading the DOM).
- **Hardened** — escapes Markdown link/image text and wraps URLs with spaces or parentheses (`…/Convention_(norm)`); crash-proof conversion fallback; bounded density scan (≤4000 nodes); clear messages for `chrome://` / Web Store / empty pages; resilient clipboard, download, and `executeScript` handling.
- Still zero network calls, zero analytics, zero dependencies, no build step.

## [1.0.0] — 2026-06-04

Initial open-source release.

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
- Zero network calls. Zero analytics. Zero tracking.
