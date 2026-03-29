# Unicode Text Converter Extension

A production-ready Chrome extension built with Manifest V3 and TypeScript that converts selected text into Unicode styled text locally in the browser. It recreates the broad style families commonly found in tools like textconverter.net without scraping, iframes, or external APIs.

## Features

- Floating action button near text selections with a compact picker and live preview
- Quick insert panel inside the picker so text can be typed manually even without a selection
- Replace selected text in editable fields, insert at the caret, or copy to clipboard
- Context menu actions for opening the picker or converting with the last used style
- Popup UI with manual input, style search, preview, copy, replace, insert, and saved defaults
- Synced preferences with `chrome.storage.sync`
- Local deterministic converter registry with safe fallbacks for incomplete Unicode alphabets
- Keyboard shortcuts:
  - `Alt+Shift+U`: open the picker
  - `Alt+Shift+L`: apply the last used style instantly

## Included Style Families

- Circled
- Negative circled
- Fullwidth
- Mathematical bold
- Mathematical bold italic
- Script
- Bold script
- Double struck
- Monospace
- Sans serif
- Sans serif bold
- Sans serif italic
- Sans serif bold italic
- Parenthesized
- Regional indicator
- Squared
- Negative squared
- Superscript
- Small caps
- Reversed
- Upside down
- Combining effects: strikethrough, underline, double underline, dotted underline, slash overlay, boxed effect

## Project Structure

- [manifest.json](/Users/mac/Documents/development/workspaces/extensions/unicode-text-converter/manifest.json)
- [popup.html](/Users/mac/Documents/development/workspaces/extensions/unicode-text-converter/popup.html)
- [styles.css](/Users/mac/Documents/development/workspaces/extensions/unicode-text-converter/styles.css)
- [src/background/service-worker.ts](/Users/mac/Documents/development/workspaces/extensions/unicode-text-converter/src/background/service-worker.ts)
- [src/content/content-script.ts](/Users/mac/Documents/development/workspaces/extensions/unicode-text-converter/src/content/content-script.ts)
- [src/popup/popup.ts](/Users/mac/Documents/development/workspaces/extensions/unicode-text-converter/src/popup/popup.ts)
- [src/shared/converters.ts](/Users/mac/Documents/development/workspaces/extensions/unicode-text-converter/src/shared/converters.ts)
- [src/shared/mappings.ts](/Users/mac/Documents/development/workspaces/extensions/unicode-text-converter/src/shared/mappings.ts)
- [src/shared/selection.ts](/Users/mac/Documents/development/workspaces/extensions/unicode-text-converter/src/shared/selection.ts)
- [src/shared/storage.ts](/Users/mac/Documents/development/workspaces/extensions/unicode-text-converter/src/shared/storage.ts)
- [src/tests/converters.test.ts](/Users/mac/Documents/development/workspaces/extensions/unicode-text-converter/src/tests/converters.test.ts)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Build the extension:

   ```bash
   npm run build
   ```

3. Load it in Chrome:
   - Open `chrome://extensions`
   - Enable Developer Mode
   - Click `Load unpacked`
   - Select the project folder: `/Users/mac/Documents/development/workspaces/extensions/unicode-text-converter`

4. Optional verification:

   ```bash
   npm run check
   ```

## How Selection Replacement Works

The extension treats selections differently based on where they come from:

- Text inputs and textareas:
  - It reads `selectionStart` and `selectionEnd`, then uses `setRangeText()` to replace the selected text or insert at the current caret.
  - Focus stays in the control and native `input` and `change` events are dispatched after the mutation.

- `contenteditable` fields:
  - It clones the current DOM `Range`, restores that range when the picker action runs, deletes the selected contents, inserts a plain text node, and collapses the caret after the inserted text.
  - This keeps rich editors workable while still inserting copy-paste-friendly plain Unicode text.

- Standard page text:
  - The extension can read and convert the selection, but it does not try to mutate normal page text because that content is not editable.
  - In that case the UI clearly falls back to copy, and insert is only enabled if there is still a saved caret in an editable field.

## Preferences

The popup lets you save and sync:

- Last used style
- Default style
- Preferred action: replace, insert, or copy
- Automatically open the picker on selection
- Show floating button only
- Copy result automatically after replace or insert

## Development

- Type check:

  ```bash
  npm run typecheck
  ```

- Run tests:

  ```bash
  npm run test
  ```

- Build:

  ```bash
  npm run build
  ```

## Known Limitations of Unicode Styled Text

- Some Unicode alphabets are incomplete, especially script, superscript, enclosed, and negative enclosed styles. Unsupported characters are intentionally preserved unchanged.
- Font coverage varies by site, OS, and app. A style may be valid Unicode but still render as tofu or fallback glyphs in some places.
- Combining-mark effects such as underline, strikethrough, slash, or boxed overlays depend on renderer quality and can look tighter or looser across platforms.
- Rich editors sometimes normalize or sanitize unusual Unicode characters when submitting content.
- Chrome extensions cannot inject content scripts into restricted pages such as `chrome://*`, the Chrome Web Store, or some internal browser surfaces, so page insertion is unavailable there.
