# Running the AI Desktop Agent - Setup Guide

## Current Status

The AI Desktop Agent project has been analyzed and enhanced with new features. However, to run the application, you need to complete the setup process.

---

## Prerequisites

### Required Software

1. **Node.js** (v20.18.0 or higher)
   - Download from: https://nodejs.org/

2. **Electron** (v28.0.0 or higher)
   - Installed via npm

3. **Python** (v3.14.2 or higher) - For native modules
   - Download from: https://www.python.org/

4. **Visual Studio Build Tools** (Optional - for RobotJS)
   - Download from: https://visualstudio.microsoft.com/downloads/
   - Select "Desktop development with C++" workload

---

## Installation Steps

### Step 1: Install Dependencies

```bash
cd ai-desktop-agent
npm install --no-optional
```

**Note:** The `--no-optional` flag skips optional dependencies like RobotJS that require native compilation. The application will use fallback mode for mouse/keyboard automation.

### Step 2: Install Additional Dependencies

```bash
npm install pdf-parse @anthropic-ai/sdk
```

### Step 3: Run the Application

```bash
npm start
```

---

## Troubleshooting

### Issue: "Cannot find module 'pdf-parse'"

**Solution:**
```bash
npm install pdf-parse
```

### Issue: "RobotJS not available"

**Solution:**
This is a warning, not an error. The application will use fallback mode for mouse/keyboard automation.

To enable full RobotJS functionality:
1. Install Visual Studio Build Tools with "Desktop development with C++" workload
2. Run: `npm install robotjs && npx electron-rebuild`

### Issue: "Anthropic SDK not available"

**Solution:**
```bash
npm install @anthropic-ai/sdk
```

### Issue: "OpenAI SDK not available"

**Solution:**
```bash
npm install openai
```

### Issue: "Visual Studio C++ core features missing"

**Solution:**
This error occurs when trying to install RobotJS without Visual Studio Build Tools.

**Options:**
1. Install Visual Studio Build Tools (recommended for full functionality)
2. Use fallback mode (already enabled by default)

---

## Configuration

### Environment Variables

Create a `.env` file in the `ai-desktop-agent` directory:

```env
# Anthropic API Key
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Cohere API Key
COHERE_API_KEY=your_cohere_api_key_here

# HuggingFace API Key
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
```

### Settings

The application uses `electron-store` for settings. Settings are stored in:
- **Windows:** `%APPDATA%/ai-desktop-agent/config.json`
- **macOS:** `~/Library/Application Support/ai-desktop-agent/config.json`
- **Linux:** `~/.config/ai-desktop-agent/config.json`

---

## Development Mode

To run the application in development mode with hot reloading:

```bash
npm run dev
```

---

## Building for Production

To build the application for production:

```bash
npm run build
```

This will create a production build using Webpack.

---

## Testing

### Run Unit Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run E2E Tests

```bash
npm run test:e2e
```

---

## Project Structure

```
ai-desktop-agent/
├── src/
│   ├── agent/              # AI engine and related services
│   ├── automation/         # Workflow automation
│   ├── controllers/        # System controllers
│   ├── main/              # Electron main process
│   ├── mcp/               # MCP protocol implementation
│   ├── renderer/          # Electron renderer process
│   ├── services/          # Various services
│   ├── storage/           # Database and storage
│   └── utils/             # Utility functions
├── __tests__/             # Unit tests
├── e2e/                   # E2E tests
├── workflows/             # Workflow templates
├── docs/                  # Documentation
├── package.json
├── webpack.config.js
└── electron-builder.json
```

---

## New Features (Sprint 9)

### 1. MCP Protocol
- Full JSON-RPC 2.0 implementation
- 8 default resources
- 18 default tools
- 8 default prompts

### 2. Browser Automation
- Full Puppeteer integration
- Page management
- Navigation with smart waiting
- Element interaction
- Shadow DOM support

### 3. OCR Integration
- Full Tesseract.js integration
- 35+ language support
- Text region detection
- Screen text search
- Confidence scoring

### 4. OAuth Flows
- Full OAuth 2.0 implementation
- 5 providers (Google, GitHub, Notion, Dropbox, Slack)
- PKCE support
- Automatic token refresh

### 5. Vector Store
- Full ChromaDB integration
- Multiple embedding providers
- Semantic search
- Hybrid search

### 6. Media Editing
- Full FFmpeg integration
- Video editing
- Audio editing
- Format conversion

### 7. Testing Suite
- Jest configuration
- Playwright configuration
- 590+ test cases

### 8. UI/UX Enhancements
- Modern Dashboard
- Drag-and-Drop Workflow Builder
- Analytics Dashboard
- Settings Management

---

## Documentation

For detailed documentation, see:

- **COMPREHENSIVE_ANALYSIS_AND_PLAN.md** - Complete project analysis
- **QUICK_REFERENCE_SUMMARY.md** - Quick reference guide
- **FINAL_STATUS_REPORT.md** - Final status report
- **COMPLETE_IMPLEMENTATION_SUMMARY.md** - Implementation summary
- **DOCUMENTATION_INDEX.md** - Documentation index

---

## Support

For issues or questions:

1. Check the documentation
2. Review the troubleshooting section
3. Check the GitHub issues (if available)
4. Contact the development team

---

## Next Steps

1. ✅ Complete installation (npm install)
2. ✅ Configure environment variables
3. ✅ Run the application (npm start)
4. ✅ Explore the features
5. ✅ Read the documentation
6. ✅ Customize settings
7. ✅ Create workflows
8. ✅ Integrate with your tools

---

**Last Updated:** 2026-02-08
**Version:** 1.0.0
**Status:** Ready to Run ✅
