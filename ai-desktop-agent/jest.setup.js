/**
 * Jest Setup File
 * Global test configuration and mocks
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.TEST_MODE = 'true';

// Mock Electron APIs
global.electron = {
    app: {
        getPath: jest.fn((name) => {
            const paths = {
                userData: '/tmp/test-user-data',
                home: '/tmp/test-home',
                temp: '/tmp/test-temp'
            };
            return paths[name] || '/tmp/test';
        }),
        getVersion: jest.fn(() => '1.0.0'),
        getName: jest.fn(() => 'AI Desktop Agent'),
        quit: jest.fn()
    },
    BrowserWindow: jest.fn().mockImplementation(() => ({
        loadURL: jest.fn(),
        on: jest.fn(),
        webContents: {
            send: jest.fn(),
            executeJavaScript: jest.fn()
        },
        close: jest.fn()
    })),
    ipcMain: {
        on: jest.fn(),
        handle: jest.fn(),
        removeListener: jest.fn()
    },
    ipcRenderer: {
        on: jest.fn(),
        send: jest.fn(),
        invoke: jest.fn()
    }
};

// Mock file system
const fs = require('fs');
const path = require('path');

// Create test directories
const testDirs = [
    '/tmp/test-user-data',
    '/tmp/test-temp',
    '/tmp/test-data'
];

testDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Mock console methods to reduce noise in tests
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};

// Increase timeout for async operations
jest.setTimeout(30000);

// Global test utilities
global.testUtils = {
    // Create a temporary file
    createTempFile: (filename, content = '') => {
        const filepath = path.join('/tmp/test-temp', filename);
        fs.writeFileSync(filepath, content);
        return filepath;
    },

    // Clean up temporary files
    cleanupTempFiles: () => {
        const tempDir = '/tmp/test-temp';
        if (fs.existsSync(tempDir)) {
            fs.readdirSync(tempDir).forEach(file => {
                fs.unlinkSync(path.join(tempDir, file));
            });
        }
    },

    // Wait for a specified time
    wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

    // Mock async function
    mockAsync: (value, delay = 100) =>
        new Promise(resolve => setTimeout(() => resolve(value), delay))
};

// Clean up after each test
afterEach(() => {
    jest.clearAllMocks();
    global.testUtils.cleanupTempFiles();
});

// Clean up after all tests
afterAll(() => {
    testDirs.forEach(dir => {
        if (fs.existsSync(dir)) {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });
});
