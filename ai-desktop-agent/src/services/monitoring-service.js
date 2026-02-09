const { EventEmitter } = require('events');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

/**
 * Monitoring & Analytics Service - Smart monitoring and notifications
 * Features: Website monitoring, price tracking, system monitoring, notifications
 */
class MonitoringService extends EventEmitter {
    constructor() {
        super();
        this.monitors = new Map(); // Active monitors
        this.alerts = new Map(); // Alert history
        this.notifications = new Map(); // Notification queue
        this.checkInterval = 60000; // Default check interval (1 minute)
        this.checkTimer = null;
        this.notificationChannels = new Map(); // Notification channels
        this.isRunning = false;
    }

    /**
     * Initialize monitoring service
     * @param {Object} config - Configuration
     */
    async initialize(config = {}) {
        try {
            this.checkInterval = config.checkInterval || 60000;

            // Load saved monitors
            await this.loadMonitors();

            // Load notification channels
            await this.loadNotificationChannels();

            console.log('[Monitoring] Monitoring Service initialized');
            return { success: true };
        } catch (error) {
            console.error('[Monitoring] Initialization error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Start monitoring
     */
    async start() {
        if (this.isRunning) {
            console.log('[Monitoring] Already running');
            return { success: true };
        }

        console.log('[Monitoring] Starting monitoring service');
        this.isRunning = true;

        // Start periodic checks
        this.checkTimer = setInterval(() => {
            this.runChecks();
        }, this.checkInterval);

        // Run initial check
        await this.runChecks();

        return { success: true };
    }

    /**
     * Stop monitoring
     */
    async stop() {
        if (!this.isRunning) {
            console.log('[Monitoring] Already stopped');
            return { success: true };
        }

        console.log('[Monitoring] Stopping monitoring service');
        this.isRunning = false;

        if (this.checkTimer) {
            clearInterval(this.checkTimer);
            this.checkTimer = null;
        }

        return { success: true };
    }

    /**
     * Run all monitor checks
     * @private
     */
    async runChecks() {
        console.log('[Monitoring] Running checks...');

        const monitors = Array.from(this.monitors.values()).filter(m => m.enabled);

        for (const monitor of monitors) {
            try {
                await this.checkMonitor(monitor);
            } catch (error) {
                console.error(`[Monitoring] Check failed for ${monitor.id}:`, error);
            }
        }
    }

    /**
     * Check individual monitor
     * @private
     */
    async checkMonitor(monitor) {
        console.log(`[Monitoring] Checking: ${monitor.name} (${monitor.type})`);

        let result;
        let triggered = false;

        switch (monitor.type) {
            case 'website':
                result = await this.checkWebsite(monitor);
                triggered = result.triggered;
                break;
            case 'price':
                result = await this.checkPrice(monitor);
                triggered = result.triggered;
                break;
            case 'file':
                result = await this.checkFile(monitor);
                triggered = result.triggered;
                break;
            case 'system':
                result = await this.checkSystem(monitor);
                triggered = result.triggered;
                break;
            case 'api':
                result = await this.checkAPI(monitor);
                triggered = result.triggered;
                break;
            case 'social':
                result = await this.checkSocial(monitor);
                triggered = result.triggered;
                break;
            default:
                console.log(`[Monitoring] Unknown monitor type: ${monitor.type}`);
                return;
        }

        // Update monitor state
        monitor.lastCheck = new Date().toISOString();
        monitor.lastResult = result;

        // Trigger alert if condition met
        if (triggered) {
            await this.triggerAlert(monitor, result);
        }

        // Save monitor state
        await this.saveMonitors();
    }

    // ==================== WEBSITE MONITORING ====================

    /**
     * Check website uptime
     * @private
     */
    async checkWebsite(monitor) {
        try {
            const startTime = Date.now();
            const response = await axios.get(monitor.url, {
                timeout: monitor.timeout || 30000,
                validateStatus: () => true
            });
            const responseTime = Date.now() - startTime;

            const isUp = response.status >= 200 && response.status < 400;
            const isSlow = responseTime > (monitor.slowThreshold || 5000);

            let triggered = false;
            let message = '';

            if (!isUp && monitor.alertOnDown !== false) {
                triggered = true;
                message = `Website ${monitor.url} is down (Status: ${response.status})`;
            } else if (isSlow && monitor.alertOnSlow) {
                triggered = true;
                message = `Website ${monitor.url} is slow (${responseTime}ms)`;
            }

            return {
                triggered,
                message,
                status: response.status,
                responseTime,
                isUp,
                isSlow
            };
        } catch (error) {
            return {
                triggered: monitor.alertOnDown !== false,
                message: `Website ${monitor.url} check failed: ${error.message}`,
                error: error.message
            };
        }
    }

    /**
     * Add website monitor
     * @param {Object} config - Monitor configuration
     * @returns {string} Monitor ID
     */
    addWebsiteMonitor(config) {
        const monitorId = `website_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const monitor = {
            id: monitorId,
            type: 'website',
            name: config.name || `Website Monitor ${monitorId}`,
            url: config.url,
            enabled: config.enabled !== false,
            alertOnDown: config.alertOnDown !== false,
            alertOnSlow: config.alertOnSlow || false,
            slowThreshold: config.slowThreshold || 5000,
            timeout: config.timeout || 30000,
            notificationChannels: config.notificationChannels || [],
            createdAt: new Date().toISOString(),
            lastCheck: null,
            lastResult: null
        };

        this.monitors.set(monitorId, monitor);
        console.log(`[Monitoring] Website monitor added: ${monitorId}`);

        return monitorId;
    }

    // ==================== PRICE TRACKING ====================

    /**
     * Check price
     * @private
     */
    async checkPrice(monitor) {
        try {
            const response = await axios.get(monitor.url, {
                timeout: monitor.timeout || 30000
            });

            // Extract price using CSS selector or regex
            let currentPrice;
            if (monitor.cssSelector) {
                // Would need cheerio or similar for CSS selector
                // For now, use regex
                const match = response.data.match(monitor.priceRegex || /\$[\d,]+\.?\d*/);
                currentPrice = match ? parseFloat(match[0].replace(/[$,]/g, '')) : null;
            } else {
                const match = response.data.match(monitor.priceRegex || /\$[\d,]+\.?\d*/);
                currentPrice = match ? parseFloat(match[0].replace(/[$,]/g, '')) : null;
            }

            if (!currentPrice) {
                return {
                    triggered: false,
                    message: 'Could not extract price',
                    currentPrice: null
                };
            }

            const previousPrice = monitor.lastResult?.currentPrice || monitor.initialPrice;
            const priceChange = previousPrice ? currentPrice - previousPrice : 0;
            const priceChangePercent = previousPrice ? ((currentPrice - previousPrice) / previousPrice) * 100 : 0;

            let triggered = false;
            let message = '';

            // Check for price drop
            if (monitor.alertOnDrop && priceChange < 0) {
                if (monitor.dropThreshold && Math.abs(priceChangePercent) >= monitor.dropThreshold) {
                    triggered = true;
                    message = `Price dropped by ${Math.abs(priceChangePercent).toFixed(2)}%: $${currentPrice.toFixed(2)}`;
                }
            }

            // Check for price increase
            if (monitor.alertOnIncrease && priceChange > 0) {
                if (monitor.increaseThreshold && priceChangePercent >= monitor.increaseThreshold) {
                    triggered = true;
                    message = `Price increased by ${priceChangePercent.toFixed(2)}%: $${currentPrice.toFixed(2)}`;
                }
            }

            // Check for target price
            if (monitor.targetPrice) {
                if (currentPrice <= monitor.targetPrice) {
                    triggered = true;
                    message = `Target price reached: $${currentPrice.toFixed(2)} (Target: $${monitor.targetPrice.toFixed(2)})`;
                }
            }

            return {
                triggered,
                message,
                currentPrice,
                previousPrice,
                priceChange,
                priceChangePercent
            };
        } catch (error) {
            return {
                triggered: false,
                message: `Price check failed: ${error.message}`,
                error: error.message
            };
        }
    }

    /**
     * Add price monitor
     * @param {Object} config - Monitor configuration
     * @returns {string} Monitor ID
     */
    addPriceMonitor(config) {
        const monitorId = `price_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const monitor = {
            id: monitorId,
            type: 'price',
            name: config.name || `Price Monitor ${monitorId}`,
            url: config.url,
            enabled: config.enabled !== false,
            priceRegex: config.priceRegex,
            cssSelector: config.cssSelector,
            initialPrice: config.initialPrice,
            targetPrice: config.targetPrice,
            alertOnDrop: config.alertOnDrop || true,
            alertOnIncrease: config.alertOnIncrease || false,
            dropThreshold: config.dropThreshold,
            increaseThreshold: config.increaseThreshold,
            timeout: config.timeout || 30000,
            notificationChannels: config.notificationChannels || [],
            createdAt: new Date().toISOString(),
            lastCheck: null,
            lastResult: null
        };

        this.monitors.set(monitorId, monitor);
        console.log(`[Monitoring] Price monitor added: ${monitorId}`);

        return monitorId;
    }

    // ==================== FILE MONITORING ====================

    /**
     * Check file changes
     * @private
     */
    async checkFile(monitor) {
        try {
            const stats = await fs.stat(monitor.filepath);

            const previousStats = monitor.lastResult?.stats;
            let triggered = false;
            let message = '';

            if (previousStats) {
                // Check for modifications
                if (stats.mtime > previousStats.mtime) {
                    triggered = true;
                    message = `File modified: ${monitor.filepath}`;
                }

                // Check for size changes
                if (stats.size !== previousStats.size) {
                    triggered = true;
                    message = `File size changed: ${monitor.filepath} (${previousStats.size} -> ${stats.size} bytes)`;
                }
            } else {
                // First check
                triggered = monitor.alertOnFirstCheck || false;
                if (triggered) {
                    message = `File detected: ${monitor.filepath}`;
                }
            }

            return {
                triggered,
                message,
                stats: {
                    size: stats.size,
                    mtime: stats.mtime,
                    atime: stats.atime,
                    ctime: stats.ctime
                }
            };
        } catch (error) {
            if (error.code === 'ENOENT') {
                // File doesn't exist
                if (monitor.alertOnDelete) {
                    return {
                        triggered: true,
                        message: `File deleted: ${monitor.filepath}`,
                        exists: false
                    };
                }
                return {
                    triggered: false,
                    message: 'File does not exist',
                    exists: false
                };
            }
            return {
                triggered: false,
                message: `File check failed: ${error.message}`,
                error: error.message
            };
        }
    }

    /**
     * Add file monitor
     * @param {Object} config - Monitor configuration
     * @returns {string} Monitor ID
     */
    addFileMonitor(config) {
        const monitorId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const monitor = {
            id: monitorId,
            type: 'file',
            name: config.name || `File Monitor ${monitorId}`,
            filepath: config.filepath,
            enabled: config.enabled !== false,
            alertOnFirstCheck: config.alertOnFirstCheck || false,
            alertOnDelete: config.alertOnDelete || true,
            notificationChannels: config.notificationChannels || [],
            createdAt: new Date().toISOString(),
            lastCheck: null,
            lastResult: null
        };

        this.monitors.set(monitorId, monitor);
        console.log(`[Monitoring] File monitor added: ${monitorId}`);

        return monitorId;
    }

    // ==================== SYSTEM MONITORING ====================

    /**
     * Check system metrics
     * @private
     */
    async checkSystem(monitor) {
        try {
            const os = require('os');
            const cpus = os.cpus();

            // CPU usage
            const cpuUsage = os.loadavg()[0] / cpus.length * 100;

            // Memory usage
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const usedMem = totalMem - freeMem;
            const memUsage = (usedMem / totalMem) * 100;

            // Disk usage (simplified)
            const diskUsage = 0; // Would need additional library

            let triggered = false;
            let message = '';

            // Check CPU threshold
            if (monitor.cpuThreshold && cpuUsage >= monitor.cpuThreshold) {
                triggered = true;
                message = `CPU usage high: ${cpuUsage.toFixed(2)}%`;
            }

            // Check memory threshold
            if (monitor.memThreshold && memUsage >= monitor.memThreshold) {
                triggered = true;
                message = `Memory usage high: ${memUsage.toFixed(2)}%`;
            }

            return {
                triggered,
                message,
                cpuUsage,
                memUsage,
                diskUsage,
                totalMem,
                usedMem,
                freeMem
            };
        } catch (error) {
            return {
                triggered: false,
                message: `System check failed: ${error.message}`,
                error: error.message
            };
        }
    }

    /**
     * Add system monitor
     * @param {Object} config - Monitor configuration
     * @returns {string} Monitor ID
     */
    addSystemMonitor(config) {
        const monitorId = `system_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const monitor = {
            id: monitorId,
            type: 'system',
            name: config.name || `System Monitor ${monitorId}`,
            enabled: config.enabled !== false,
            cpuThreshold: config.cpuThreshold,
            memThreshold: config.memThreshold,
            diskThreshold: config.diskThreshold,
            notificationChannels: config.notificationChannels || [],
            createdAt: new Date().toISOString(),
            lastCheck: null,
            lastResult: null
        };

        this.monitors.set(monitorId, monitor);
        console.log(`[Monitoring] System monitor added: ${monitorId}`);

        return monitorId;
    }

    // ==================== API MONITORING ====================

    /**
     * Check API endpoint
     * @private
     */
    async checkAPI(monitor) {
        try {
            const startTime = Date.now();
            const response = await axios({
                method: monitor.method || 'GET',
                url: monitor.url,
                headers: monitor.headers || {},
                data: monitor.body,
                timeout: monitor.timeout || 30000,
                validateStatus: () => true
            });
            const responseTime = Date.now() - startTime;

            let triggered = false;
            let message = '';

            // Check status code
            if (monitor.expectedStatus && response.status !== monitor.expectedStatus) {
                triggered = true;
                message = `API returned unexpected status: ${response.status} (expected: ${monitor.expectedStatus})`;
            }

            // Check response time
            if (monitor.maxResponseTime && responseTime > monitor.maxResponseTime) {
                triggered = true;
                message = `API response slow: ${responseTime}ms (max: ${monitor.maxResponseTime}ms)`;
            }

            // Check response body
            if (monitor.expectedResponse) {
                const responseStr = JSON.stringify(response.data);
                if (!responseStr.includes(monitor.expectedResponse)) {
                    triggered = true;
                    message = `API response does not contain expected content`;
                }
            }

            return {
                triggered,
                message,
                status: response.status,
                responseTime,
                data: response.data
            };
        } catch (error) {
            return {
                triggered: true,
                message: `API check failed: ${error.message}`,
                error: error.message
            };
        }
    }

    /**
     * Add API monitor
     * @param {Object} config - Monitor configuration
     * @returns {string} Monitor ID
     */
    addAPIMonitor(config) {
        const monitorId = `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const monitor = {
            id: monitorId,
            type: 'api',
            name: config.name || `API Monitor ${monitorId}`,
            url: config.url,
            method: config.method || 'GET',
            headers: config.headers || {},
            body: config.body,
            enabled: config.enabled !== false,
            expectedStatus: config.expectedStatus || 200,
            maxResponseTime: config.maxResponseTime,
            expectedResponse: config.expectedResponse,
            timeout: config.timeout || 30000,
            notificationChannels: config.notificationChannels || [],
            createdAt: new Date().toISOString(),
            lastCheck: null,
            lastResult: null
        };

        this.monitors.set(monitorId, monitor);
        console.log(`[Monitoring] API monitor added: ${monitorId}`);

        return monitorId;
    }

    // ==================== SOCIAL MEDIA MONITORING ====================

    /**
     * Check social media mentions
     * @private
     */
    async checkSocial(monitor) {
        try {
            // Placeholder for social media monitoring
            // Would need specific API integrations for Twitter, Reddit, etc.

            return {
                triggered: false,
                message: 'Social media monitoring requires API integration',
                mentions: []
            };
        } catch (error) {
            return {
                triggered: false,
                message: `Social check failed: ${error.message}`,
                error: error.message
            };
        }
    }

    /**
     * Add social media monitor
     * @param {Object} config - Monitor configuration
     * @returns {string} Monitor ID
     */
    addSocialMonitor(config) {
        const monitorId = `social_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const monitor = {
            id: monitorId,
            type: 'social',
            name: config.name || `Social Monitor ${monitorId}`,
            platform: config.platform, // twitter, reddit, etc.
            keywords: config.keywords || [],
            enabled: config.enabled !== false,
            notificationChannels: config.notificationChannels || [],
            createdAt: new Date().toISOString(),
            lastCheck: null,
            lastResult: null
        };

        this.monitors.set(monitorId, monitor);
        console.log(`[Monitoring] Social monitor added: ${monitorId}`);

        return monitorId;
    }

    // ==================== ALERTS & NOTIFICATIONS ====================

    /**
     * Trigger alert
     * @private
     */
    async triggerAlert(monitor, result) {
        const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const alert = {
            id: alertId,
            monitorId: monitor.id,
            monitorName: monitor.name,
            monitorType: monitor.type,
            message: result.message,
            triggeredAt: new Date().toISOString(),
            result: result,
            sent: false
        };

        this.alerts.set(alertId, alert);

        console.log(`[Monitoring] Alert triggered: ${alertId} - ${result.message}`);

        // Send notifications
        await this.sendNotifications(monitor, alert);

        // Emit event
        this.emit('alert', alert);

        // Save alerts
        await this.saveAlerts();
    }

    /**
     * Send notifications
     * @private
     */
    async sendNotifications(monitor, alert) {
        const channels = monitor.notificationChannels || [];

        for (const channelId of channels) {
            const channel = this.notificationChannels.get(channelId);
            if (!channel || !channel.enabled) {
                continue;
            }

            try {
                await this.sendNotification(channel, alert);
                console.log(`[Monitoring] Notification sent via ${channel.type}`);
            } catch (error) {
                console.error(`[Monitoring] Notification failed via ${channel.type}:`, error);
            }
        }
    }

    /**
     * Send notification via channel
     * @private
     */
    async sendNotification(channel, alert) {
        const message = this.formatNotificationMessage(alert);

        switch (channel.type) {
            case 'desktop':
                await this.sendDesktopNotification(message);
                break;
            case 'email':
                await this.sendEmailNotification(channel, message);
                break;
            case 'slack':
                await this.sendSlackNotification(channel, message);
                break;
            case 'webhook':
                await this.sendWebhookNotification(channel, alert);
                break;
            case 'telegram':
                await this.sendTelegramNotification(channel, message);
                break;
            default:
                console.log(`[Monitoring] Unknown notification type: ${channel.type}`);
        }
    }

    /**
     * Format notification message
     * @private
     */
    formatNotificationMessage(alert) {
        return `🚨 Alert: ${alert.monitorName}\n\n${alert.message}\n\nTriggered at: ${new Date(alert.triggeredAt).toLocaleString()}`;
    }

    /**
     * Send desktop notification
     * @private
     */
    async sendDesktopNotification(message) {
        const { Notification } = require('electron');

        new Notification({
            title: 'AI Desktop Agent Alert',
            body: message,
            icon: path.join(__dirname, '../../assets/phoenix-icon.png')
        }).show();
    }

    /**
     * Send email notification
     * @private
     */
    async sendEmailNotification(channel, message) {
        // Would use email service
        console.log(`[Monitoring] Email notification to ${channel.to}: ${message}`);
    }

    /**
     * Send Slack notification
     * @private
     */
    async sendSlackNotification(channel, message) {
        try {
            await axios.post(channel.webhookUrl, {
                text: message
            });
        } catch (error) {
            console.error('[Monitoring] Slack notification error:', error);
        }
    }

    /**
     * Send webhook notification
     * @private
     */
    async sendWebhookNotification(channel, alert) {
        try {
            await axios.post(channel.url, alert, {
                headers: channel.headers || {}
            });
        } catch (error) {
            console.error('[Monitoring] Webhook notification error:', error);
        }
    }

    /**
     * Send Telegram notification
     * @private
     */
    async sendTelegramNotification(channel, message) {
        try {
            await axios.post(`https://api.telegram.org/bot${channel.botToken}/sendMessage`, {
                chat_id: channel.chatId,
                text: message
            });
        } catch (error) {
            console.error('[Monitoring] Telegram notification error:', error);
        }
    }

    // ==================== NOTIFICATION CHANNELS ====================

    /**
     * Add notification channel
     * @param {Object} channel - Channel configuration
     * @returns {string} Channel ID
     */
    addNotificationChannel(channel) {
        const channelId = `channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const channelConfig = {
            id: channelId,
            type: channel.type,
            name: channel.name || `${channel.type} Channel`,
            enabled: channel.enabled !== false,
            config: channel.config || {},
            createdAt: new Date().toISOString()
        };

        this.notificationChannels.set(channelId, channelConfig);
        console.log(`[Monitoring] Notification channel added: ${channelId}`);

        return channelId;
    }

    /**
     * Get notification channels
     * @returns {Array} Channels array
     */
    getNotificationChannels() {
        return Array.from(this.notificationChannels.values());
    }

    /**
     * Delete notification channel
     * @param {string} channelId - Channel ID
     */
    deleteNotificationChannel(channelId) {
        this.notificationChannels.delete(channelId);
        console.log(`[Monitoring] Notification channel deleted: ${channelId}`);
    }

    // ==================== MONITOR MANAGEMENT ====================

    /**
     * Get all monitors
     * @param {string} type - Optional type filter
     * @returns {Array} Monitors array
     */
    getMonitors(type = null) {
        const monitors = Array.from(this.monitors.values());

        if (type) {
            return monitors.filter(m => m.type === type);
        }

        return monitors;
    }

    /**
     * Get monitor by ID
     * @param {string} monitorId - Monitor ID
     * @returns {Object|null} Monitor or null
     */
    getMonitor(monitorId) {
        return this.monitors.get(monitorId) || null;
    }

    /**
     * Enable monitor
     * @param {string} monitorId - Monitor ID
     */
    enableMonitor(monitorId) {
        const monitor = this.monitors.get(monitorId);
        if (monitor) {
            monitor.enabled = true;
            console.log(`[Monitoring] Monitor enabled: ${monitorId}`);
        }
    }

    /**
     * Disable monitor
     * @param {string} monitorId - Monitor ID
     */
    disableMonitor(monitorId) {
        const monitor = this.monitors.get(monitorId);
        if (monitor) {
            monitor.enabled = false;
            console.log(`[Monitoring] Monitor disabled: ${monitorId}`);
        }
    }

    /**
     * Delete monitor
     * @param {string} monitorId - Monitor ID
     */
    deleteMonitor(monitorId) {
        this.monitors.delete(monitorId);
        console.log(`[Monitoring] Monitor deleted: ${monitorId}`);
    }

    /**
     * Get alerts
     * @param {number} limit - Limit number of alerts
     * @returns {Array} Alerts array
     */
    getAlerts(limit = 100) {
        return Array.from(this.alerts.values())
            .sort((a, b) => new Date(b.triggeredAt) - new Date(a.triggeredAt))
            .slice(0, limit);
    }

    /**
     * Get alerts by monitor
     * @param {string} monitorId - Monitor ID
     * @returns {Array} Alerts array
     */
    getAlertsByMonitor(monitorId) {
        return Array.from(this.alerts.values())
            .filter(a => a.monitorId === monitorId)
            .sort((a, b) => new Date(b.triggeredAt) - new Date(a.triggeredAt));
    }

    /**
     * Clear alerts
     */
    clearAlerts() {
        this.alerts.clear();
        console.log('[Monitoring] Alerts cleared');
    }

    // ==================== PERSISTENCE ====================

    /**
     * Save monitors to file
     * @private
     */
    async saveMonitors() {
        try {
            const data = JSON.stringify(Array.from(this.monitors.entries()), null, 2);
            await fs.writeFile(
                path.join(__dirname, '../../data/monitors.json'),
                data,
                'utf-8'
            );
        } catch (error) {
            console.error('[Monitoring] Save monitors error:', error);
        }
    }

    /**
     * Load monitors from file
     * @private
     */
    async loadMonitors() {
        try {
            const data = await fs.readFile(
                path.join(__dirname, '../../data/monitors.json'),
                'utf-8'
            );
            const entries = JSON.parse(data);
            this.monitors = new Map(entries);
            console.log(`[Monitoring] Loaded ${this.monitors.size} monitors`);
        } catch (error) {
            console.log('[Monitoring] No saved monitors found');
        }
    }

    /**
     * Save alerts to file
     * @private
     */
    async saveAlerts() {
        try {
            const data = JSON.stringify(Array.from(this.alerts.entries()), null, 2);
            await fs.writeFile(
                path.join(__dirname, '../../data/alerts.json'),
                data,
                'utf-8'
            );
        } catch (error) {
            console.error('[Monitoring] Save alerts error:', error);
        }
    }

    /**
     * Load alerts from file
     * @private
     */
    async loadAlerts() {
        try {
            const data = await fs.readFile(
                path.join(__dirname, '../../data/alerts.json'),
                'utf-8'
            );
            const entries = JSON.parse(data);
            this.alerts = new Map(entries);
            console.log(`[Monitoring] Loaded ${this.alerts.size} alerts`);
        } catch (error) {
            console.log('[Monitoring] No saved alerts found');
        }
    }

    /**
     * Save notification channels to file
     * @private
     */
    async saveNotificationChannels() {
        try {
            const data = JSON.stringify(Array.from(this.notificationChannels.entries()), null, 2);
            await fs.writeFile(
                path.join(__dirname, '../../data/notification-channels.json'),
                data,
                'utf-8'
            );
        } catch (error) {
            console.error('[Monitoring] Save notification channels error:', error);
        }
    }

    /**
     * Load notification channels from file
     * @private
     */
    async loadNotificationChannels() {
        try {
            const data = await fs.readFile(
                path.join(__dirname, '../../data/notification-channels.json'),
                'utf-8'
            );
            const entries = JSON.parse(data);
            this.notificationChannels = new Map(entries);
            console.log(`[Monitoring] Loaded ${this.notificationChannels.size} notification channels`);
        } catch (error) {
            console.log('[Monitoring] No saved notification channels found');
        }
    }

    /**
     * Cleanup
     */
    async cleanup() {
        console.log('[Monitoring] Cleaning up');

        // Stop monitoring
        await this.stop();

        // Save state
        await this.saveMonitors();
        await this.saveAlerts();
        await this.saveNotificationChannels();

        // Clear caches
        this.monitors.clear();
        this.alerts.clear();
        this.notifications.clear();
        this.notificationChannels.clear();
    }
}

// Export singleton instance
const monitoringService = new MonitoringService();
module.exports = monitoringService;
