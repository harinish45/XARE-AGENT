const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const http = require('http');

/**
 * Trigger Manager - Manages all trigger types
 * Supports: Time, File, Hotkey, Webhook, Window, Email, Clipboard triggers
 */
class TriggerManager extends EventEmitter {
    constructor() {
        super();
        this.triggers = new Map(); // Store all triggers by ID
        this.activeTriggers = new Set(); // Currently active triggers
        this.watchers = new Map(); // File watchers
        this.hotkeys = new Map(); // Registered hotkeys
        this.webhookServer = null; // Webhook server
        this.scheduledJobs = new Map(); // Scheduled time-based triggers
    }

    /**
     * Register a new trigger
     * @param {Object} trigger - Trigger configuration
     * @returns {string} Trigger ID
     */
    registerTrigger(trigger) {
        const triggerId = `trigger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const triggerConfig = {
            id: triggerId,
            ...trigger,
            enabled: trigger.enabled !== false,
            createdAt: new Date().toISOString(),
            lastTriggered: null,
            triggerCount: 0
        };

        this.triggers.set(triggerId, triggerConfig);
        console.log(`[Trigger] Registered: ${trigger.type} (${triggerId})`);

        // Activate trigger if enabled
        if (triggerConfig.enabled) {
            this.activateTrigger(triggerId);
        }

        return triggerId;
    }

    /**
     * Activate a trigger
     * @param {string} triggerId - Trigger ID to activate
     */
    async activateTrigger(triggerId) {
        const trigger = this.triggers.get(triggerId);
        if (!trigger) {
            console.error(`[Trigger] Trigger not found: ${triggerId}`);
            return;
        }

        console.log(`[Trigger] Activating: ${trigger.type} (${triggerId})`);

        switch (trigger.type) {
            case 'time':
                await this.activateTimeTrigger(triggerId, trigger);
                break;
            case 'file':
                await this.activateFileTrigger(triggerId, trigger);
                break;
            case 'hotkey':
                this.activateHotkeyTrigger(triggerId, trigger);
                break;
            case 'webhook':
                await this.activateWebhookTrigger(triggerId, trigger);
                break;
            case 'window':
                await this.activateWindowTrigger(triggerId, trigger);
                break;
            case 'email':
                await this.activateEmailTrigger(triggerId, trigger);
                break;
            case 'clipboard':
                await this.activateClipboardTrigger(triggerId, trigger);
                break;
            default:
                console.error(`[Trigger] Unknown trigger type: ${trigger.type}`);
        }

        this.activeTriggers.add(triggerId);
    }

    /**
     * Deactivate a trigger
     * @param {string} triggerId - Trigger ID to deactivate
     */
    async deactivateTrigger(triggerId) {
        const trigger = this.triggers.get(triggerId);
        if (!trigger) {
            console.error(`[Trigger] Trigger not found: ${triggerId}`);
            return;
        }

        console.log(`[Trigger] Deactivating: ${trigger.type} (${triggerId})`);

        switch (trigger.type) {
            case 'time':
                await this.deactivateTimeTrigger(triggerId, trigger);
                break;
            case 'file':
                await this.deactivateFileTrigger(triggerId, trigger);
                break;
            case 'hotkey':
                this.deactivateHotkeyTrigger(triggerId, trigger);
                break;
            case 'webhook':
                await this.deactivateWebhookTrigger(triggerId, trigger);
                break;
            case 'window':
                await this.deactivateWindowTrigger(triggerId, trigger);
                break;
            case 'email':
                await this.deactivateEmailTrigger(triggerId, trigger);
                break;
            case 'clipboard':
                await this.deactivateClipboardTrigger(triggerId, trigger);
                break;
            default:
                console.error(`[Trigger] Unknown trigger type: ${trigger.type}`);
        }

        this.activeTriggers.delete(triggerId);
    }

    /**
     * Delete a trigger
     * @param {string} triggerId - Trigger ID to delete
     */
    async deleteTrigger(triggerId) {
        const trigger = this.triggers.get(triggerId);
        if (!trigger) {
            console.error(`[Trigger] Trigger not found: ${triggerId}`);
            return;
        }

        // Deactivate if active
        if (this.activeTriggers.has(triggerId)) {
            await this.deactivateTrigger(triggerId);
        }

        this.triggers.delete(triggerId);
        console.log(`[Trigger] Deleted: ${triggerId}`);
    }

    /**
     * Get all triggers
     * @returns {Array} Array of all triggers
     */
    getTriggers() {
        return Array.from(this.triggers.values());
    }

    /**
     * Get trigger by ID
     * @param {string} triggerId - Trigger ID
     * @returns {Object|null} Trigger configuration
     */
    getTrigger(triggerId) {
        return this.triggers.get(triggerId) || null;
    }

    /**
     * Update trigger configuration
     * @param {string} triggerId - Trigger ID
     * @param {Object} updates - Updates to apply
     */
    async updateTrigger(triggerId, updates) {
        const trigger = this.triggers.get(triggerId);
        if (!trigger) {
            console.error(`[Trigger] Trigger not found: ${triggerId}`);
            return;
        }

        const wasEnabled = trigger.enabled;
        const updatedTrigger = { ...trigger, ...updates };

        this.triggers.set(triggerId, updatedTrigger);
        console.log(`[Trigger] Updated: ${triggerId}`);

        // Reactivate if enabled state changed
        if (wasEnabled !== updatedTrigger.enabled) {
            if (updatedTrigger.enabled) {
                await this.activateTrigger(triggerId);
            } else {
                await this.deactivateTrigger(triggerId);
            }
        }
    }

    // ==================== TIME TRIGGERS ====================

    /**
     * Activate time-based trigger
     * @private
     */
    async activateTimeTrigger(triggerId, trigger) {
        const { schedule, action } = trigger.config;

        // Parse cron schedule
        const cronPattern = this.parseCron(schedule);
        const nextRun = this.getNextRunTime(cronPattern);

        console.log(`[Trigger] Time trigger scheduled: ${nextRun.toISOString()}`);

        // Schedule the job
        const jobId = setTimeout(async () => {
            await this.executeTriggerAction(triggerId, action);
            this.updateTriggerLastTriggered(triggerId);
        }, nextRun - Date.now());

        this.scheduledJobs.set(triggerId, jobId);
    }

    /**
     * Deactivate time-based trigger
     * @private
     */
    async deactivateTimeTrigger(triggerId) {
        const jobId = this.scheduledJobs.get(triggerId);
        if (jobId) {
            clearTimeout(jobId);
            this.scheduledJobs.delete(triggerId);
        }
    }

    /**
     * Parse cron schedule
     * @private
     */
    parseCron(schedule) {
        // Simple cron parser: "0 0 * * * *" -> every minute
        const parts = schedule.split(' ');
        return {
            minute: parts[0] || '*',
            hour: parts[1] || '*',
            dayOfMonth: parts[2] || '*',
            month: parts[3] || '*',
            dayOfWeek: parts[4] || '*'
        };
    }

    /**
     * Get next run time from cron pattern
     * @private
     */
    getNextRunTime(cronPattern) {
        const now = new Date();
        const next = new Date(now);

        // Set to next occurrence based on cron pattern
        if (cronPattern.minute !== '*') {
            next.setMinutes(parseInt(cronPattern.minute));
            if (next <= now) {
                next.setHours(next.getHours() + 1);
            }
        }

        if (cronPattern.hour !== '*') {
            next.setHours(parseInt(cronPattern.hour));
            if (next <= now) {
                next.setDate(next.getDate() + 1);
            }
        }

        return next;
    }

    // ==================== FILE TRIGGERS ====================

    /**
     * Activate file-based trigger
     * @private
     */
    async activateFileTrigger(triggerId, trigger) {
        const { path: watchPath, events, action } = trigger.config;

        console.log(`[Trigger] File trigger watching: ${watchPath}`);

        const watcher = chokidar.watch(watchPath, {
            persistent: true,
            ignoreInitial: true
        });

        // Handle file events
        events.forEach(event => {
            watcher.on(event, async (filePath) => {
                console.log(`[Trigger] File event: ${event} - ${filePath}`);

                await this.executeTriggerAction(triggerId, {
                    ...action,
                    context: { event, filePath }
                });

                this.updateTriggerLastTriggered(triggerId);
            });
        });

        this.watchers.set(triggerId, watcher);
    }

    /**
     * Deactivate file-based trigger
     * @private
     */
    async deactivateFileTrigger(triggerId) {
        const watcher = this.watchers.get(triggerId);
        if (watcher) {
            await watcher.close();
            this.watchers.delete(triggerId);
        }
    }

    // ==================== HOTKEY TRIGGERS ====================

    /**
     * Activate hotkey trigger
     * @private
     */
    activateHotkeyTrigger(triggerId, trigger) {
        const { hotkey, action } = trigger.config;

        console.log(`[Trigger] Hotkey registered: ${hotkey}`);

        // Register hotkey (simplified - would use electron-localshortcut)
        this.hotkeys.set(triggerId, {
            hotkey,
            action,
            triggerId
        });

        this.emit('hotkey:registered', { triggerId, hotkey });
    }

    /**
     * Deactivate hotkey trigger
     * @private
     */
    deactivateHotkeyTrigger(triggerId) {
        const hotkeyConfig = this.hotkeys.get(triggerId);
        if (hotkeyConfig) {
            // Unregister hotkey
            this.hotkeys.delete(triggerId);
            console.log(`[Trigger] Hotkey unregistered: ${hotkeyConfig.hotkey}`);
        }
    }

    // ==================== WEBHOOK TRIGGERS ====================

    /**
     * Activate webhook trigger
     * @private
     */
    async activateWebhookTrigger(triggerId, trigger) {
        const { port, path, method, action } = trigger.config;

        console.log(`[Trigger] Webhook server starting on port ${port}`);

        // Create webhook server
        this.webhookServer = http.createServer(async (req, res) => {
            if (req.method === method && req.url === path) {
                console.log(`[Trigger] Webhook received: ${req.method} ${req.url}`);

                let body = '';
                req.on('data', chunk => { body += chunk; });
                req.on('end', async () => {
                    try {
                        const data = body ? JSON.parse(body) : {};

                        await this.executeTriggerAction(triggerId, {
                            ...action,
                            context: { method, path, data }
                        });

                        this.updateTriggerLastTriggered(triggerId);

                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true }));
                    } catch (error) {
                        console.error('[Trigger] Webhook error:', error);
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, error: error.message }));
                    }
                });
            } else {
                res.writeHead(404);
                res.end(JSON.stringify({ error: 'Not found' }));
            }
        });

        this.webhookServer.listen(port, () => {
            console.log(`[Trigger] Webhook server listening on port ${port}`);
            this.emit('webhook:started', { triggerId, port });
        });
    }

    /**
     * Deactivate webhook trigger
     * @private
     */
    async deactivateWebhookTrigger(triggerId) {
        if (this.webhookServer) {
            this.webhookServer.close();
            this.webhookServer = null;
            console.log('[Trigger] Webhook server stopped');
        }
    }

    // ==================== WINDOW TRIGGERS ====================

    /**
     * Activate window-based trigger
     * @private
     */
    async activateWindowTrigger(triggerId, trigger) {
        const { windowName, event, action } = trigger.config;

        console.log(`[Trigger] Window trigger watching: ${windowName}`);

        // Would use window controller to watch for window events
        // This is a placeholder - actual implementation would integrate with window controller
        this.emit('window:trigger:registered', { triggerId, windowName, event });
    }

    /**
     * Deactivate window-based trigger
     * @private
     */
    async deactivateWindowTrigger(triggerId) {
        console.log(`[Trigger] Window trigger deactivated`);
        this.emit('window:trigger:unregistered', { triggerId });
    }

    // ==================== EMAIL TRIGGERS ====================

    /**
     * Activate email-based trigger
     * @private
     */
    async activateEmailTrigger(triggerId, trigger) {
        const { email, subject, contains, action } = trigger.config;

        console.log(`[Trigger] Email trigger watching: ${email}`);

        // Would use email connector to watch for new emails
        // This is a placeholder - actual implementation would integrate with email connector
        this.emit('email:trigger:registered', { triggerId, email, subject, contains });
    }

    /**
     * Deactivate email-based trigger
     * @private
     */
    async deactivateEmailTrigger(triggerId) {
        console.log(`[Trigger] Email trigger deactivated`);
        this.emit('email:trigger:unregistered', { triggerId });
    }

    // ==================== CLIPBOARD TRIGGERS ====================

    /**
     * Activate clipboard-based trigger
     * @private
     */
    async activateClipboardTrigger(triggerId, trigger) {
        const { contains, action } = trigger.config;

        console.log(`[Trigger] Clipboard trigger watching for: ${contains}`);

        // Would use clipboard controller to watch for changes
        // This is a placeholder - actual implementation would integrate with clipboard controller
        this.emit('clipboard:trigger:registered', { triggerId, contains });
    }

    /**
     * Deactivate clipboard-based trigger
     * @private
     */
    async deactivateClipboardTrigger(triggerId) {
        console.log(`[Trigger] Clipboard trigger deactivated`);
        this.emit('clipboard:trigger:unregistered', { triggerId });
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Execute trigger action
     * @private
     */
    async executeTriggerAction(triggerId, action) {
        console.log(`[Trigger] Executing action for trigger: ${triggerId}`);

        // Emit action execution event
        this.emit('trigger:action', {
            triggerId,
            action,
            timestamp: new Date().toISOString()
        });

        // Would integrate with action executor
        // const result = await actionExecutor.execute(action);
    }

    /**
     * Update trigger last triggered time
     * @private
     */
    updateTriggerLastTriggered(triggerId) {
        const trigger = this.triggers.get(triggerId);
        if (trigger) {
            trigger.lastTriggered = new Date().toISOString();
            trigger.triggerCount++;
            this.triggers.set(triggerId, trigger);
        }
    }

    /**
     * Get trigger statistics
     * @param {string} triggerId - Trigger ID
     * @returns {Object} Trigger statistics
     */
    getTriggerStats(triggerId) {
        const trigger = this.triggers.get(triggerId);
        if (!trigger) {
            return null;
        }

        return {
            id: trigger.id,
            type: trigger.type,
            enabled: trigger.enabled,
            createdAt: trigger.createdAt,
            lastTriggered: trigger.lastTriggered,
            triggerCount: trigger.triggerCount,
            isActive: this.activeTriggers.has(triggerId)
        };
    }

    /**
     * Get all trigger statistics
     * @returns {Array} Array of trigger statistics
     */
    getAllTriggerStats() {
        return Array.from(this.triggers.values()).map(trigger => ({
            id: trigger.id,
            type: trigger.type,
            enabled: trigger.enabled,
            createdAt: trigger.createdAt,
            lastTriggered: trigger.lastTriggered,
            triggerCount: trigger.triggerCount,
            isActive: this.activeTriggers.has(trigger.id)
        }));
    }

    /**
     * Enable trigger
     * @param {string} triggerId - Trigger ID
     */
    async enableTrigger(triggerId) {
        await this.updateTrigger(triggerId, { enabled: true });
    }

    /**
     * Disable trigger
     * @param {string} triggerId - Trigger ID
     */
    async disableTrigger(triggerId) {
        await this.updateTrigger(triggerId, { enabled: false });
    }

    /**
     * Cleanup all triggers
     */
    async cleanup() {
        console.log('[Trigger] Cleaning up all triggers');

        // Deactivate all active triggers
        for (const triggerId of this.activeTriggers) {
            await this.deactivateTrigger(triggerId);
        }

        // Clear all data
        this.triggers.clear();
        this.activeTriggers.clear();
        this.watchers.clear();
        this.hotkeys.clear();
        this.scheduledJobs.clear();

        // Close webhook server
        if (this.webhookServer) {
            this.webhookServer.close();
            this.webhookServer = null;
        }

        console.log('[Trigger] Cleanup complete');
    }
}

// Export singleton instance
const triggerManager = new TriggerManager();
module.exports = triggerManager;
