# TypeScript Chrome Extension

A Chrome extension built with TypeScript that demonstrates basic extension functionality.

## Features

- Background script for handling extension events
- Content script for interacting with web pages
- Popup UI with options and theme switching
- TypeScript for type safety and modern JavaScript features

## Development

### Prerequisites

- Node.js and npm

### Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```

### Building

To build the extension:

```
npm run build
```

For development with automatic rebuilding:

```
npm run watch
```

To build and copy static files:

```
npm run dev
```

### Loading the extension in Chrome

1. Build the extension using `npm run dev`
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the `dist` directory from this project

## Project Structure

- `src/` - TypeScript source files
  - `background.ts` - Background script
  - `content.ts` - Content script that runs on web pages
  - `popup.ts` - Script for the extension popup
- `popup.html` - HTML for the extension popup
- `manifest.json` - Chrome extension configuration
- `icons/` - Extension icons

## License

ISC 