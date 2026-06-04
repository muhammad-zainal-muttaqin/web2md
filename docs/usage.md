# Usage

## Convert the current tab

1. Open any web page (article, blog post, documentation).
2. Click the `web2md` icon.
3. Make sure **Current tab** is selected.
4. Click **Convert**.
5. The Markdown appears in the output area. Use **Copy** or **.md** to save it.

The extension waits 250ms for SPAs to settle, then reads the rendered HTML.

## Convert pasted HTML

For pages that block direct access (paywalls, login walls, X/Twitter, etc.):

1. Open the page in your browser.
2. View source: `Ctrl+U` (or `Cmd+U` on macOS).
3. Select All: `Ctrl+A`.
4. Copy: `Ctrl+C`.
5. Open `web2md`, switch to **Paste HTML**, click the textarea, paste: `Ctrl+V`.
6. Click **Convert**.

This works even if the page itself is gated, because you're feeding the extension the raw HTML directly.

## Output tabs

The result panel has three views:

- **Markdown** — the converted output. This is what you want 95% of the time.
- **Raw** — the source HTML that was fed into the converter. Useful for debugging what was extracted.
- **Meta** — the page title, description, author, and canonical URL.

## File naming

When you download the .md file, it's named after the page title (sanitized: special chars stripped, max 80 chars). Example: `My Article — Site.com.md`.

## Limitations

The current tab reader cannot extract content from:

- Cross-origin iframes
- Shadow DOM trees
- Pages that block extension content scripts (rare; some X feeds)

For those cases, use **Paste HTML**.

## Tips

- For Wikipedia, GitHub READMEs, Reddit threads, Stack Overflow answers, and most blogs, the **Current tab** mode works perfectly.
- For Medium, Substack, and paywalled content, paste the HTML — the public view-source still contains the article body.
- For Twitter/X, paste the HTML — the public web client doesn't expose article content to extensions.
