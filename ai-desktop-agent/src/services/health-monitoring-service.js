const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');

/**
 * Health Monitoring Service - Break reminders and wellness
 * Features: Break reminders, wellness tracking, posture reminders, eye strain prevention
 */
class HealthMonitoringService extends EventEmitter {
    constructor() {
        super();
        this.breakReminders = new Map(); // Break reminders
        this.wellnessMetrics = new Map(); // Wellness metrics
        this.postureReminders = new Map(); // Posture reminders
        this.eyeStrainReminders = new Map(); // Eye strain reminders
        this.isMonitoring = false;
        this.monitoringInterval = null;
        this.breakInterval = null;
        this.currentSession = null;
        this.dataPath = path.join(__dirname, '../../data/health-monitoring.json');
        this.breakIntervalMinutes = 25; // Default break interval
        this.breakDurationMinutes = 5; // Default break duration
        this.postureCheckInterval = 30; // Posture check interval (minutes)
        this.eyeStrainInterval = 20; // Eye strain check interval (minutes)
    }

    /**
     * Initialize health monitoring service
     * @param {Object} config - Configuration
     */
    async initialize(config = {}) {
        try {
            this.breakIntervalMinutes = config.breakIntervalMinutes || 25;
            this.breakDurationMinutes = config.breakDurationMinutes || 5;
            this.postureCheckInterval = config.postureCheckInterval || 30;
            this.eyeStrainInterval = config.eyeStrainInterval || 20;

            // Load existing data
            await this.loadBreakReminders();
            await this.loadWellnessMetrics();

            console.log('[HealthMonitoring] Health Monitoring Service initialized');
            return { success: true };
        } catch (error) {
            console.error('[HealthMonitoring] Initialization error:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== MONITORING ====================

    /**
     * Start health monitoring
     * @param {Object} options - Monitoring options
     * @returns {Promise<Object>} Start result
     */
    async startMonitoring(options = {}) {
        try {
            if (this.isMonitoring) {
                return {
                    success: false,
                    error: 'Health monitoring already in progress'
                };
            }

            console.log('[HealthMonitoring] Starting health monitoring...');

            const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            this.currentSession = {
                id: sessionId,
                startTime: new Date().toISOString(),
                endTime: null,
                breaks: [],
                postureChecks: [],
                eyeStrainChecks: [],
                wellnessScore: 100,
                settings: {
                    breakInterval: options.breakIntervalMinutes || this.breakIntervalMinutes,
                    breakDuration: options.breakDurationMinutes || this.breakDurationMinutes,
                    postureCheckInterval: options.postureCheckInterval || this.postureCheckInterval,
                    eyeStrainInterval: options.eyeStrainInterval || this.eyeStrainInterval,
                    enableBreakReminders: options.enableBreakReminders !== false,
                    enablePostureReminders: options.enablePostureReminders !== false,
                    enableEyeStrainReminders: options.enableEyeStrainReminders !== false
                }
            };

            this.isMonitoring = true;

            // Start monitoring intervals
            if (this.currentSession.settings.enableBreakReminders) {
                this.startBreakReminders();
            }

            if (this.currentSession.settings.enablePostureReminders) {
                this.startPostureReminders();
            }

            if (this.currentSession.settings.enableEyeStrainReminders) {
                this.startEyeStrainReminders();
            }

            console.log(`[HealthMonitoring] Health monitoring started: ${sessionId}`);

            // Emit event
            this.emit('monitoringStarted', this.currentSession);

            return { success: true, sessionId };
        } catch (error) {
            console.error('[HealthMonitoring] Start monitoring error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Stop health monitoring
     * @returns {Promise<Object>} Stop result
     */
    async stopMonitoring() {
        try {
            if (!this.isMonitoring) {
                return {
                    success: false,
                    error: 'No health monitoring in progress'
                };
            }

            console.log('[HealthMonitoring] Stopping health monitoring...');

            // Stop all intervals
            if (this.monitoringInterval) {
                clearInterval(this.monitoringInterval);
                this.monitoringInterval = null;
            }

            if (this.breakInterval) {
                clearInterval(this.breakInterval);
                this.breakInterval = null;
            }

            // Finalize session
            const endTime = new Date().toISOString();
            this.currentSession.endTime = endTime;

            // Calculate wellness score
            this.currentSession.wellnessScore = this.calculateWellnessScore(this.currentSession);

            // Save session
            await this.saveWellnessMetric(this.currentSession);

            // Store in wellness metrics map
            this.wellnessMetrics.set(this.currentSession.id, this.currentSession);

            console.log(`[HealthMonitoring] Health monitoring stopped: ${this.currentSession.id}`);

            // Emit event
            this.emit('monitoringStopped', this.currentSession);

            // Reset state
            this.isMonitoring = false;
            this.currentSession = null;

            return { success: true, session: this.currentSession };
        } catch (error) {
            console.error('[HealthMonitoring] Stop monitoring error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Start break reminders
     * @private
     */
    startBreakReminders() {
        const intervalMs = this.currentSession.settings.breakInterval * 60 * 1000;

        this.breakInterval = setInterval(() => {
            this.triggerBreakReminder();
        }, intervalMs);
    }

    /**
     * Start posture reminders
     * @private
     */
    startPostureReminders() {
        const intervalMs = this.currentSession.settings.postureCheckInterval * 60 * 1000;

        this.monitoringInterval = setInterval(() => {
            this.triggerPostureReminder();
        }, intervalMs);
    }

    /**
     * Start eye strain reminders
     * @private
     */
    startEyeStrainReminders() {
        const intervalMs = this.currentSession.settings.eyeStrainInterval * 60 * 1000;

        this.monitoringInterval = setInterval(() => {
            this.triggerEyeStrainReminder();
        }, intervalMs);
    }

    /**
     * Trigger break reminder
     * @private
     */
    triggerBreakReminder() {
        const breakData = {
            id: `break_${Date.now()}`,
            type: 'scheduled',
            startTime: new Date().toISOString(),
            duration: this.currentSession.settings.breakDuration * 60 * 1000,
            reason: 'scheduled_break',
            acknowledged: false
        };

        this.currentSession.breaks.push(breakData);

        console.log('[HealthMonitoring] Break reminder triggered');

        // Emit event
        this.emit('breakReminder', breakData);
    }

    /**
     * Trigger posture reminder
     * @private
     */
    triggerPostureReminder() {
        const postureData = {
            id: `posture_${Date.now()}`,
            timestamp: new Date().toISOString(),
            type: 'check',
            acknowledged: false
        };

        this.currentSession.postureChecks.push(postureData);

        console.log('[HealthMonitoring] Posture reminder triggered');

        // Emit event
        this.emit('postureReminder', postureData);
    }

    /**
     * Trigger eye strain reminder
     * @private
     */
    triggerEyeStrainReminder() {
        const eyeStrainData = {
            id: `eye_${Date.now()}`,
            timestamp: new Date().toISOString(),
            type: 'check',
            acknowledged: false
        };

        this.currentSession.eyeStrainChecks.push(eyeStrainData);

        console.log('[HealthMonitoring] Eye strain reminder triggered');

        // Emit event
        this.emit('eyeStrainReminder', eyeStrainData);
    }

    /**
     * Acknowledge break
     * @param {string} breakId - Break ID
     * @returns {Object} Acknowledge result
     */
    acknowledgeBreak(breakId) {
        if (!this.currentSession) {
            return {
                success: false,
                error: 'No active session'
            };
        }

        const breakData = this.currentSession.breaks.find(b => b.id === breakId);
        if (!breakData) {
            return {
                success: false,
                error: 'Break not found'
            };
        }

        breakData.acknowledged = true;
        breakData.acknowledgedAt = new Date().toISOString();

        console.log(`[HealthMonitoring] Break acknowledged: ${breakId}`);

        // Emit event
        this.emit('breakAcknowledged', breakData);

        return { success: true };
    }

    /**
     * Skip break
     * @param {string} breakId - Break ID
     * @param {string} reason - Skip reason
     * @returns {Object} Skip result
     */
    skipBreak(breakId, reason) {
        if (!this.currentSession) {
            return {
                success: false,
                error: 'No active session'
            };
        }

        const breakData = this.currentSession.breaks.find(b => b.id === breakId);
        if (!breakData) {
            return {
                success: false,
                error: 'Break not found'
            };
        }

        breakData.skipped = true;
        breakData.skipReason = reason;
        breakData.skippedAt = new Date().toISOString();

        console.log(`[HealthMonitoring] Break skipped: ${breakId}`);

        // Emit event
        this.emit('breakSkipped', { breakId, reason });

        return { success: true };
    }

    /**
     * Calculate wellness score
     * @private
     */
    calculateWellnessScore(session) {
        let score = 100;

        // Deduct for skipped breaks
        const skippedBreaks = session.breaks.filter(b => b.skipped).length;
        score -= skippedBreaks * 5; // 5 points per skipped break

        // Bonus for acknowledged breaks
        const acknowledgedBreaks = session.breaks.filter(b => b.acknowledged).length;
        score += acknowledgedBreaks * 2; // 2 points per acknowledged break

        // Deduct for missed posture checks
        const missedPostureChecks = session.postureChecks.filter(p => !p.acknowledged).length;
        score -= missedPostureChecks * 3; // 3 points per missed check

        // Deduct for missed eye strain checks
        const missedEyeChecks = session.eyeStrainChecks.filter(e => !e.acknowledged).length;
        score -= missedEyeChecks * 3; // 3 points per missed check

        // Ensure score is between 0 and 100
        score = Math.max(0, Math.min(100, score));

        return Math.round(score);
    }

    // ==================== WELLNESS METRICS ====================

    /**
     * Get wellness metric
     * @param {string} metricId - Metric ID
     * @returns {Object|null} Metric or null
     */
    getWellnessMetric(metricId) {
        return this.wellnessMetrics.get(metricId) || null;
    }

    /**
     * Get all wellness metrics
     * @param {Object} filters - Optional filters
     * @returns {Array} Metrics array
     */
    getWellnessMetrics(filters = {}) {
        let metrics = Array.from(this.wellnessMetrics.values());

        if (filters.startDate) {
            metrics = metrics.filter(m => new Date(m.startTime) >= new Date(filters.startDate));
        }

        if (filters.endDate) {
            metrics = metrics.filter(m => new Date(m.startTime) <= new Date(filters.endDate));
        }

        // Sort by start time (descending)
        metrics.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

        return metrics;
    }

    /**
     * Get wellness statistics
     * @param {Object} filters - Optional filters
     * @returns {Object} Statistics
     */
    getWellnessStatistics(filters = {}) {
        let metrics = Array.from(this.wellnessMetrics.values());

        // Apply filters
        if (filters.startDate) {
            metrics = metrics.filter(m => new Date(m.startTime) >= new Date(filters.startDate));
        }

        if (filters.endDate) {
            metrics = metrics.filter(m => new Date(m.startTime) <= new Date(filters.endDate));
        }

        // Calculate statistics
        const totalSessions = metrics.length;
        const totalBreaks = metrics.reduce((sum, m) => sum + m.breaks.length, 0);
        const acknowledgedBreaks = metrics.reduce((sum, m) => 
            sum + m.breaks.filter(b => b.acknowledged).length, 0);
        const skippedBreaks = metrics.reduce((sum, m) => 
            sum + m.breaks.filter(b => b.skipped).length, 0);

        const avgWellnessScore = metrics.length > 0
            ? metrics.reduce((sum, m) => sum + m.wellnessScore, 0) / metrics.length
            : 0;

        const totalMonitoringTime = metrics.reduce((sum, m) => {
            const duration = new Date(m.endTime) - new Date(m.startTime);
            return sum + duration;
        }, 0);

        const avgSessionDuration = metrics.length > 0
            ? totalMonitoringTime / metrics.length
            : 0;

        return {
            totalSessions,
            totalBreaks,
            acknowledgedBreaks,
            skippedBreaks,
            breakComplianceRate: totalBreaks > 0 ? Math.round((acknowledgedBreaks / totalBreaks) * 100) : 0,
            avgWellnessScore: Math.round(avgWellnessScore),
            avgSessionDuration: Math.round(avgSessionDuration / 60000), // Convert to minutes
            totalMonitoringHours: Math.round(totalMonitoringTime / 3600000)
        };
    }

    /**
     * Update wellness metric
     * @param {string} metricId - Metric ID
     * @param {Object} updates - Updates to apply
     * @returns {Promise<Object>} Update result
     */
    async updateWellnessMetric(metricId, updates) {
        try {
            const metric = this.wellnessMetrics.get(metricId);
            if (!metric) {
                return {
                    success: false,
                    error: 'Wellness metric not found'
                };
            }

            // Apply updates
            const updatedMetric = {
                ...metric,
                ...updates
            };

            this.wellnessMetrics.set(metricId, updatedMetric);

            console.log(`[HealthMonitoring] Wellness metric updated: ${metricId}`);

            // Emit event
            this.emit('wellnessMetricUpdated', updatedMetric);

            // Save metrics
            await this.saveWellnessMetrics();

            return { success: true };
        } catch (error) {
            console.error('[HealthMonitoring] Update wellness metric error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Delete wellness metric
     * @param {string} metricId - Metric ID
     * @returns {Promise<Object>} Delete result
     */
    async deleteWellnessMetric(metricId) {
        try {
            const metric = this.wellnessMetrics.get(metricId);
            if (!metric) {
                return {
                    success: false,
                    error: 'Wellness metric not found'
                };
            }

            this.wellnessMetrics.delete(metricId);

            console.log(`[HealthMonitoring] Wellness metric deleted: ${metricId}`);

            // Emit event
            this.emit('wellnessMetricDeleted', metric);

            // Save metrics
            await this.saveWellnessMetrics();

            return { success: true };
        } catch (error) {
            console.error('[HealthMonitoring] Delete wellness metric error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ==================== PERSISTENCE ====================

    /**
     * Save wellness metric
     * @private
     */
    async saveWellnessMetric(metric) {
        try {
            const filename = `${metric.id}.json`;
            const filepath = path.join(this.dataPath, filename);

            const data = JSON.stringify(metric, null, 2);
            await fs.writeFile(filepath, data, 'utf-8');

            console.log(`[HealthMonitoring] Wellness metric saved: ${filename}`);
        } catch (error) {
            console.error('[HealthMonitoring] Save wellness metric error:', error);
        }
    }

    /**
     * Save all wellness metrics
     * @private
     */
    async saveWellnessMetrics() {
        try {
            const data = JSON.stringify(Array.from(this.wellnessMetrics.entries()), null, 2);
            await fs.writeFile(this.dataPath, data, 'utf-8');

            console.log('[HealthMonitoring] Wellness metrics saved');
        } catch (error) {
            console.error('[HealthMonitoring] Save wellness metrics error:', error);
        }
    }

    /**
     * Load wellness metrics
     * @private
     */
    async loadWellnessMetrics() {
        try {
            const data = await fs.readFile(this.dataPath, 'utf-8');
            const metrics = JSON.parse(data);
            this.wellnessMetrics = new Map(metrics);

            console.log(`[HealthMonitoring] Loaded ${this.wellnessMetrics.size} wellness metrics`);
        } catch (error) {
            console.log('[HealthMonitoring] No saved wellness metrics found');
        }
    }

    /**
     * Load break reminders
     * @private
     */
    async loadBreakReminders() {
        try {
            const data = await fs.readFile(
                path.join(this.dataPath, 'break-reminders.json'),
                'utf-8'
            );
            const reminders = JSON.parse(data);
            this.breakReminders = new Map(reminders);

            console.log(`[HealthMonitoring] Loaded ${this.breakReminders.size} break reminders`);
        } catch (error) {
            console.log('[HealthMonitoring] No saved break reminders found');
        }
    }

    // ==================== CLEANUP ====================

    /**
     * Cleanup
     */
    async cleanup() {
        console.log('[HealthMonitoring] Cleaning up');

        // Stop monitoring
        if (this.isMonitoring) {
            await this.stopMonitoring();
        }

        // Clear caches
        this.breakReminders.clear();
        this.wellnessMetrics.clear();
        this.postureReminders.clear();
        this.eyeStrainReminders.clear();
    }
}

// Export singleton instance
const healthMonitoringService = new HealthMonitoringService();
module.exports = healthMonitoringService;
