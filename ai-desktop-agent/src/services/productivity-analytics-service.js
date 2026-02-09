const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');

/**
 * Productivity Analytics Service - Time tracking and insights
 * Features: Time tracking, productivity metrics, insights, reports
 */
class ProductivityAnalyticsService extends EventEmitter {
    constructor() {
        super();
        this.timeEntries = new Map(); // Time tracking entries
        this.productivityMetrics = new Map(); // Productivity metrics
        this.insights = []; // Generated insights
        this.isTracking = false;
        this.currentSession = null;
        this.trackingInterval = null;
        this.dataPath = path.join(__dirname, '../../data/productivity-analytics.json');
    }

    /**
     * Initialize productivity analytics service
     * @param {Object} config - Configuration
     */
    async initialize(config = {}) {
        console.log('[ProductivityAnalytics] Initializing service...');
        try {
            // Load existing data
            console.log('[ProductivityAnalytics] Loading time entries...');
            await this.loadTimeEntries();
            console.log('[ProductivityAnalytics] Loading productivity metrics...');
            await this.loadProductivityMetrics();

            console.log('[ProductivityAnalytics] Productivity Analytics Service initialized');
            return { success: true };
        } catch (error) {
            console.error('[ProductivityAnalytics] Initialization error:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== TIME TRACKING ====================

    /**
     * Start time tracking session
     * @param {Object} options - Session options
     * @returns {Promise<Object>} Start result
     */
    async startTracking(options = {}) {
        try {
            if (this.isTracking) {
                return {
                    success: false,
                    error: 'Time tracking already in progress'
                };
            }

            console.log('[ProductivityAnalytics] Starting time tracking...');

            const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            this.currentSession = {
                id: sessionId,
                name: options.name || 'Work Session',
                category: options.category || 'general',
                project: options.project || '',
                task: options.task || '',
                startTime: new Date().toISOString(),
                endTime: null,
                duration: 0,
                breaks: [],
                applications: [],
                websites: [],
                notes: options.notes || '',
                tags: options.tags || [],
                productivityScore: 0
            };

            this.isTracking = true;

            // Start tracking interval
            this.trackingInterval = setInterval(() => {
                this.updateSessionDuration();
            }, 1000); // Update every second

            console.log(`[ProductivityAnalytics] Time tracking started: ${sessionId}`);

            // Emit event
            this.emit('trackingStarted', this.currentSession);

            return { success: true, sessionId };
        } catch (error) {
            console.error('[ProductivityAnalytics] Start tracking error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Stop time tracking session
     * @returns {Promise<Object>} Stop result
     */
    async stopTracking() {
        try {
            if (!this.isTracking) {
                return {
                    success: false,
                    error: 'No time tracking in progress'
                };
            }

            console.log('[ProductivityAnalytics] Stopping time tracking...');

            // Stop tracking interval
            if (this.trackingInterval) {
                clearInterval(this.trackingInterval);
                this.trackingInterval = null;
            }

            // Finalize session
            const endTime = new Date().toISOString();
            const duration = Date.now() - new Date(this.currentSession.startTime).getTime();

            this.currentSession.endTime = endTime;
            this.currentSession.duration = duration;

            // Calculate productivity score
            this.currentSession.productivityScore = this.calculateProductivityScore(this.currentSession);

            // Save session
            await this.saveTimeEntry(this.currentSession);

            // Store in time entries map
            this.timeEntries.set(this.currentSession.id, this.currentSession);

            console.log(`[ProductivityAnalytics] Time tracking stopped: ${this.currentSession.id}`);

            // Emit event
            this.emit('trackingStopped', this.currentSession);

            // Reset state
            this.isTracking = false;
            this.currentSession = null;

            return { success: true, session: this.currentSession };
        } catch (error) {
            console.error('[ProductivityAnalytics] Stop tracking error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Update session duration
     * @private
     */
    updateSessionDuration() {
        if (!this.currentSession) {
            return;
        }

        const duration = Date.now() - new Date(this.currentSession.startTime).getTime();
        this.currentSession.duration = duration;
    }

    /**
     * Log application usage
     * @param {string} application - Application name
     * @param {number} duration - Duration in milliseconds
     */
    logApplicationUsage(application, duration) {
        if (!this.isTracking || !this.currentSession) {
            return;
        }

        const existingApp = this.currentSession.applications.find(a => a.name === application);
        if (existingApp) {
            existingApp.duration += duration;
            existingApp.count++;
        } else {
            this.currentSession.applications.push({
                name: application,
                duration,
                count: 1,
                firstSeen: new Date().toISOString()
            });
        }
    }

    /**
     * Log website visit
     * @param {string} url - Website URL
     * @param {number} duration - Duration in milliseconds
     */
    logWebsiteVisit(url, duration) {
        if (!this.isTracking || !this.currentSession) {
            return;
        }

        const existingSite = this.currentSession.websites.find(w => w.url === url);
        if (existingSite) {
            existingSite.duration += duration;
            existingSite.count++;
        } else {
            this.currentSession.websites.push({
                url,
                domain: new URL(url).hostname,
                duration,
                count: 1,
                firstSeen: new Date().toISOString()
            });
        }
    }

    /**
     * Add break to session
     * @param {Object} breakInfo - Break data
     */
    addBreak(breakInfo) {
        if (!this.isTracking || !this.currentSession) {
            return;
        }

        const breakData = {
            id: `break_${Date.now()}`,
            startTime: breakInfo.startTime || new Date().toISOString(),
            endTime: breakInfo.endTime || new Date().toISOString(),
            duration: breakInfo.duration || 0,
            type: breakInfo.type || 'short', // 'short', 'long', 'lunch'
            reason: breakInfo.reason || ''
        };

        this.currentSession.breaks.push(breakData);

        console.log(`[ProductivityAnalytics] Break added: ${breakData.id}`);

        // Emit event
        this.emit('breakAdded', breakData);
    }

    /**
     * Calculate productivity score
     * @private
     */
    calculateProductivityScore(session) {
        let score = 100;

        // Deduct for breaks
        const totalBreakTime = session.breaks.reduce((sum, b) => sum + b.duration, 0);
        const breakRatio = totalBreakTime / session.duration;
        score -= breakRatio * 20; // Max 20 point deduction

        // Bonus for focused work
        const focusTime = session.duration - totalBreakTime;
        if (focusTime > 3600000) { // More than 1 hour
            score += 10;
        }

        // Deduct for context switching
        const appSwitches = session.applications.length;
        if (appSwitches > 10) {
            score -= (appSwitches - 10) * 2;
        }

        // Ensure score is between 0 and 100
        score = Math.max(0, Math.min(100, score));

        return Math.round(score);
    }

    // ==================== TIME ENTRIES ====================

    /**
     * Get time entry
     * @param {string} entryId - Entry ID
     * @returns {Object|null} Time entry or null
     */
    getTimeEntry(entryId) {
        return this.timeEntries.get(entryId) || null;
    }

    /**
     * Get all time entries
     * @param {Object} filters - Optional filters
     * @returns {Array} Time entries array
     */
    getTimeEntries(filters = {}) {
        let entries = Array.from(this.timeEntries.values());

        if (filters.category) {
            entries = entries.filter(e => e.category === filters.category);
        }

        if (filters.project) {
            entries = entries.filter(e => e.project === filters.project);
        }

        if (filters.startDate) {
            entries = entries.filter(e => new Date(e.startTime) >= new Date(filters.startDate));
        }

        if (filters.endDate) {
            entries = entries.filter(e => new Date(e.startTime) <= new Date(filters.endDate));
        }

        if (filters.tags && filters.tags.length > 0) {
            entries = entries.filter(e =>
                filters.tags.some(tag => e.tags.includes(tag))
            );
        }

        if (filters.minDuration) {
            entries = entries.filter(e => e.duration >= filters.minDuration);
        }

        if (filters.maxDuration) {
            entries = entries.filter(e => e.duration <= filters.maxDuration);
        }

        // Sort by start time (descending)
        entries.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

        return entries;
    }

    /**
     * Update time entry
     * @param {string} entryId - Entry ID
     * @param {Object} updates - Updates to apply
     * @returns {Promise<Object>} Update result
     */
    async updateTimeEntry(entryId, updates) {
        try {
            const entry = this.timeEntries.get(entryId);
            if (!entry) {
                return {
                    success: false,
                    error: 'Time entry not found'
                };
            }

            // Apply updates
            const updatedEntry = {
                ...entry,
                ...updates
            };

            this.timeEntries.set(entryId, updatedEntry);

            console.log(`[ProductivityAnalytics] Time entry updated: ${entryId}`);

            // Emit event
            this.emit('timeEntryUpdated', updatedEntry);

            // Save entries
            await this.saveTimeEntries();

            return { success: true };
        } catch (error) {
            console.error('[ProductivityAnalytics] Update time entry error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Delete time entry
     * @param {string} entryId - Entry ID
     * @returns {Promise<Object>} Delete result
     */
    async deleteTimeEntry(entryId) {
        try {
            const entry = this.timeEntries.get(entryId);
            if (!entry) {
                return {
                    success: false,
                    error: 'Time entry not found'
                };
            }

            this.timeEntries.delete(entryId);

            console.log(`[ProductivityAnalytics] Time entry deleted: ${entryId}`);

            // Emit event
            this.emit('timeEntryDeleted', entry);

            // Save entries
            await this.saveTimeEntries();

            return { success: true };
        } catch (error) {
            console.error('[ProductivityAnalytics] Delete time entry error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ==================== ANALYTICS ====================

    /**
     * Get productivity statistics
     * @param {Object} filters - Optional filters
     * @returns {Object} Statistics
     */
    getStatistics(filters = {}) {
        let entries = Array.from(this.timeEntries.values());

        // Apply filters
        if (filters.startDate) {
            entries = entries.filter(e => new Date(e.startTime) >= new Date(filters.startDate));
        }

        if (filters.endDate) {
            entries = entries.filter(e => new Date(e.startTime) <= new Date(filters.endDate));
        }

        if (filters.category) {
            entries = entries.filter(e => e.category === filters.category);
        }

        // Calculate statistics
        const totalTime = entries.reduce((sum, e) => sum + e.duration, 0);
        const totalHours = totalTime / 3600000;
        const totalDays = entries.length;

        const categoryBreakdown = {};
        const projectBreakdown = {};
        const dailyBreakdown = {};

        for (const entry of entries) {
            // Category breakdown
            categoryBreakdown[entry.category] = (categoryBreakdown[entry.category] || 0) + entry.duration;

            // Project breakdown
            if (entry.project) {
                projectBreakdown[entry.project] = (projectBreakdown[entry.project] || 0) + entry.duration;
            }

            // Daily breakdown
            const date = new Date(entry.startTime).toISOString().split('T')[0];
            dailyBreakdown[date] = (dailyBreakdown[date] || 0) + entry.duration;
        }

        // Average productivity score
        const avgProductivity = entries.length > 0
            ? entries.reduce((sum, e) => sum + e.productivityScore, 0) / entries.length
            : 0;

        return {
            totalTime,
            totalHours: Math.round(totalHours * 100) / 100,
            totalDays,
            avgProductivity: Math.round(avgProductivity),
            categoryBreakdown,
            projectBreakdown,
            dailyBreakdown,
            entriesCount: entries.length
        };
    }

    /**
     * Get insights
     * @param {Object} filters - Optional filters
     * @returns {Array} Insights array
     */
    getInsights(filters = {}) {
        let entries = Array.from(this.timeEntries.values());

        // Apply filters
        if (filters.startDate) {
            entries = entries.filter(e => new Date(e.startTime) >= new Date(filters.startDate));
        }

        if (filters.endDate) {
            entries = entries.filter(e => new Date(e.startTime) <= new Date(filters.endDate));
        }

        const insights = [];

        // Most productive time
        const hourlyProductivity = {};
        for (const entry of entries) {
            const hour = new Date(entry.startTime).getHours();
            hourlyProductivity[hour] = (hourlyProductivity[hour] || 0) + entry.productivityScore;
        }

        const mostProductiveHour = Object.entries(hourlyProductivity)
            .sort((a, b) => b[1] - a[1])[0];

        if (mostProductiveHour) {
            insights.push({
                type: 'most_productive_hour',
                value: mostProductiveHour[0],
                score: Math.round(mostProductiveHour[1] / entries.filter(e => new Date(e.startTime).getHours() === mostProductiveHour[0]).length),
                message: `Most productive hour: ${mostProductiveHour[0]}:00`
            });
        }

        // Most productive day
        const dailyProductivity = {};
        for (const entry of entries) {
            const day = new Date(entry.startTime).getDay();
            dailyProductivity[day] = (dailyProductivity[day] || 0) + entry.productivityScore;
        }

        const mostProductiveDay = Object.entries(dailyProductivity)
            .sort((a, b) => b[1] - a[1])[0];

        if (mostProductiveDay) {
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            insights.push({
                type: 'most_productive_day',
                value: mostProductiveDay[0],
                score: Math.round(mostProductiveDay[1] / entries.filter(e => new Date(e.startTime).getDay() === mostProductiveDay[0]).length),
                message: `Most productive day: ${days[mostProductiveDay[0]]}`
            });
        }

        // Top categories
        const categoryTotals = {};
        for (const entry of entries) {
            categoryTotals[entry.category] = (categoryTotals[entry.category] || 0) + entry.duration;
        }

        const topCategories = Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        insights.push({
            type: 'top_categories',
            value: topCategories.map(([cat, time]) => ({ category: cat, hours: Math.round(time / 3600000 * 100) / 100 })),
            message: 'Top 5 categories by time spent'
        });

        // Productivity trend
        if (entries.length >= 7) {
            const last7Days = entries.slice(0, 7);
            const avgProductivity7Days = last7Days.reduce((sum, e) => sum + e.productivityScore, 0) / 7;
            const prev7Days = entries.slice(7, 14);
            const avgProductivityPrev7Days = prev7Days.length > 0
                ? prev7Days.reduce((sum, e) => sum + e.productivityScore, 0) / prev7Days.length
                : avgProductivity7Days;

            const trend = avgProductivity7Days > avgProductivityPrev7Days ? 'improving' : 'declining';

            insights.push({
                type: 'productivity_trend',
                value: trend,
                currentScore: Math.round(avgProductivity7Days),
                previousScore: Math.round(avgProductivityPrev7Days),
                message: `Productivity is ${trend} compared to previous week`
            });
        }

        return insights;
    }

    /**
     * Generate report
     * @param {Object} options - Report options
     * @returns {Object} Report data
     */
    generateReport(options = {}) {
        const startDate = options.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const endDate = options.endDate || new Date().toISOString();

        const filters = { startDate, endDate };
        const statistics = this.getStatistics(filters);
        const insights = this.getInsights(filters);
        const entries = this.getTimeEntries(filters);

        return {
            period: {
                startDate,
                endDate,
                days: Math.ceil((new Date(endDate) - new Date(startDate)) / (24 * 60 * 60 * 1000))
            },
            statistics,
            insights,
            entries,
            generatedAt: new Date().toISOString()
        };
    }

    // ==================== PERSISTENCE ====================

    /**
     * Save time entry
     * @private
     */
    async saveTimeEntry(entry) {
        try {
            // Update the map first
            this.timeEntries.set(entry.id, entry);

            // Save all entries to the single file
            await this.saveTimeEntries();

            console.log(`[ProductivityAnalytics] Time entry saved: ${entry.id}`);
        } catch (error) {
            console.error('[ProductivityAnalytics] Save time entry error:', error);
        }
    }

    /**
     * Save all time entries
     * @private
     */
    async saveTimeEntries() {
        try {
            const data = JSON.stringify(Array.from(this.timeEntries.entries()), null, 2);
            await fs.writeFile(this.dataPath, data, 'utf-8');

            console.log('[ProductivityAnalytics] Time entries saved');
        } catch (error) {
            console.error('[ProductivityAnalytics] Save time entries error:', error);
        }
    }

    /**
     * Load time entries
     * @private
     */
    async loadTimeEntries() {
        console.log(`[ProductivityAnalytics] Reading time entries from: ${this.dataPath}`);
        try {
            const data = await fs.readFile(this.dataPath, 'utf-8');
            console.log('[ProductivityAnalytics] Time entries file read successfully');
            const entries = JSON.parse(data);
            this.timeEntries = new Map(entries);

            console.log(`[ProductivityAnalytics] Loaded ${this.timeEntries.size} time entries`);
        } catch (error) {
            console.log(`[ProductivityAnalytics] Failed to load time entries (new session?): ${error.message}`);
        }
    }

    /**
     * Save productivity metrics
     * @private
     */
    async saveProductivityMetrics() {
        try {
            const data = JSON.stringify(Array.from(this.productivityMetrics.entries()), null, 2);
            await fs.writeFile(
                path.join(path.dirname(this.dataPath), 'productivity-metrics.json'),
                data,
                'utf-8'
            );

            console.log('[ProductivityAnalytics] Productivity metrics saved');
        } catch (error) {
            console.error('[ProductivityAnalytics] Save productivity metrics error:', error);
        }
    }

    /**
     * Load productivity metrics
     * @private
     */
    async loadProductivityMetrics() {
        try {
            const metricsFile = path.join(path.dirname(this.dataPath), 'productivity-metrics.json');
            console.log(`[ProductivityAnalytics] Reading metrics from: ${metricsFile}`);

            const data = await fs.readFile(metricsFile, 'utf-8');
            console.log('[ProductivityAnalytics] Metrics file read successfully');
            const metrics = JSON.parse(data);
            this.productivityMetrics = new Map(metrics);

            console.log(`[ProductivityAnalytics] Loaded ${this.productivityMetrics.size} productivity metrics`);
        } catch (error) {
            console.log(`[ProductivityAnalytics] Failed to load metrics (new session?): ${error.message}`);
        }
    }

    // ==================== CLEANUP ====================

    /**
     * Cleanup
     */
    async cleanup() {
        console.log('[ProductivityAnalytics] Cleaning up');

        // Stop tracking
        if (this.isTracking) {
            await this.stopTracking();
        }

        // Clear caches
        this.timeEntries.clear();
        this.productivityMetrics.clear();
        this.insights = [];
    }
}

// Export singleton instance
const productivityAnalyticsService = new ProductivityAnalyticsService();
module.exports = productivityAnalyticsService;
