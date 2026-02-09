const { app, BrowserWindow } = require('electron');
const path = require('path');
require('dotenv').config();

const WindowManager = require('./window-manager');
const ShortcutManager = require('./shortcuts');
const TrayManager = require('./tray');
const IPCHandlers = require('./ipc-handlers');

// Security Services (Sprint 7)
const passwordManagementService = require('../services/password-management-service');
const secureStorageService = require('../services/secure-storage-service');
const twoFactorAuthService = require('../services/two-factor-auth-service');
const auditLogsService = require('../services/audit-logs-service');

// Advanced Features Services (Sprint 8)
const screenRecordingService = require('../services/screen-recording-service');
const productivityAnalyticsService = require('../services/productivity-analytics-service');
const healthMonitoringService = require('../services/health-monitoring-service');
const focusModeService = require('../services/focus-mode-service');

// Phase 2 Services (OCR, Document Parser, Voice)
const ocrService = require('../services/ocr-service');
const documentParserService = require('../services/document-parser');
const voiceService = require('../services/voice-service');

class DesktopAgent {
    constructor() {
        this.windowManager = null;
        this.shortcutManager = null;
        this.trayManager = null;
        this.ipcHandlers = null;
    }

    async initialize() {
        // Initialize security services
        // await this.initializeSecurityServices();

        // Initialize advanced features
        await this.initializeAdvancedFeatures();

        // Initialize Phase 2 services
        await this.initializePhase2Services();

        // Create window
        console.log('[DesktopAgent] Creating floating window...');
        this.windowManager = new WindowManager();
        this.windowManager.createFloatingWindow();

        // Setup IPC handlers
        this.ipcHandlers = new IPCHandlers(this.windowManager);
        this.ipcHandlers.register();

        // Register global shortcuts
        this.shortcutManager = new ShortcutManager(this.windowManager);
        this.shortcutManager.register();

        // Create system tray
        this.trayManager = new TrayManager(this.windowManager);
        this.trayManager.create();

        console.log('AI Desktop Agent initialized');
    }

    async initializeSecurityServices() {
        try {
            console.log('Initializing security services...');

            // Initialize password management service
            await passwordManagementService.initialize();
            console.log('[Security] Password Management Service initialized');

            // Initialize secure storage service
            await secureStorageService.initialize();
            console.log('[Security] Secure Storage Service initialized');

            // Initialize 2FA service
            await twoFactorAuthService.initialize();
            console.log('[Security] 2FA Automation Service initialized');

            // Initialize audit logs service
            await auditLogsService.initialize();
            console.log('[Security] Audit Logs Service initialized');

            console.log('Security services initialized successfully');
        } catch (error) {
            console.error('Failed to initialize security services:', error);
        }
    }

    async initializeAdvancedFeatures() {
        try {
            console.log('Initializing advanced features...');

            // Initialize screen recording service
            await screenRecordingService.initialize();
            console.log('[Advanced] Screen Recording Service initialized');

            // Initialize productivity analytics service
            await productivityAnalyticsService.initialize();
            console.log('[Advanced] Productivity Analytics Service initialized');

            // Initialize health monitoring service
            await healthMonitoringService.initialize();
            console.log('[Advanced] Health Monitoring Service initialized');

            // Initialize focus mode service
            await focusModeService.initialize();
            console.log('[Advanced] Focus Mode Service initialized');

            console.log('Advanced features initialized successfully');
        } catch (error) {
            console.error('Failed to initialize advanced features:', error);
        }

        console.log('[DesktopAgent] Advanced features initialization completed, moving to Phase 2...');
    }

    async initializePhase2Services() {
        console.log('Initializing Phase 2 services...');

        try {
            // Initialize OCR service
            console.log('[Phase2] Initializing OCR Service...');
            await ocrService.initialize();
            console.log('[Phase2] OCR Service initialized');
        } catch (error) {
            console.error('[Phase2] Failed to initialize OCR service:', error);
        }

        try {
            // Initialize document parser service
            console.log('[Phase2] Initializing Document Parser Service...');
            await documentParserService.initialize();
            console.log('[Phase2] Document Parser Service initialized');
        } catch (error) {
            console.error('[Phase2] Failed to initialize document parser service:', error);
        }

        try {
            // Initialize voice service
            console.log('[Phase2] Initializing Voice Service...');
            await voiceService.initialize();
            console.log('[Phase2] Voice Service initialized');
        } catch (error) {
            console.error('[Phase2] Failed to initialize voice service:', error);
        }

        console.log('Phase 2 services initialization completed');
    }

    cleanup() {
        if (this.shortcutManager) {
            this.shortcutManager.unregisterAll();
        }
    }
}

// App lifecycle
let agent;

app.whenReady().then(async () => {
    agent = new DesktopAgent();
    await agent.initialize();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            agent.windowManager.createFloatingWindow();
        }
    });
});

app.on('window-all-closed', () => {
    // Don't quit on macOS
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', () => {
    if (agent) {
        agent.cleanup();
    }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
});
