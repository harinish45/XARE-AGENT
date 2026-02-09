const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');

/**
 * Focus Mode Service - Distraction blocking
 * Features: Website blocking, app blocking, focus timer, whitelist management
 */
class FocusModeService extends EventEmitter {
    constructor() {
        super();
        this.isFocusMode = false;
        this.focusSessions = new Map(); // Focus sessions
        this.currentSession = null;
        this.blockedWebsites = new Map(); // Blocked websites
        this.blockedApps = new Map(); // Blocked applications
        this.whitelistedSites = new Map(); // Whitelisted websites
        this.whitelistedApps = new Map(); // Whitelisted applications
        this.focusTimer = null;
        this.focusDuration = 0;
        this.focusRemaining = 0;
        this.dataPath = path.join(__dirname, '../../data/focus-mode.json');
        this.defaultBlockMessage = 'This site is blocked during focus mode';
    }

    /**
     * Initialize focus mode service
     * @param {Object} config - Configuration
     */
    async initialize(config = {}) {
        try {
            this.defaultBlockMessage = config.defaultBlockMessage || 'This site is blocked during focus mode';

            // Load existing data
            await this.loadBlockedWebsites();
            await this.loadBlockedApps();
            await this.loadWhitelistedSites();
            await this.loadWhitelistedApps();
            await this.loadFocusSessions();

            console.log('[FocusMode] Focus Mode Service initialized');
            return { success: true };
        } catch (error) {
            console.error('[FocusMode] Initialization error:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== FOCUS MODE ====================

    /**
     * Start focus mode
     * @param {Object} options - Focus mode options
     * @returns {Promise<Object>} Start result
     */
    async startFocusMode(options = {}) {
        try {
            if (this.isFocusMode) {
                return {
                    success: false,
                    error: 'Focus mode already active'
                };
            }

            console.log('[FocusMode] Starting focus mode...');

            const sessionId = `focus_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            this.currentSession = {
                id: sessionId,
                name: options.name || 'Focus Session',
                task: options.task || '',
                duration: options.duration || 25 * 60 * 1000, // Default 25 minutes
                startTime: new Date().toISOString(),
                endTime: null,
                blockedSites: [],
                blockedApps: [],
                interruptions: [],
                completed: false,
                notes: options.notes || '',
                tags: options.tags || []
            };

            this.isFocusMode = true;
            this.focusDuration = this.currentSession.duration;
            this.focusRemaining = this.focusDuration;

            // Start focus timer
            this.startFocusTimer();

            console.log(`[FocusMode] Focus mode started: ${sessionId}`);

            // Emit event
            this.emit('focusModeStarted', this.currentSession);

            return { success: true, sessionId };
        } catch (error) {
            console.error('[FocusMode] Start focus mode error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Stop focus mode
     * @returns {Promise<Object>} Stop result
     */
    async stopFocusMode() {
        try {
            if (!this.isFocusMode) {
                return {
                    success: false,
                    error: 'Focus mode not active'
                };
            }

            console.log('[FocusMode] Stopping focus mode...');

            // Stop focus timer
            if (this.focusTimer) {
                clearInterval(this.focusTimer);
                this.focusTimer = null;
            }

            // Finalize session
            const endTime = new Date().toISOString();
            const actualDuration = Date.now() - new Date(this.currentSession.startTime).getTime();

            this.currentSession.endTime = endTime;
            this.currentSession.actualDuration = actualDuration;
            this.currentSession.completed = actualDuration >= this.focusDuration * 0.9; // 90% completion

            // Save session
            await this.saveFocusSession(this.currentSession);

            // Store in sessions map
            this.focusSessions.set(this.currentSession.id, this.currentSession);

            console.log(`[FocusMode] Focus mode stopped: ${this.currentSession.id}`);

            // Emit event
            this.emit('focusModeStopped', this.currentSession);

            // Reset state
            this.isFocusMode = false;
            this.currentSession = null;
            this.focusDuration = 0;
            this.focusRemaining = 0;

            return { success: true, session: this.currentSession };
        } catch (error) {
            console.error('[FocusMode] Stop focus mode error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Start focus timer
     * @private
     */
    startFocusTimer() {
        this.focusTimer = setInterval(() => {
            this.updateFocusTimer();
        }, 1000); // Update every second
    }

    /**
     * Update focus timer
     * @private
     */
    updateFocusTimer() {
        if (!this.currentSession) {
            return;
        }

        this.focusRemaining -= 1000;

        if (this.focusRemaining <= 0) {
            console.log('[FocusMode] Focus timer completed');
            this.stopFocusMode();
        }

        // Emit event
        this.emit('focusTimerUpdated', {
            remaining: this.focusRemaining,
            total: this.focusDuration,
            percentage: Math.round(((this.focusDuration - this.focusRemaining) / this.focusDuration) * 100)
        });
    }

    /**
     * Pause focus mode
     * @returns {Object} Pause result
     */
    pauseFocusMode() {
        if (!this.isFocusMode) {
            return {
                success: false,
                error: 'Focus mode not active'
            };
        }

        console.log('[FocusMode] Pausing focus mode...');

        // Stop focus timer
        if (this.focusTimer) {
            clearInterval(this.focusTimer);
            this.focusTimer = null;
        }

        // Emit event
        this.emit('focusModePaused', this.currentSession);

        return { success: true };
    }

    /**
     * Resume focus mode
     * @returns {Object} Resume result
     */
    resumeFocusMode() {
        if (!this.currentSession) {
            return {
                success: false,
                error: 'No focus session to resume'
            };
        }

        console.log('[FocusMode] Resuming focus mode...');

        // Resume focus timer
        this.startFocusTimer();

        // Emit event
        this.emit('focusModeResumed', this.currentSession);

        return { success: true };
    }

    /**
     * Log interruption
     * @param {Object} interruption - Interruption data
     * @returns {Object} Log result
     */
    logInterruption(interruption) {
        if (!this.isFocusMode || !this.currentSession) {
            return {
                success: false,
                error: 'Focus mode not active'
            };
        }

        const interruptionData = {
            id: `interruption_${Date.now()}`,
            timestamp: new Date().toISOString(),
            type: interruption.type || 'manual', // 'manual', 'website', 'app', 'notification'
            source: interruption.source || '',
            reason: interruption.reason || '',
            duration: interruption.duration || 0
        };

        this.currentSession.interruptions.push(interruptionData);

        console.log(`[FocusMode] Interruption logged: ${interruptionData.id}`);

        // Emit event
        this.emit('interruptionLogged', interruptionData);

        return { success: true };
    }

    // ==================== BLOCKING ====================

    /**
     * Block website
     * @param {string} url - Website URL
     * @param {Object} options - Block options
     * @returns {Promise<Object>} Block result
     */
    async blockWebsite(url, options = {}) {
        try {
            const domain = new URL(url).hostname;

            const blockData = {
                id: `site_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                url,
                domain,
                blockedAt: new Date().toISOString(),
                reason: options.reason || 'focus_mode',
                temporary: options.temporary || false,
                duration: options.duration || 0,
                message: options.message || this.defaultBlockMessage
            };

            this.blockedWebsites.set(blockData.id, blockData);

            console.log(`[FocusMode] Website blocked: ${domain}`);

            // Emit event
            this.emit('websiteBlocked', blockData);

            // Save blocked websites
            await this.saveBlockedWebsites();

            return { success: true, blockId: blockData.id };
        } catch (error) {
            console.error('[FocusMode] Block website error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Unblock website
     * @param {string} blockId - Block ID
     * @returns {Promise<Object>} Unblock result
     */
    async unblockWebsite(blockId) {
        try {
            const blockData = this.blockedWebsites.get(blockId);
            if (!blockData) {
                return {
                    success: false,
                    error: 'Block not found'
                };
            }

            this.blockedWebsites.delete(blockId);

            console.log(`[FocusMode] Website unblocked: ${blockData.domain}`);

            // Emit event
            this.emit('websiteUnblocked', blockData);

            // Save blocked websites
            await this.saveBlockedWebsites();

            return { success: true };
        } catch (error) {
            console.error('[FocusMode] Unblock website error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Block application
     * @param {string} appName - Application name
     * @param {Object} options - Block options
     * @returns {Promise<Object>} Block result
     */
    async blockApp(appName, options = {}) {
        try {
            const blockData = {
                id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: appName,
                blockedAt: new Date().toISOString(),
                reason: options.reason || 'focus_mode',
                temporary: options.temporary || false,
                duration: options.duration || 0,
                message: options.message || 'This application is blocked during focus mode'
            };

            this.blockedApps.set(blockData.id, blockData);

            console.log(`[FocusMode] Application blocked: ${appName}`);

            // Emit event
            this.emit('appBlocked', blockData);

            // Save blocked apps
            await this.saveBlockedApps();

            return { success: true, blockId: blockData.id };
        } catch (error) {
            console.error('[FocusMode] Block app error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Unblock application
     * @param {string} blockId - Block ID
     * @returns {Promise<Object>} Unblock result
     */
    async unblockApp(blockId) {
        try {
            const blockData = this.blockedApps.get(blockId);
            if (!blockData) {
                return {
                    success: false,
                    error: 'Block not found'
                };
            }

            this.blockedApps.delete(blockId);

            console.log(`[FocusMode] Application unblocked: ${blockData.name}`);

            // Emit event
            this.emit('appUnblocked', blockData);

            // Save blocked apps
            await this.saveBlockedApps();

            return { success: true };
        } catch (error) {
            console.error('[FocusMode] Unblock app error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Check if website is blocked
     * @param {string} url - Website URL
     * @returns {boolean} Blocked status
     */
    isWebsiteBlocked(url) {
        try {
            const domain = new URL(url).hostname;

            // Check if in blocked list
            const blocked = Array.from(this.blockedWebsites.values())
                .find(b => b.domain === domain && !b.temporary);

            if (blocked) {
                return true;
            }

            // Check if not in whitelist
            const whitelisted = Array.from(this.whitelistedSites.values())
                .find(w => w.domain === domain);

            return !whitelisted;
        } catch (error) {
            console.error('[FocusMode] Check website blocked error:', error);
            return false;
        }
    }

    /**
     * Check if app is blocked
     * @param {string} appName - Application name
     * @returns {boolean} Blocked status
     */
    isAppBlocked(appName) {
        // Check if in blocked list
        const blocked = Array.from(this.blockedApps.values())
            .find(b => b.name === appName && !b.temporary);

        if (blocked) {
            return true;
        }

        // Check if not in whitelist
        const whitelisted = Array.from(this.whitelistedApps.values())
            .find(w => w.name === appName);

        return !whitelisted;
    }

    // ==================== WHITELIST ====================

    /**
     * Add website to whitelist
     * @param {string} url - Website URL
     * @returns {Promise<Object>} Add result
     */
    async addWhitelistedSite(url) {
        try {
            const domain = new URL(url).hostname;

            const whitelistData = {
                id: `whitelist_site_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                url,
                domain,
                addedAt: new Date().toISOString(),
                reason: 'user_whitelist'
            };

            this.whitelistedSites.set(whitelistData.id, whitelistData);

            console.log(`[FocusMode] Website whitelisted: ${domain}`);

            // Emit event
            this.emit('siteWhitelisted', whitelistData);

            // Save whitelisted sites
            await this.saveWhitelistedSites();

            return { success: true, whitelistId: whitelistData.id };
        } catch (error) {
            console.error('[FocusMode] Add whitelisted site error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Remove website from whitelist
     * @param {string} whitelistId - Whitelist ID
     * @returns {Promise<Object>} Remove result
     */
    async removeWhitelistedSite(whitelistId) {
        try {
            const whitelistData = this.whitelistedSites.get(whitelistId);
            if (!whitelistData) {
                return {
                    success: false,
                    error: 'Whitelist entry not found'
                };
            }

            this.whitelistedSites.delete(whitelistId);

            console.log(`[FocusMode] Website removed from whitelist: ${whitelistData.domain}`);

            // Emit event
            this.emit('siteRemovedFromWhitelist', whitelistData);

            // Save whitelisted sites
            await this.saveWhitelistedSites();

            return { success: true };
        } catch (error) {
            console.error('[FocusMode] Remove whitelisted site error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Add app to whitelist
     * @param {string} appName - Application name
     * @returns {Promise<Object>} Add result
     */
    async addWhitelistedApp(appName) {
        try {
            const whitelistData = {
                id: `whitelist_app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: appName,
                addedAt: new Date().toISOString(),
                reason: 'user_whitelist'
            };

            this.whitelistedApps.set(whitelistData.id, whitelistData);

            console.log(`[FocusMode] Application whitelisted: ${appName}`);

            // Emit event
            this.emit('appWhitelisted', whitelistData);

            // Save whitelisted apps
            await this.saveWhitelistedApps();

            return { success: true, whitelistId: whitelistData.id };
        } catch (error) {
            console.error('[FocusMode] Add whitelisted app error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Remove app from whitelist
     * @param {string} whitelistId - Whitelist ID
     * @returns {Promise<Object>} Remove result
     */
    async removeWhitelistedApp(whitelistId) {
        try {
            const whitelistData = this.whitelistedApps.get(whitelistId);
            if (!whitelistData) {
                return {
                    success: false,
                    error: 'Whitelist entry not found'
                };
            }

            this.whitelistedApps.delete(whitelistId);

            console.log(`[FocusMode] Application removed from whitelist: ${whitelistData.name}`);

            // Emit event
            this.emit('appRemovedFromWhitelist', whitelistData);

            // Save whitelisted apps
            await this.saveWhitelistedApps();

            return { success: true };
        } catch (error) {
            console.error('[FocusMode] Remove whitelisted app error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ==================== FOCUS SESSIONS ====================

    /**
     * Get focus session
     * @param {string} sessionId - Session ID
     * @returns {Object|null} Session or null
     */
    getFocusSession(sessionId) {
        return this.focusSessions.get(sessionId) || null;
    }

    /**
     * Get all focus sessions
     * @param {Object} filters - Optional filters
     * @returns {Array} Sessions array
     */
    getFocusSessions(filters = {}) {
        let sessions = Array.from(this.focusSessions.values());

        if (filters.completed !== undefined) {
            sessions = sessions.filter(s => s.completed === filters.completed);
        }

        if (filters.startDate) {
            sessions = sessions.filter(s => new Date(s.startTime) >= new Date(filters.startDate));
        }

        if (filters.endDate) {
            sessions = sessions.filter(s => new Date(s.startTime) <= new Date(filters.endDate));
        }

        if (filters.tags && filters.tags.length > 0) {
            sessions = sessions.filter(s =>
                filters.tags.some(tag => s.tags.includes(tag))
            );
        }

        // Sort by start time (descending)
        sessions.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

        return sessions;
    }

    /**
     * Get focus statistics
     * @param {Object} filters - Optional filters
     * @returns {Object} Statistics
     */
    getFocusStatistics(filters = {}) {
        let sessions = Array.from(this.focusSessions.values());

        // Apply filters
        if (filters.startDate) {
            sessions = sessions.filter(s => new Date(s.startTime) >= new Date(filters.startDate));
        }

        if (filters.endDate) {
            sessions = sessions.filter(s => new Date(s.startTime) <= new Date(filters.endDate));
        }

        // Calculate statistics
        const totalSessions = sessions.length;
        const completedSessions = sessions.filter(s => s.completed).length;
        const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

        const totalFocusTime = sessions.reduce((sum, s) => sum + (s.actualDuration || 0), 0);
        const avgSessionDuration = totalSessions > 0 ? totalFocusTime / totalSessions : 0;

        const totalInterruptions = sessions.reduce((sum, s) => sum + s.interruptions.length, 0);
        const avgInterruptions = totalSessions > 0 ? totalInterruptions / totalSessions : 0;

        return {
            totalSessions,
            completedSessions,
            completionRate,
            totalFocusTime,
            avgSessionDuration: Math.round(avgSessionDuration / 60000), // Convert to minutes
            totalInterruptions,
            avgInterruptions: Math.round(avgInterruptions * 10) / 10
        };
    }

    // ==================== PERSISTENCE ====================

    /**
     * Save focus session
     * @private
     */
    async saveFocusSession(session) {
        try {
            const filename = `${session.id}.json`;
            const filepath = path.join(this.dataPath, filename);

            const data = JSON.stringify(session, null, 2);
            await fs.writeFile(filepath, data, 'utf-8');

            console.log(`[FocusMode] Focus session saved: ${filename}`);
        } catch (error) {
            console.error('[FocusMode] Save focus session error:', error);
        }
    }

    /**
     * Save all focus sessions
     * @private
     */
    async saveFocusSessions() {
        try {
            const data = JSON.stringify(Array.from(this.focusSessions.entries()), null, 2);
            await fs.writeFile(this.dataPath, data, 'utf-8');

            console.log('[FocusMode] Focus sessions saved');
        } catch (error) {
            console.error('[FocusMode] Save focus sessions error:', error);
        }
    }

    /**
     * Load focus sessions
     * @private
     */
    async loadFocusSessions() {
        try {
            const data = await fs.readFile(this.dataPath, 'utf-8');
            const sessions = JSON.parse(data);
            this.focusSessions = new Map(sessions);

            console.log(`[FocusMode] Loaded ${this.focusSessions.size} focus sessions`);
        } catch (error) {
            console.log('[FocusMode] No saved focus sessions found');
        }
    }

    /**
     * Save blocked websites
     * @private
     */
    async saveBlockedWebsites() {
        try {
            const data = JSON.stringify(Array.from(this.blockedWebsites.entries()), null, 2);
            await fs.writeFile(
                path.join(this.dataPath, 'blocked-websites.json'),
                data,
                'utf-8'
            );

            console.log('[FocusMode] Blocked websites saved');
        } catch (error) {
            console.error('[FocusMode] Save blocked websites error:', error);
        }
    }

    /**
     * Load blocked websites
     * @private
     */
    async loadBlockedWebsites() {
        try {
            const data = await fs.readFile(
                path.join(this.dataPath, 'blocked-websites.json'),
                'utf-8'
            );
            const websites = JSON.parse(data);
            this.blockedWebsites = new Map(websites);

            console.log(`[FocusMode] Loaded ${this.blockedWebsites.size} blocked websites`);
        } catch (error) {
            console.log('[FocusMode] No saved blocked websites found');
        }
    }

    /**
     * Save blocked apps
     * @private
     */
    async saveBlockedApps() {
        try {
            const data = JSON.stringify(Array.from(this.blockedApps.entries()), null, 2);
            await fs.writeFile(
                path.join(this.dataPath, 'blocked-apps.json'),
                data,
                'utf-8'
            );

            console.log('[FocusMode] Blocked apps saved');
        } catch (error) {
            console.error('[FocusMode] Save blocked apps error:', error);
        }
    }

    /**
     * Load blocked apps
     * @private
     */
    async loadBlockedApps() {
        try {
            const data = await fs.readFile(
                path.join(this.dataPath, 'blocked-apps.json'),
                'utf-8'
            );
            const apps = JSON.parse(data);
            this.blockedApps = new Map(apps);

            console.log(`[FocusMode] Loaded ${this.blockedApps.size} blocked apps`);
        } catch (error) {
            console.log('[FocusMode] No saved blocked apps found');
        }
    }

    /**
     * Save whitelisted sites
     * @private
     */
    async saveWhitelistedSites() {
        try {
            const data = JSON.stringify(Array.from(this.whitelistedSites.entries()), null, 2);
            await fs.writeFile(
                path.join(this.dataPath, 'whitelisted-sites.json'),
                data,
                'utf-8'
            );

            console.log('[FocusMode] Whitelisted sites saved');
        } catch (error) {
            console.error('[FocusMode] Save whitelisted sites error:', error);
        }
    }

    /**
     * Load whitelisted sites
     * @private
     */
    async loadWhitelistedSites() {
        try {
            const data = await fs.readFile(
                path.join(this.dataPath, 'whitelisted-sites.json'),
                'utf-8'
            );
            const sites = JSON.parse(data);
            this.whitelistedSites = new Map(sites);

            console.log(`[FocusMode] Loaded ${this.whitelistedSites.size} whitelisted sites`);
        } catch (error) {
            console.log('[FocusMode] No saved whitelisted sites found');
        }
    }

    /**
     * Save whitelisted apps
     * @private
     */
    async saveWhitelistedApps() {
        try {
            const data = JSON.stringify(Array.from(this.whitelistedApps.entries()), null, 2);
            await fs.writeFile(
                path.join(this.dataPath, 'whitelisted-apps.json'),
                data,
                'utf-8'
            );

            console.log('[FocusMode] Whitelisted apps saved');
        } catch (error) {
            console.error('[FocusMode] Save whitelisted apps error:', error);
        }
    }

    /**
     * Load whitelisted apps
     * @private
     */
    async loadWhitelistedApps() {
        try {
            const data = await fs.readFile(
                path.join(this.dataPath, 'whitelisted-apps.json'),
                'utf-8'
            );
            const apps = JSON.parse(data);
            this.whitelistedApps = new Map(apps);

            console.log(`[FocusMode] Loaded ${this.whitelistedApps.size} whitelisted apps`);
        } catch (error) {
            console.log('[FocusMode] No saved whitelisted apps found');
        }
    }

    // ==================== CLEANUP ====================

    /**
     * Cleanup
     */
    async cleanup() {
        console.log('[FocusMode] Cleaning up');

        // Stop focus mode
        if (this.isFocusMode) {
            await this.stopFocusMode();
        }

        // Clear caches
        this.focusSessions.clear();
        this.blockedWebsites.clear();
        this.blockedApps.clear();
        this.whitelistedSites.clear();
        this.whitelistedApps.clear();
    }
}

// Export singleton instance
const focusModeService = new FocusModeService();
module.exports = focusModeService;
