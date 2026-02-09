const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Safety Service - Provides safety mechanisms for automation
 * Features: Dry run mode, undo/rollback, action limits, restricted zones
 */
class SafetyService {
    constructor() {
        this.dryRunMode = false;
        this.actionHistory = [];
        this.maxHistorySize = 100;
        this.actionLimits = {
            maxActionsPerMinute: 60,
            maxActionsPerHour: 1000,
            maxActionsPerDay: 10000
        };
        this.actionCounts = {
            minute: [],
            hour: [],
            day: []
        };
        this.restrictedZones = {
            apps: [],
            folders: [],
            websites: []
        };
        this.dangerousActions = new Set([
            'deleteFile',
            'deleteDirectory',
            'formatDisk',
            'shutdown',
            'restart',
            'sendEmail',
            'makePurchase',
            'transferMoney',
            'executeCommand',
            'installSoftware',
            'modifySystemSettings'
        ]);
        this.historyFile = path.join(os.tmpdir(), 'ai-desktop-agent', 'action-history.json');
        this.loadHistory();
    }

    /**
     * Enable or disable dry run mode
     * @param {boolean} enabled - Whether to enable dry run mode
     */
    setDryRunMode(enabled) {
        this.dryRunMode = enabled;
        console.log(`[Safety] Dry run mode ${enabled ? 'ENABLED' : 'DISABLED'}`);
    }

    /**
     * Check if dry run mode is active
     * @returns {boolean} True if dry run mode is active
     */
    isDryRunMode() {
        return this.dryRunMode;
    }

    /**
     * Record an action for undo/rollback
     * @param {Object} action - Action to record
     * @returns {Promise<string>} Action ID
     */
    async recordAction(action) {
        const actionId = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const record = {
            id: actionId,
            type: action.type,
            timestamp: Date.now(),
            params: action.params,
            result: action.result,
            dryRun: this.dryRunMode,
            undoable: this.isActionUndoable(action.type)
        };

        this.actionHistory.push(record);

        // Enforce history size limit
        if (this.actionHistory.length > this.maxHistorySize) {
            this.actionHistory.shift();
        }

        // Update action counts
        this.updateActionCounts();

        // Save history to disk
        this.saveHistory();

        console.log(`[Safety] Recorded action: ${action.type} (ID: ${actionId})`);
        return actionId;
    }

    /**
     * Check if an action type is undoable
     * @param {string} actionType - Type of action
     * @returns {boolean} True if action is undoable
     */
    isActionUndoable(actionType) {
        const undoableActions = new Set([
            'writeFile',
            'copyFile',
            'moveFile',
            'createDirectory',
            'typeText',
            'clickMouse',
            'pressKey',
            'setClipboard',
            'openApp',
            'closeApp',
            'navigate',
            'clickElement',
            'typeInElement'
        ]);
        return undoableActions.has(actionType);
    }

    /**
     * Undo the last action
     * @returns {Promise<Object>} Undo result
     */
    async undoLastAction() {
        if (this.actionHistory.length === 0) {
            return {
                success: false,
                message: 'No actions to undo'
            };
        }

        // Find the last undoable action
        let lastAction = null;
        let index = this.actionHistory.length - 1;

        while (index >= 0) {
            if (this.actionHistory[index].undoable && !this.actionHistory[index].dryRun) {
                lastAction = this.actionHistory[index];
                break;
            }
            index--;
        }

        if (!lastAction) {
            return {
                success: false,
                message: 'No undoable actions found'
            };
        }

        try {
            const undoResult = await this.performUndo(lastAction);

            // Mark action as undone
            lastAction.undone = true;
            lastAction.undoneAt = Date.now();
            this.saveHistory();

            return {
                success: true,
                actionId: lastAction.id,
                actionType: lastAction.type,
                undoResult
            };
        } catch (error) {
            console.error('[Safety] Undo error:', error);
            return {
                success: false,
                message: `Failed to undo action: ${error.message}`
            };
        }
    }

    /**
     * Perform undo for a specific action
     * @param {Object} action - Action to undo
     * @returns {Promise<Object>} Undo result
     */
    async performUndo(action) {
        console.log(`[Safety] Undoing action: ${action.type}`);

        switch (action.type) {
            case 'writeFile':
                // Restore original file content if backed up
                if (action.params.backupPath && fs.existsSync(action.params.backupPath)) {
                    fs.copyFileSync(action.params.backupPath, action.params.filePath);
                    fs.unlinkSync(action.params.backupPath);
                    return { message: 'File restored from backup' };
                }
                return { message: 'No backup available' };

            case 'copyFile':
                // Delete the copied file
                if (fs.existsSync(action.params.to)) {
                    fs.unlinkSync(action.params.to);
                    return { message: 'Copied file deleted' };
                }
                return { message: 'File not found' };

            case 'moveFile':
                // Move file back to original location
                if (fs.existsSync(action.params.to)) {
                    fs.renameSync(action.params.to, action.params.from);
                    return { message: 'File moved back to original location' };
                }
                return { message: 'File not found' };

            case 'createDirectory':
                // Delete the created directory
                if (fs.existsSync(action.params.dirPath)) {
                    fs.rmdirSync(action.params.dirPath, { recursive: true });
                    return { message: 'Directory deleted' };
                }
                return { message: 'Directory not found' };

            case 'setClipboard':
                // Restore previous clipboard content
                if (action.params.previousContent) {
                    // This would need clipboard controller
                    return { message: 'Clipboard restore requires clipboard controller' };
                }
                return { message: 'No previous clipboard content' };

            default:
                return { message: `Undo not implemented for action type: ${action.type}` };
        }
    }

    /**
     * Rollback multiple actions
     * @param {number} count - Number of actions to rollback
     * @returns {Promise<Object>} Rollback result
     */
    async rollbackActions(count = 1) {
        const results = [];

        for (let i = 0; i < count; i++) {
            const result = await this.undoLastAction();
            results.push(result);

            if (!result.success) {
                break;
            }
        }

        return {
            success: results.every(r => r.success),
            undoneCount: results.filter(r => r.success).length,
            results
        };
    }

    /**
     * Check if an action should be confirmed
     * @param {Object} action - Action to check
     * @returns {boolean} True if action requires confirmation
     */
    requiresConfirmation(action) {
        // Dangerous actions always require confirmation
        if (this.dangerousActions.has(action.type)) {
            return true;
        }

        // Actions in restricted zones require confirmation
        if (this.isInRestrictedZone(action)) {
            return true;
        }

        // Actions that would exceed limits require confirmation
        if (this.wouldExceedLimits(action)) {
            return true;
        }

        return false;
    }

    /**
     * Check if action is in a restricted zone
     * @param {Object} action - Action to check
     * @returns {boolean} True if action is in restricted zone
     */
    isInRestrictedZone(action) {
        // Check app restrictions
        if (action.params.appName && this.restrictedZones.apps.includes(action.params.appName)) {
            return true;
        }

        // Check folder restrictions
        if (action.params.filePath || action.params.dirPath) {
            const targetPath = action.params.filePath || action.params.dirPath;
            for (const restrictedFolder of this.restrictedZones.folders) {
                if (targetPath.startsWith(restrictedFolder)) {
                    return true;
                }
            }
        }

        // Check website restrictions
        if (action.params.url) {
            for (const restrictedWebsite of this.restrictedZones.websites) {
                if (action.params.url.includes(restrictedWebsite)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Check if action would exceed limits
     * @param {Object} action - Action to check
     * @returns {boolean} True if action would exceed limits
     */
    wouldExceedLimits(action) {
        const now = Date.now();

        // Check per-minute limit
        const minuteAgo = now - 60000;
        const recentMinuteActions = this.actionCounts.minute.filter(t => t > minuteAgo);
        if (recentMinuteActions.length >= this.actionLimits.maxActionsPerMinute) {
            return true;
        }

        // Check per-hour limit
        const hourAgo = now - 3600000;
        const recentHourActions = this.actionCounts.hour.filter(t => t > hourAgo);
        if (recentHourActions.length >= this.actionLimits.maxActionsPerHour) {
            return true;
        }

        // Check per-day limit
        const dayAgo = now - 86400000;
        const recentDayActions = this.actionCounts.day.filter(t => t > dayAgo);
        if (recentDayActions.length >= this.actionLimits.maxActionsPerDay) {
            return true;
        }

        return false;
    }

    /**
     * Update action counts for rate limiting
     */
    updateActionCounts() {
        const now = Date.now();

        this.actionCounts.minute.push(now);
        this.actionCounts.hour.push(now);
        this.actionCounts.day.push(now);

        // Clean up old counts
        const minuteAgo = now - 60000;
        const hourAgo = now - 3600000;
        const dayAgo = now - 86400000;

        this.actionCounts.minute = this.actionCounts.minute.filter(t => t > minuteAgo);
        this.actionCounts.hour = this.actionCounts.hour.filter(t => t > hourAgo);
        this.actionCounts.day = this.actionCounts.day.filter(t => t > dayAgo);
    }

    /**
     * Add a restricted zone
     * @param {string} type - Type of restriction (app, folder, website)
     * @param {string} value - Value to restrict
     */
    addRestrictedZone(type, value) {
        if (this.restrictedZones[type]) {
            this.restrictedZones[type].push(value);
            console.log(`[Safety] Added restricted ${type}: ${value}`);
        }
    }

    /**
     * Remove a restricted zone
     * @param {string} type - Type of restriction (app, folder, website)
     * @param {string} value - Value to unrestrict
     */
    removeRestrictedZone(type, value) {
        if (this.restrictedZones[type]) {
            const index = this.restrictedZones[type].indexOf(value);
            if (index > -1) {
                this.restrictedZones[type].splice(index, 1);
                console.log(`[Safety] Removed restricted ${type}: ${value}`);
            }
        }
    }

    /**
     * Set action limits
     * @param {Object} limits - New action limits
     */
    setActionLimits(limits) {
        this.actionLimits = { ...this.actionLimits, ...limits };
        console.log('[Safety] Updated action limits:', this.actionLimits);
    }

    /**
     * Get action statistics
     * @returns {Object} Action statistics
     */
    getActionStats() {
        const now = Date.now();
        const minuteAgo = now - 60000;
        const hourAgo = now - 3600000;
        const dayAgo = now - 86400000;

        return {
            totalActions: this.actionHistory.length,
            actionsPerMinute: this.actionCounts.minute.filter(t => t > minuteAgo).length,
            actionsPerHour: this.actionCounts.hour.filter(t => t > hourAgo).length,
            actionsPerDay: this.actionCounts.day.filter(t => t > dayAgo).length,
            limits: this.actionLimits,
            dryRunMode: this.dryRunMode,
            restrictedZones: this.restrictedZones
        };
    }

    /**
     * Clear action history
     */
    clearHistory() {
        this.actionHistory = [];
        this.actionCounts = {
            minute: [],
            hour: [],
            day: []
        };
        this.saveHistory();
        console.log('[Safety] Action history cleared');
    }

    /**
     * Save action history to disk
     */
    saveHistory() {
        try {
            const dir = path.dirname(this.historyFile);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const data = {
                history: this.actionHistory,
                restrictedZones: this.restrictedZones,
                actionLimits: this.actionLimits
            };

            fs.writeFileSync(this.historyFile, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('[Safety] Failed to save history:', error);
        }
    }

    /**
     * Load action history from disk
     */
    loadHistory() {
        try {
            if (fs.existsSync(this.historyFile)) {
                const data = JSON.parse(fs.readFileSync(this.historyFile, 'utf8'));
                this.actionHistory = data.history || [];
                this.restrictedZones = data.restrictedZones || this.restrictedZones;
                this.actionLimits = data.actionLimits || this.actionLimits;

                // Rebuild action counts from history
                const now = Date.now();
                this.actionCounts = {
                    minute: this.actionHistory
                        .filter(a => now - a.timestamp < 60000)
                        .map(a => a.timestamp),
                    hour: this.actionHistory
                        .filter(a => now - a.timestamp < 3600000)
                        .map(a => a.timestamp),
                    day: this.actionHistory
                        .filter(a => now - a.timestamp < 86400000)
                        .map(a => a.timestamp)
                };

                console.log(`[Safety] Loaded ${this.actionHistory.length} actions from history`);
            }
        } catch (error) {
            console.error('[Safety] Failed to load history:', error);
        }
    }

    /**
     * Get action history
     * @param {number} limit - Maximum number of actions to return
     * @returns {Array} Action history
     */
    getHistory(limit = 50) {
        return this.actionHistory.slice(-limit).reverse();
    }
}

// Export singleton instance
const safetyService = new SafetyService();
module.exports = safetyService;
