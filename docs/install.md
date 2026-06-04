# Install

## From source (recommended)

1. Download or clone this repo.
2. Open `chrome://extensions` (or `edge://extensions`, `brave://extensions`, etc.).
3. Toggle **Developer mode** on (top right).
4. Click **Load unpacked**.
5. Select the `web2md/` folder (the one with `manifest.json`).

The extension appears in your toolbar. Pin it for quick access.

## From release zip

1. Download the latest `web2md.zip` from the [Releases](https://github.com/muhammad-zainal-muttaqin/web2md/releases) page.
2. Unzip it.
3. Open `chrome://extensions` with Developer mode on.
4. Drag the unzipped folder onto the extensions page, or use **Load unpacked**.

## Verify

Click the `web2md` icon in your toolbar. You should see the popup with two source options: **Current tab** and **Paste HTML**. If both are visible, the install worked.

## Permissions

The extension requests only:

- `activeTab` — to read the current tab when you click Convert.
- `scripting` — to inject the content-extraction script.

It does **not** request `<all_urls>`, history, storage, or any other broad permission.
