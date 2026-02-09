const { BrowserWindow } = require('electron');
const path = require('path');

class WindowManager {
    constructor() {
        this.floatingWindow = null;
    }

    createFloatingWindow() {
        this.floatingWindow = new BrowserWindow({
            width: 200,                // Start small for icon
            height: 200,
            frame: false,              // No title bar
            transparent: true,         // Transparent background
            alwaysOnTop: true,        // Always visible
            skipTaskbar: true,        // Don't show in taskbar
            resizable: true,
            movable: true,
            hasShadow: true,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js')
            }
        });

        // Load the HTML file
        const htmlPath = path.join(__dirname, '../../src/renderer/index.html');
        console.log('[WindowManager] Loading HTML from:', htmlPath);

        this.floatingWindow.loadFile(htmlPath).catch(err => {
            console.error('[WindowManager] Failed to load HTML:', err);
        });

        // Log when renderer is ready
        this.floatingWindow.webContents.on('did-finish-load', () => {
            console.log('[WindowManager] Renderer finished loading');
        });

        this.floatingWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
            console.error('[WindowManager] Renderer failed to load:', errorCode, errorDescription);
        });

        // Show window when ready
        this.floatingWindow.once('ready-to-show', () => {
            this.floatingWindow.show();
            console.log('[WindowManager] Floating window shown');
        });

        // Open DevTools in development mode
        if (process.argv.includes('--dev')) {
            this.floatingWindow.webContents.openDevTools({ mode: 'detach' });
        }

        // Make window draggable
        this.floatingWindow.setAlwaysOnTop(true, 'floating');

        // Hide instead of close
        this.floatingWindow.on('close', (e) => {
            e.preventDefault();
            this.floatingWindow.hide();
        });

        return this.floatingWindow;
    }

    toggleWindow() {
        if (this.floatingWindow.isVisible()) {
            this.floatingWindow.hide();
        } else {
            this.floatingWindow.show();
            this.floatingWindow.focus();
        }
    }

    getWindow() {
        return this.floatingWindow;
    }
}

module.exports = WindowManager;
