const { ipcMain } = require('electron');
const ScreenController = require('../controllers/screen-controller');
const InputController = require('../controllers/input-controller');
const FileController = require('../controllers/file-controller');
const BrowserController = require('../controllers/browser-controller');
const AppController = require('../controllers/app-controller');
const ClipboardController = require('../controllers/clipboard-controller');
const WindowController = require('../controllers/window-controller');
const ActionExecutor = require('../automation/action-executor');
const AIEngine = require('../agent/ai-engine');
const MemoryManager = require('../agent/memory-manager');
const TaskPlanner = require('../agent/task-planner');
const VisionAI = require('../agent/vision');
const safetyService = require('../services/safety-service');

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

// Phase 2 Services
const ocrService = require('../services/ocr-service');
const documentParserService = require('../services/document-parser');
const voiceService = require('../services/voice-service');

require('dotenv').config();

class IPCHandlers {
    constructor(windowManager) {
        this.windowManager = windowManager;
        this.screenController = null;
        this.inputController = null;
        this.fileController = null;
        this.browserController = null;
        this.appController = null;
        this.clipboardController = null;
        this.windowController = null;
        this.actionExecutor = null;
        this.aiEngine = null;
        this.memoryManager = null;
        this.taskPlanner = null;
        this.visionAI = null;
    }

    register() {
        // Initialize controllers
        this.initializeControllers();

        // Chat with AI
        ipcMain.handle('ai:chat', async (event, message) => {
            try {
                if (!this.aiEngine) {
                    return { text: "AI engine not initialized. Please configure API keys in .env file." };
                }

                const activeWindow = await this.screenController.getActiveWindow();
                const context = {
                    activeWindow,
                    screenSize: this.inputController ? this.inputController.getScreenSize() : { width: 1920, height: 1080 }
                };

                const response = await this.aiEngine.chat(message, context);

                // Store in memory
                if (this.memoryManager) {
                    this.memoryManager.addMessage('user', message);
                    this.memoryManager.addMessage('assistant', response.text);
                }

                return response;
            } catch (error) {
                console.error('AI chat error:', error);
                return { error: error.message };
            }
        });

        // Execute action
        ipcMain.handle('action:execute', async (event, action) => {
            try {
                if (!this.actionExecutor) {
                    return { success: false, error: "Action executor not initialized" };
                }
                return await this.actionExecutor.execute(action);
            } catch (error) {
                console.error('Action execution error:', error);
                return { success: false, error: error.message };
            }
        });

        // Execute sequence of actions
        ipcMain.handle('action:execute-sequence', async (event, actions) => {
            try {
                if (!this.actionExecutor) {
                    return { success: false, error: "Action executor not initialized" };
                }
                return await this.actionExecutor.executeSequence(actions);
            } catch (error) {
                console.error('Action sequence execution error:', error);
                return { success: false, error: error.message };
            }
        });

        // Capture screen
        ipcMain.handle('screen:capture', async () => {
            try {
                const base64 = await this.screenController.captureToBase64();
                return { success: true, image: base64 };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        // Analyze screen with AI
        ipcMain.handle('screen:analyze', async (event, question) => {
            try {
                if (!this.aiEngine || !this.visionAI) {
                    return { success: false, error: "AI engine not initialized. Please configure API keys." };
                }

                const base64 = await this.screenController.captureToBase64();
                const analysis = await this.visionAI.analyzeScreenshot(base64, question);
                return { success: true, analysis };
            } catch (error) {
                console.error('Screen analysis error:', error);
                return { success: false, error: error.message };
            }
        });

        // Get active window info
        ipcMain.handle('window:get-active', async () => {
            try {
                const window = await this.screenController.getActiveWindow();
                return { success: true, window };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        // List all windows
        ipcMain.handle('window:list', async () => {
            try {
                if (!this.windowController) {
                    return { success: false, error: "Window controller not initialized" };
                }
                const windows = await this.windowController.getWindows();
                return { success: true, windows };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        // Window controls
        ipcMain.on('window:minimize', () => {
            this.windowManager.getWindow().hide();
        });

        ipcMain.on('window:close', () => {
            this.windowManager.getWindow().hide();
        });

        ipcMain.on('window:resize', (event, { width, height }) => {
            const window = this.windowManager.getWindow();
            window.setSize(width, height);
            window.center();
        });

        // Clear AI conversation history
        ipcMain.handle('ai:clear-history', async () => {
            try {
                if (this.memoryManager) {
                    this.memoryManager.clearHistory();
                }
                if (this.aiEngine) {
                    this.aiEngine.clearHistory();
                }
                return { success: true };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        // Get available actions
        ipcMain.handle('actions:get-available', async () => {
            try {
                if (!this.actionExecutor) {
                    return { success: false, error: "Action executor not initialized" };
                }
                const actions = this.actionExecutor.getAvailableActions();
                return { success: true, actions };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        // Plan a task
        ipcMain.handle('task:plan', async (event, taskDescription) => {
            try {
                if (!this.taskPlanner || !this.aiEngine) {
                    return { success: false, error: "Task planner not initialized" };
                }

                const activeWindow = await this.screenController.getActiveWindow();
                const context = {
                    activeWindow,
                    screenSize: this.inputController ? this.inputController.getScreenSize() : { width: 1920, height: 1080 }
                };

                const plan = await this.taskPlanner.planTask(taskDescription, context);
                return plan;
            } catch (error) {
                console.error('Task planning error:', error);
                return { success: false, error: error.message };
            }
        });

        // Get memory stats
        ipcMain.handle('memory:get-stats', async () => {
            try {
                if (!this.memoryManager) {
                    return { success: false, error: "Memory manager not initialized" };
                }
                const stats = this.memoryManager.getStats();
                return { success: true, stats };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        // Get AI providers
        ipcMain.handle('ai:get-providers', async () => {
            try {
                if (!this.aiEngine) {
                    return { success: false, error: "AI engine not initialized" };
                }
                const providers = this.aiEngine.getAvailableProviders();
                return { success: true, providers };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        // Get clipboard history
        ipcMain.handle('clipboard:get-history', async () => {
            try {
                if (!this.clipboardController) {
                    return { success: false, error: "Clipboard controller not initialized" };
                }
                const history = await this.clipboardController.getHistory();
                return { success: true, history };
            } catch (error) {
                console.error('Get clipboard history error:', error);
                return { success: false, error: error.message };
            }
        });

        // Set clipboard content
        ipcMain.handle('clipboard:set', async (event, content) => {
            try {
                if (!this.clipboardController) {
                    return { success: false, error: "Clipboard controller not initialized" };
                }
                await this.clipboardController.write(content);
                return { success: true };
            } catch (error) {
                console.error('Set clipboard error:', error);
                return { success: false, error: error.message };
            }
        });

        // Delete clipboard item
        ipcMain.handle('clipboard:delete-item', async (event, itemId) => {
            try {
                if (!this.clipboardController) {
                    return { success: false, error: "Clipboard controller not initialized" };
                }
                await this.clipboardController.deleteItem(itemId);
                return { success: true };
            } catch (error) {
                console.error('Delete clipboard item error:', error);
                return { success: false, error: error.message };
            }
        });

        // Clear clipboard history
        ipcMain.handle('clipboard:clear-history', async () => {
            try {
                if (!this.clipboardController) {
                    return { success: false, error: "Clipboard controller not initialized" };
                }
                await this.clipboardController.clearHistory();
                return { success: true };
            } catch (error) {
                console.error('Clear clipboard history error:', error);
                return { success: false, error: error.message };
            }
        });

        // Get displays
        ipcMain.handle('screen:get-displays', async () => {
            try {
                const displays = await this.screenController.getDisplays();
                return { success: true, displays };
            } catch (error) {
                console.error('Get displays error:', error);
                return { success: false, error: error.message };
            }
        });

        // Get primary display index
        ipcMain.handle('screen:get-primary-display', async () => {
            try {
                const index = await this.screenController.getPrimaryDisplayIndex();
                return { success: true, index };
            } catch (error) {
                console.error('Get primary display error:', error);
                return { success: false, error: error.message };
            }
        });

        // Safety: Set dry run mode
        ipcMain.handle('safety:set-dry-run', async (event, enabled) => {
            try {
                safetyService.setDryRunMode(enabled);
                return { success: true, dryRunMode: enabled };
            } catch (error) {
                console.error('Set dry run mode error:', error);
                return { success: false, error: error.message };
            }
        });

        // Safety: Get dry run mode status
        ipcMain.handle('safety:get-dry-run', async () => {
            try {
                const enabled = safetyService.isDryRunMode();
                return { success: true, dryRunMode: enabled };
            } catch (error) {
                console.error('Get dry run mode error:', error);
                return { success: false, error: error.message };
            }
        });

        // Safety: Undo last action
        ipcMain.handle('safety:undo', async () => {
            try {
                const result = await safetyService.undoLastAction();
                return { success: result.success, result };
            } catch (error) {
                console.error('Undo action error:', error);
                return { success: false, error: error.message };
            }
        });

        // Safety: Rollback actions
        ipcMain.handle('safety:rollback', async (event, count) => {
            try {
                const result = await safetyService.rollbackActions(count || 1);
                return { success: result.success, result };
            } catch (error) {
                console.error('Rollback actions error:', error);
                return { success: false, error: error.message };
            }
        });

        // Safety: Get action stats
        ipcMain.handle('safety:get-stats', async () => {
            try {
                const stats = safetyService.getActionStats();
                return { success: true, stats };
            } catch (error) {
                console.error('Get action stats error:', error);
                return { success: false, error: error.message };
            }
        });

        // Safety: Get action history
        ipcMain.handle('safety:get-history', async (event, limit) => {
            try {
                const history = safetyService.getHistory(limit || 50);
                return { success: true, history };
            } catch (error) {
                console.error('Get action history error:', error);
                return { success: false, error: error.message };
            }
        });

        // Safety: Clear action history
        ipcMain.handle('safety:clear-history', async () => {
            try {
                safetyService.clearHistory();
                return { success: true };
            } catch (error) {
                console.error('Clear action history error:', error);
                return { success: false, error: error.message };
            }
        });

        // Safety: Add restricted zone
        ipcMain.handle('safety:add-restricted-zone', async (event, type, value) => {
            try {
                safetyService.addRestrictedZone(type, value);
                return { success: true };
            } catch (error) {
                console.error('Add restricted zone error:', error);
                return { success: false, error: error.message };
            }
        });

        // Safety: Remove restricted zone
        ipcMain.handle('safety:remove-restricted-zone', async (event, type, value) => {
            try {
                safetyService.removeRestrictedZone(type, value);
                return { success: true };
            } catch (error) {
                console.error('Remove restricted zone error:', error);
                return { success: false, error: error.message };
            }
        });

        // Safety: Set action limits
        ipcMain.handle('safety:set-limits', async (event, limits) => {
            try {
                safetyService.setActionLimits(limits);
                return { success: true };
            } catch (error) {
                console.error('Set action limits error:', error);
                return { success: false, error: error.message };
            }
        });

        // ==================== SCREEN RECORDING ====================

        // Screen Recording: Start recording
        ipcMain.handle('screen-recording:start', async (event, options) => {
            try {
                const result = await screenRecordingService.startRecording(options);
                return result;
            } catch (error) {
                console.error('Start screen recording error:', error);
                return { success: false, error: error.message };
            }
        });

        // Screen Recording: Stop recording
        ipcMain.handle('screen-recording:stop', async () => {
            try {
                const result = await screenRecordingService.stopRecording();
                return result;
            } catch (error) {
                console.error('Stop screen recording error:', error);
                return { success: false, error: error.message };
            }
        });

        // Screen Recording: Pause recording
        ipcMain.handle('screen-recording:pause', async () => {
            try {
                const result = screenRecordingService.pauseRecording();
                return result;
            } catch (error) {
                console.error('Pause screen recording error:', error);
                return { success: false, error: error.message };
            }
        });

        // Screen Recording: Resume recording
        ipcMain.handle('screen-recording:resume', async () => {
            try {
                const result = screenRecordingService.resumeRecording();
                return result;
            } catch (error) {
                console.error('Resume screen recording error:', error);
                return { success: false, error: error.message };
            }
        });

        // Screen Recording: Get recording
        ipcMain.handle('screen-recording:get-recording', async (event, recordingId) => {
            try {
                const recording = screenRecordingService.getRecording(recordingId);
                return { success: true, recording };
            } catch (error) {
                console.error('Get recording error:', error);
                return { success: false, error: error.message };
            }
        });

        // Screen Recording: Get recordings
        ipcMain.handle('screen-recording:get-recordings', async (event, filters) => {
            try {
                const recordings = screenRecordingService.getRecordings(filters);
                return { success: true, recordings };
            } catch (error) {
                console.error('Get recordings error:', error);
                return { success: false, error: error.message };
            }
        });

        // Screen Recording: Get recording frames
        ipcMain.handle('screen-recording:get-frames', async (event, recordingId) => {
            try {
                const frames = screenRecordingService.getRecordingFrames(recordingId);
                return { success: true, frames };
            } catch (error) {
                console.error('Get recording frames error:', error);
                return { success: false, error: error.message };
            }
        });

        // Screen Recording: Get recording statistics
        ipcMain.handle('screen-recording:get-statistics', async (event, recordingId) => {
            try {
                const stats = screenRecordingService.getRecordingStatistics(recordingId);
                return { success: true, stats };
            } catch (error) {
                console.error('Get recording statistics error:', error);
                return { success: false, error: error.message };
            }
        });

        // Screen Recording: Export recording
        ipcMain.handle('screen-recording:export', async (event, recordingId, format) => {
            try {
                const result = await screenRecordingService.exportRecording(recordingId, format);
                return result;
            } catch (error) {
                console.error('Export recording error:', error);
                return { success: false, error: error.message };
            }
        });

        // Screen Recording: Export all recordings
        ipcMain.handle('screen-recording:export-all', async (event, format) => {
            try {
                const result = await screenRecordingService.exportAllRecordings(format);
                return result;
            } catch (error) {
                console.error('Export all recordings error:', error);
                return { success: false, error: error.message };
            }
        });

        // Screen Recording: Delete recording
        ipcMain.handle('screen-recording:delete', async (event, recordingId) => {
            try {
                const result = await screenRecordingService.deleteRecording(recordingId);
                return result;
            } catch (error) {
                console.error('Delete recording error:', error);
                return { success: false, error: error.message };
            }
        });

        // Screen Recording: Update recording
        ipcMain.handle('screen-recording:update', async (event, recordingId, updates) => {
            try {
                const result = await screenRecordingService.updateRecording(recordingId, updates);
                return result;
            } catch (error) {
                console.error('Update recording error:', error);
                return { success: false, error: error.message };
            }
        });

        // ==================== PRODUCTIVITY ANALYTICS ====================

        // Productivity: Start tracking
        ipcMain.handle('productivity:start-tracking', async (event, options) => {
            try {
                const result = await productivityAnalyticsService.startTracking(options);
                return result;
            } catch (error) {
                console.error('Start tracking error:', error);
                return { success: false, error: error.message };
            }
        });

        // Productivity: Stop tracking
        ipcMain.handle('productivity:stop-tracking', async () => {
            try {
                const result = await productivityAnalyticsService.stopTracking();
                return result;
            } catch (error) {
                console.error('Stop tracking error:', error);
                return { success: false, error: error.message };
            }
        });

        // Productivity: Log application usage
        ipcMain.handle('productivity:log-app-usage', async (event, application, duration) => {
            try {
                productivityAnalyticsService.logApplicationUsage(application, duration);
                return { success: true };
            } catch (error) {
                console.error('Log application usage error:', error);
                return { success: false, error: error.message };
            }
        });

        // Productivity: Log website visit
        ipcMain.handle('productivity:log-website-visit', async (event, url, duration) => {
            try {
                productivityAnalyticsService.logWebsiteVisit(url, duration);
                return { success: true };
            } catch (error) {
                console.error('Log website visit error:', error);
                return { success: false, error: error.message };
            }
        });

        // Productivity: Add break
        ipcMain.handle('productivity:add-break', async (event, breakInfo) => {
            try {
                productivityAnalyticsService.addBreak(breakInfo);
                return { success: true };
            } catch (error) {
                console.error('Add break error:', error);
                return { success: false, error: error.message };
            }
        });

        // Productivity: Get time entry
        ipcMain.handle('productivity:get-time-entry', async (event, entryId) => {
            try {
                const entry = productivityAnalyticsService.getTimeEntry(entryId);
                return { success: true, entry };
            } catch (error) {
                console.error('Get time entry error:', error);
                return { success: false, error: error.message };
            }
        });

        // Productivity: Get time entries
        ipcMain.handle('productivity:get-time-entries', async (event, filters) => {
            try {
                const entries = productivityAnalyticsService.getTimeEntries(filters);
                return { success: true, entries };
            } catch (error) {
                console.error('Get time entries error:', error);
                return { success: false, error: error.message };
            }
        });

        // Productivity: Update time entry
        ipcMain.handle('productivity:update-time-entry', async (event, entryId, updates) => {
            try {
                const result = await productivityAnalyticsService.updateTimeEntry(entryId, updates);
                return result;
            } catch (error) {
                console.error('Update time entry error:', error);
                return { success: false, error: error.message };
            }
        });

        // Productivity: Delete time entry
        ipcMain.handle('productivity:delete-time-entry', async (event, entryId) => {
            try {
                const result = await productivityAnalyticsService.deleteTimeEntry(entryId);
                return result;
            } catch (error) {
                console.error('Delete time entry error:', error);
                return { success: false, error: error.message };
            }
        });

        // Productivity: Get statistics
        ipcMain.handle('productivity:get-statistics', async (event, filters) => {
            try {
                const stats = productivityAnalyticsService.getStatistics(filters);
                return { success: true, stats };
            } catch (error) {
                console.error('Get statistics error:', error);
                return { success: false, error: error.message };
            }
        });

        // Productivity: Get insights
        ipcMain.handle('productivity:get-insights', async (event, filters) => {
            try {
                const insights = productivityAnalyticsService.getInsights(filters);
                return { success: true, insights };
            } catch (error) {
                console.error('Get insights error:', error);
                return { success: false, error: error.message };
            }
        });

        // Productivity: Generate report
        ipcMain.handle('productivity:generate-report', async (event, options) => {
            try {
                const report = productivityAnalyticsService.generateReport(options);
                return { success: true, report };
            } catch (error) {
                console.error('Generate report error:', error);
                return { success: false, error: error.message };
            }
        });

        // ==================== HEALTH MONITORING ====================

        // Health: Start monitoring
        ipcMain.handle('health:start-monitoring', async (event, options) => {
            try {
                const result = await healthMonitoringService.startMonitoring(options);
                return result;
            } catch (error) {
                console.error('Start monitoring error:', error);
                return { success: false, error: error.message };
            }
        });

        // Health: Stop monitoring
        ipcMain.handle('health:stop-monitoring', async () => {
            try {
                const result = await healthMonitoringService.stopMonitoring();
                return result;
            } catch (error) {
                console.error('Stop monitoring error:', error);
                return { success: false, error: error.message };
            }
        });

        // Health: Acknowledge break
        ipcMain.handle('health:acknowledge-break', async (event, breakId) => {
            try {
                const result = healthMonitoringService.acknowledgeBreak(breakId);
                return result;
            } catch (error) {
                console.error('Acknowledge break error:', error);
                return { success: false, error: error.message };
            }
        });

        // Health: Skip break
        ipcMain.handle('health:skip-break', async (event, breakId, reason) => {
            try {
                const result = healthMonitoringService.skipBreak(breakId, reason);
                return result;
            } catch (error) {
                console.error('Skip break error:', error);
                return { success: false, error: error.message };
            }
        });

        // Health: Get wellness metric
        ipcMain.handle('health:get-wellness-metric', async (event, metricId) => {
            try {
                const metric = healthMonitoringService.getWellnessMetric(metricId);
                return { success: true, metric };
            } catch (error) {
                console.error('Get wellness metric error:', error);
                return { success: false, error: error.message };
            }
        });

        // Health: Get wellness metrics
        ipcMain.handle('health:get-wellness-metrics', async (event, filters) => {
            try {
                const metrics = healthMonitoringService.getWellnessMetrics(filters);
                return { success: true, metrics };
            } catch (error) {
                console.error('Get wellness metrics error:', error);
                return { success: false, error: error.message };
            }
        });

        // Health: Get wellness statistics
        ipcMain.handle('health:get-wellness-statistics', async (event, filters) => {
            try {
                const stats = healthMonitoringService.getWellnessStatistics(filters);
                return { success: true, stats };
            } catch (error) {
                console.error('Get wellness statistics error:', error);
                return { success: false, error: error.message };
            }
        });

        // Health: Update wellness metric
        ipcMain.handle('health:update-wellness-metric', async (event, metricId, updates) => {
            try {
                const result = await healthMonitoringService.updateWellnessMetric(metricId, updates);
                return result;
            } catch (error) {
                console.error('Update wellness metric error:', error);
                return { success: false, error: error.message };
            }
        });

        // Health: Delete wellness metric
        ipcMain.handle('health:delete-wellness-metric', async (event, metricId) => {
            try {
                const result = await healthMonitoringService.deleteWellnessMetric(metricId);
                return result;
            } catch (error) {
                console.error('Delete wellness metric error:', error);
                return { success: false, error: error.message };
            }
        });

        // ==================== FOCUS MODE ====================

        // Focus: Start focus mode
        ipcMain.handle('focus:start-focus-mode', async (event, options) => {
            try {
                const result = await focusModeService.startFocusMode(options);
                return result;
            } catch (error) {
                console.error('Start focus mode error:', error);
                return { success: false, error: error.message };
            }
        });

        // Focus: Stop focus mode
        ipcMain.handle('focus:stop-focus-mode', async () => {
            try {
                const result = await focusModeService.stopFocusMode();
                return result;
            } catch (error) {
                console.error('Stop focus mode error:', error);
                return { success: false, error: error.message };
            }
        });

        // Focus: Pause focus mode
        ipcMain.handle('focus:pause-focus-mode', async () => {
            try {
                const result = focusModeService.pauseFocusMode();
                return result;
            } catch (error) {
                console.error('Pause focus mode error:', error);
                return { success: false, error: error.message };
            }
        });

        // Focus: Resume focus mode
        ipcMain.handle('focus:resume-focus-mode', async () => {
            try {
                const result = focusModeService.resumeFocusMode();
                return result;
            } catch (error) {
                console.error('Resume focus mode error:', error);
                return { success: false, error: error.message };
            }
        });

        // Focus: Log interruption
        ipcMain.handle('focus:log-interruption', async (event, interruption) => {
            try {
                const result = focusModeService.logInterruption(interruption);
                return result;
            } catch (error) {
                console.error('Log interruption error:', error);
                return { success: false, error: error.message };
            }
        });

        // Focus: Block website
        ipcMain.handle('focus:block-website', async (event, url, options) => {
            try {
                const result = await focusModeService.blockWebsite(url, options);
                return result;
            } catch (error) {
                console.error('Block website error:', error);
                return { success: false, error: error.message };
            }
        });

        // Focus: Unblock website
        ipcMain.handle('focus:unblock-website', async (event, blockId) => {
            try {
                const result = await focusModeService.unblockWebsite(blockId);
                return result;
            } catch (error) {
                console.error('Unblock website error:', error);
                return { success: false, error: error.message };
            }
        });

        // Focus: Block app
        ipcMain.handle('focus:block-app', async (event, appName, options) => {
            try {
                const result = await focusModeService.blockApp(appName, options);
                return result;
            } catch (error) {
                console.error('Block app error:', error);
                return { success: false, error: error.message };
            }
        });

        // Focus: Unblock app
        ipcMain.handle('focus:unblock-app', async (event, blockId) => {
            try {
                const result = await focusModeService.unblockApp(blockId);
                return result;
            } catch (error) {
                console.error('Unblock app error:', error);
                return { success: false, error: error.message };
            }
        });

        // Focus: Check if website blocked
        ipcMain.handle('focus:is-website-blocked', async (event, url) => {
            try {
                const isBlocked = focusModeService.isWebsiteBlocked(url);
                return { success: true, isBlocked };
            } catch (error) {
                console.error('Check website blocked error:', error);
                return { success: false, error: error.message };
            }
        });

        // Focus: Check if app blocked
        ipcMain.handle('focus:is-app-blocked', async (event, appName) => {
            try {
                const isBlocked = focusModeService.isAppBlocked(appName);
                return { success: true, isBlocked };
            } catch (error) {
                console.error('Check app blocked error:', error);
                return { success: false, error: error.message };
            }
        });

        // Focus: Add whitelisted site
        ipcMain.handle('focus:add-whitelisted-site', async (event, url) => {
            try {
                const result = await focusModeService.addWhitelistedSite(url);
                return result;
            } catch (error) {
                console.error('Add whitelisted site error:', error);
                return { success: false, error: error.message };
            }
        });

        // Focus: Remove whitelisted site
        ipcMain.handle('focus:remove-whitelisted-site', async (event, whitelistId) => {
            try {
                const result = await focusModeService.removeWhitelistedSite(whitelistId);
                return result;
            } catch (error) {
                console.error('Remove whitelisted site error:', error);
                return { success: false, error: error.message };
            }
        });

        // Focus: Add whitelisted app
        ipcMain.handle('focus:add-whitelisted-app', async (event, appName) => {
            try {
                const result = await focusModeService.addWhitelistedApp(appName);
                return result;
            } catch (error) {
                console.error('Add whitelisted app error:', error);
                return { success: false, error: error.message };
            }
        });

        // Focus: Remove whitelisted app
        ipcMain.handle('focus:remove-whitelisted-app', async (event, whitelistId) => {
            try {
                const result = await focusModeService.removeWhitelistedApp(whitelistId);
                return result;
            } catch (error) {
                console.error('Remove whitelisted app error:', error);
                return { success: false, error: error.message };
            }
        });

        // Focus: Get focus session
        ipcMain.handle('focus:get-focus-session', async (event, sessionId) => {
            try {
                const session = focusModeService.getFocusSession(sessionId);
                return { success: true, session };
            } catch (error) {
                console.error('Get focus session error:', error);
                return { success: false, error: error.message };
            }
        });

        // Focus: Get focus sessions
        ipcMain.handle('focus:get-focus-sessions', async (event, filters) => {
            try {
                const sessions = focusModeService.getFocusSessions(filters);
                return { success: true, sessions };
            } catch (error) {
                console.error('Get focus sessions error:', error);
                return { success: false, error: error.message };
            }
        });

        // Focus: Get focus statistics
        ipcMain.handle('focus:get-focus-statistics', async (event, filters) => {
            try {
                const stats = focusModeService.getFocusStatistics(filters);
                return { success: true, stats };
            } catch (error) {
                console.error('Get focus statistics error:', error);
                return { success: false, error: error.message };
            }
        });

        // ==================== OCR SERVICE ====================

        // OCR: Extract text from file
        ipcMain.handle('ocr:extract-from-file', async (event, imagePath, options) => {
            try {
                const result = await ocrService.extractTextFromFile(imagePath, options);
                return result;
            } catch (error) {
                console.error('OCR extract from file error:', error);
                return { success: false, error: error.message };
            }
        });

        // OCR: Extract text from base64
        ipcMain.handle('ocr:extract-from-base64', async (event, base64Image, options) => {
            try {
                const result = await ocrService.extractTextFromBase64(base64Image, options);
                return result;
            } catch (error) {
                console.error('OCR extract from base64 error:', error);
                return { success: false, error: error.message };
            }
        });

        // OCR: Extract text from buffer
        ipcMain.handle('ocr:extract-from-buffer', async (event, imageBuffer, options) => {
            try {
                const result = await ocrService.extractTextFromBuffer(imageBuffer, options);
                return result;
            } catch (error) {
                console.error('OCR extract from buffer error:', error);
                return { success: false, error: error.message };
            }
        });

        // OCR: Extract text from region
        ipcMain.handle('ocr:extract-from-region', async (event, imagePath, region, options) => {
            try {
                const result = await ocrService.extractTextFromRegion(imagePath, region, options);
                return result;
            } catch (error) {
                console.error('OCR extract from region error:', error);
                return { success: false, error: error.message };
            }
        });

        // OCR: Extract structured data
        ipcMain.handle('ocr:extract-structured', async (event, imagePath, options) => {
            try {
                const result = await ocrService.extractStructuredData(imagePath, options);
                return result;
            } catch (error) {
                console.error('OCR extract structured data error:', error);
                return { success: false, error: error.message };
            }
        });

        // OCR: Change language
        ipcMain.handle('ocr:change-language', async (event, language) => {
            try {
                const result = await ocrService.changeLanguage(language);
                return result;
            } catch (error) {
                console.error('OCR change language error:', error);
                return { success: false, error: error.message };
            }
        });

        // OCR: Get supported languages
        ipcMain.handle('ocr:get-languages', async () => {
            try {
                const languages = ocrService.getSupportedLanguages();
                return { success: true, languages };
            } catch (error) {
                console.error('OCR get languages error:', error);
                return { success: false, error: error.message };
            }
        });

        // OCR: Clear cache
        ipcMain.handle('ocr:clear-cache', async () => {
            try {
                const result = await ocrService.clearCache();
                return result;
            } catch (error) {
                console.error('OCR clear cache error:', error);
                return { success: false, error: error.message };
            }
        });

        // ==================== DOCUMENT PARSER ====================

        // Document: Parse document
        ipcMain.handle('document:parse', async (event, filePath, options) => {
            try {
                const result = await documentParserService.parseDocument(filePath, options);
                return result;
            } catch (error) {
                console.error('Document parse error:', error);
                return { success: false, error: error.message };
            }
        });

        // Document: Summarize document
        ipcMain.handle('document:summarize', async (event, parsedDocument, options) => {
            try {
                const result = await documentParserService.summarizeDocument(parsedDocument, options);
                return result;
            } catch (error) {
                console.error('Document summarize error:', error);
                return { success: false, error: error.message };
            }
        });

        // Document: Search in document
        ipcMain.handle('document:search', async (event, parsedDocument, query, options) => {
            try {
                const result = await documentParserService.searchDocument(parsedDocument, query, options);
                return result;
            } catch (error) {
                console.error('Document search error:', error);
                return { success: false, error: error.message };
            }
        });

        // Document: Get supported formats
        ipcMain.handle('document:get-formats', async () => {
            try {
                const formats = documentParserService.getSupportedFormats();
                return { success: true, formats };
            } catch (error) {
                console.error('Document get formats error:', error);
                return { success: false, error: error.message };
            }
        });

        // Document: Clear cache
        ipcMain.handle('document:clear-cache', async () => {
            try {
                const result = await documentParserService.clearCache();
                return result;
            } catch (error) {
                console.error('Document clear cache error:', error);
                return { success: false, error: error.message };
            }
        });

        // ==================== VOICE SERVICE ====================

        // Voice: Start recognition
        ipcMain.handle('voice:start-recognition', async (event, options) => {
            try {
                const result = await voiceService.startRecognition(options);
                return result;
            } catch (error) {
                console.error('Voice start recognition error:', error);
                return { success: false, error: error.message };
            }
        });

        // Voice: Stop recognition
        ipcMain.handle('voice:stop-recognition', async () => {
            try {
                const result = await voiceService.stopRecognition();
                return result;
            } catch (error) {
                console.error('Voice stop recognition error:', error);
                return { success: false, error: error.message };
            }
        });

        // Voice: Start recording
        ipcMain.handle('voice:start-recording', async (event, options) => {
            try {
                const result = await voiceService.startRecording(options);
                return result;
            } catch (error) {
                console.error('Voice start recording error:', error);
                return { success: false, error: error.message };
            }
        });

        // Voice: Stop recording
        ipcMain.handle('voice:stop-recording', async () => {
            try {
                const result = await voiceService.stopRecording();
                return result;
            } catch (error) {
                console.error('Voice stop recording error:', error);
                return { success: false, error: error.message };
            }
        });

        // Voice: Text to speech
        ipcMain.handle('voice:text-to-speech', async (event, text, options) => {
            try {
                const result = await voiceService.textToSpeech(text, options);
                return result;
            } catch (error) {
                console.error('Voice text to speech error:', error);
                return { success: false, error: error.message };
            }
        });

        // Voice: Stop speech
        ipcMain.handle('voice:stop-speech', async () => {
            try {
                const result = await voiceService.stopSpeech();
                return result;
            } catch (error) {
                console.error('Voice stop speech error:', error);
                return { success: false, error: error.message };
            }
        });

        // Voice: Get available voices
        ipcMain.handle('voice:get-voices', async () => {
            try {
                const voices = voiceService.getAvailableVoices();
                return { success: true, voices };
            } catch (error) {
                console.error('Voice get voices error:', error);
                return { success: false, error: error.message };
            }
        });

        // Voice: Add command
        ipcMain.handle('voice:add-command', async (event, phrase, callback, options) => {
            try {
                const command = voiceService.addCommand(phrase, callback, options);
                return { success: true, command };
            } catch (error) {
                console.error('Voice add command error:', error);
                return { success: false, error: error.message };
            }
        });

        // Voice: Remove command
        ipcMain.handle('voice:remove-command', async (event, commandId) => {
            try {
                const removed = voiceService.removeCommand(commandId);
                return { success: true, removed };
            } catch (error) {
                console.error('Voice remove command error:', error);
                return { success: false, error: error.message };
            }
        });

        // Voice: Get commands
        ipcMain.handle('voice:get-commands', async () => {
            try {
                const commands = voiceService.getCommands();
                return { success: true, commands };
            } catch (error) {
                console.error('Voice get commands error:', error);
                return { success: false, error: error.message };
            }
        });

        // Voice: Get recording
        ipcMain.handle('voice:get-recording', async (event, recordingId) => {
            try {
                const recording = voiceService.getRecording(recordingId);
                return { success: true, recording };
            } catch (error) {
                console.error('Voice get recording error:', error);
                return { success: false, error: error.message };
            }
        });

        // Voice: Get recordings
        ipcMain.handle('voice:get-recordings', async (event, filters) => {
            try {
                const recordings = voiceService.getRecordings(filters);
                return { success: true, recordings };
            } catch (error) {
                console.error('Voice get recordings error:', error);
                return { success: false, error: error.message };
            }
        });

        // Voice: Delete recording
        ipcMain.handle('voice:delete-recording', async (event, recordingId) => {
            try {
                const result = await voiceService.deleteRecording(recordingId);
                return result;
            } catch (error) {
                console.error('Voice delete recording error:', error);
                return { success: false, error: error.message };
            }
        });

        // Voice: Set language
        ipcMain.handle('voice:set-language', async (event, language) => {
            try {
                const result = voiceService.setLanguage(language);
                return result;
            } catch (error) {
                console.error('Voice set language error:', error);
                return { success: false, error: error.message };
            }
        });

        // Voice: Get language
        ipcMain.handle('voice:get-language', async () => {
            try {
                const language = voiceService.getLanguage();
                return { success: true, language };
            } catch (error) {
                console.error('Voice get language error:', error);
                return { success: false, error: error.message };
            }
        });

        console.log('IPC handlers registered');
    }

    async initializeControllers() {
        try {
            // Initialize basic controllers
            this.screenController = new ScreenController();
            await this.screenController.initialize();

            // Try to initialize input controller (requires robotjs which may not be installed)
            try {
                this.inputController = new InputController();
                console.log('Input controller initialized');
            } catch (error) {
                console.warn('Input controller not available (robotjs not installed):', error.message);
            }

            this.fileController = new FileController();
            this.browserController = new BrowserController();
            await this.browserController.initialize();
            this.appController = new AppController();
            this.clipboardController = new ClipboardController();
            this.windowController = new WindowController();

            // Initialize action executor
            this.actionExecutor = new ActionExecutor();

            // Initialize AI components if API keys are available
            const config = {
                anthropicKey: process.env.ANTHROPIC_API_KEY,
                openaiKey: process.env.OPENAI_API_KEY,
                defaultProvider: process.env.DEFAULT_AI_PROVIDER || 'anthropic'
            };

            if (config.anthropicKey || config.openaiKey) {
                this.aiEngine = new AIEngine(config);
                this.memoryManager = new MemoryManager();
                this.taskPlanner = new TaskPlanner(this.aiEngine);
                this.visionAI = new VisionAI(this.aiEngine);
                console.log('AI components initialized');
            } else {
                console.warn('No API keys found. AI features will be limited.');
            }

            console.log('Controllers initialized successfully');
        } catch (error) {
            console.error('Failed to initialize controllers:', error);
        }
    }

    unregister() {
        // Remove all IPC handlers
        ipcMain.removeAllListeners();
        console.log('IPC handlers unregistered');
    }
}

module.exports = IPCHandlers;
