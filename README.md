# TypeScript Chrome Extension

A Chrome extension built with TypeScript that demonstrates basic extension functionality.

## Features

- Background script for handling extension events
- Content script for interacting with web pages
- Popup UI with options and theme switching
- TypeScript for type safety and modern JavaScript features
- AI-powered job application form filling with ChatGPT or DeepSeek integration

## AI Integration

This extension uses AI to help with job applications in two ways:

1. **ChatGPT (OpenAI)**: The primary AI service used for generating responses to job application questions.
2. **DeepSeek**: An alternative AI service that can be used instead of ChatGPT.

### Setting up OpenAI (ChatGPT)

To use ChatGPT with this extension:

1. Create an OpenAI account at [platform.openai.com](https://platform.openai.com)
2. Generate an API key from your account dashboard
3. Configure the extension:
   - Open the extension popup
   - Select "OpenAI (ChatGPT)" as the AI service
   - Enter your API key in the field provided
   - Click "Save API Key"

If you don't provide an API key, the extension will use mock responses for testing purposes.

## Development

### Prerequisites

- Node.js and npm
- AI API key (from OpenAI or DeepSeek)

### Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables:
   - Copy `env.example` to `.env.local`
   - Add your API key to `.env.local`:
     ```
     DEEPSEEK_API_KEY=your_api_key_here
     ```
     or for OpenAI:
     ```
     OPENAI_API_KEY=your_api_key_here
     ```
   - This file is gitignored and will not be committed

### Setting up the AI API Key

For development:
1. Create an account at [DeepSeek](https://deepseek.com/) or [OpenAI Platform](https://platform.openai.com/)
2. Generate an API key from their developer dashboard
3. Add the key to your `.env.local` file as described above

For users of the extension:
1. Click on the extension icon to open the popup
2. Enter your AI API key in the designated field
3. Click "Save API Key"
4. The key will be securely stored in Chrome's extension storage

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
  - `services/` - Service modules
    - `aiService.ts` - ChatGPT integration for AI-powered responses
    - `autofillService.ts` - Form detection and filling functionality
    - `jobFormService.ts` - Job board detection and form handling
    - `storageService.ts` - Chrome storage management
  - `types/` - TypeScript type definitions
- `popup.html` - HTML for the extension popup
- `manifest.json` - Chrome extension configuration
- `icons/` - Extension icons
- `env.example` - Example environment variables template

## License

ISC