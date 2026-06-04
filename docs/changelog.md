# Changelog

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
