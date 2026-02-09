const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');

/**
 * Audit Logs Service - Security event logging
 * Features: Security event logging, audit trail, log analysis, export capabilities
 */
class AuditLogsService extends EventEmitter {
    constructor() {
        super();
        this.auditLogs = new Map(); // Audit logs
        this.securityEvents = new Map(); // Security events
        this.logLevels = ['debug', 'info', 'warn', 'error', 'critical'];
        this.currentLogLevel = 'info'; // Current log level
        this.maxLogSize = 10000; // Max log entries
        this.logRetentionDays = 90; // Log retention in days
        this.logPath = path.join(__dirname, '../../data/audit-logs.json');
        this.securityLogPath = path.join(__dirname, '../../data/security-events.json');
    }

    /**
     * Initialize audit logs service
     * @param {Object} config - Configuration
     */
    async initialize(config = {}) {
        try {
            this.currentLogLevel = config.logLevel || 'info';
            this.maxLogSize = config.maxLogSize || 10000;
            this.logRetentionDays = config.logRetentionDays || 90;

            // Load logs
            await this.loadAuditLogs();
            await this.loadSecurityEvents();

            console.log('[AuditLogs] Audit Logs Service initialized');
            return { success: true };
        } catch (error) {
            console.error('[AuditLogs] Initialization error:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== LOGGING ====================

    /**
     * Log audit event
     * @param {Object} event - Event data
     * @returns {string} Log ID
     */
    logEvent(event) {
        const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const logData = {
            id: logId,
            timestamp: new Date().toISOString(),
            level: event.level || 'info',
            category: event.category || 'general',
            action: event.action || '',
            source: event.source || 'system',
            userId: event.userId || 'system',
            details: event.details || {},
            metadata: event.metadata || {},
            success: event.success !== false
        };

        // Add to logs
        this.auditLogs.set(logId, logData);

        // Trim logs if too large
        if (this.auditLogs.size > this.maxLogSize) {
            const oldestId = Array.from(this.auditLogs.keys())[0];
            this.auditLogs.delete(oldestId);
        }

        console.log(`[AuditLogs] Event logged: ${logId}`);

        // Emit event
        this.emit('eventLogged', logData);

        // Save logs
        this.saveAuditLogs();

        return logId;
    }

    /**
     * Log security event
     * @param {Object} event - Security event data
     * @returns {string} Event ID
     */
    logSecurityEvent(event) {
        const eventId = `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const eventData = {
            id: eventId,
            timestamp: new Date().toISOString(),
            severity: event.severity || 'medium',
            type: event.type || 'general',
            category: event.category || 'security',
            action: event.action || '',
            source: event.source || 'system',
            userId: event.userId || 'system',
            ipAddress: event.ipAddress || null,
            userAgent: event.userAgent || null,
            details: event.details || {},
            metadata: event.metadata || {},
            resolved: event.resolved || false,
            resolvedAt: null
        };

        // Add to security events
        this.securityEvents.set(eventId, eventData);

        // Trim events if too large
        if (this.securityEvents.size > this.maxLogSize) {
            const oldestId = Array.from(this.securityEvents.keys())[0];
            this.securityEvents.delete(oldestId);
        }

        console.log(`[AuditLogs] Security event logged: ${eventId}`);

        // Emit event
        this.emit('securityEventLogged', eventData);

        // Save events
        this.saveSecurityEvents();

        return eventId;
    }

    /**
     * Resolve security event
     * @param {string} eventId - Event ID
     * @param {string} resolution - Resolution description
     */
    resolveSecurityEvent(eventId, resolution) {
        const event = this.securityEvents.get(eventId);
        if (!event) {
            throw new Error(`Security event not found: ${eventId}`);
        }

        event.resolved = true;
        event.resolvedAt = new Date().toISOString();
        event.resolution = resolution;

        this.securityEvents.set(eventId, event);

        console.log(`[AuditLogs] Security event resolved: ${eventId}`);

        // Emit event
        this.emit('securityEventResolved', event);

        // Save events
        this.saveSecurityEvents();
    }

    // ==================== LOG LEVELS ====================

    /**
     * Set log level
     * @param {string} level - Log level (debug, info, warn, error, critical)
     */
    setLogLevel(level) {
        if (!this.logLevels.includes(level)) {
            throw new Error(`Invalid log level: ${level}`);
        }

        this.currentLogLevel = level;
        console.log(`[AuditLogs] Log level set to: ${level}`);

        // Emit event
        this.emit('logLevelChanged', level);
    }

    /**
     * Get log level
     * @returns {string} Current log level
     */
    getLogLevel() {
        return this.currentLogLevel;
    }

    /**
     * Check if level is enabled
     * @param {string} level - Log level to check
     * @returns {boolean} Enabled status
     */
    isLevelEnabled(level) {
        const levelIndex = this.logLevels.indexOf(level);
        const currentIndex = this.logLevels.indexOf(this.currentLogLevel);

        return levelIndex <= currentIndex;
    }

    // ==================== QUERYING ====================

    /**
     * Get audit logs
     * @param {Object} filters - Optional filters
     * @returns {Array} Logs array
     */
    getAuditLogs(filters = {}) {
        let logs = Array.from(this.auditLogs.values());

        // Filter by level
        if (filters.level) {
            logs = logs.filter(l => l.level === filters.level);
        }

        // Filter by category
        if (filters.category) {
            logs = logs.filter(l => l.category === filters.category);
        }

        // Filter by action
        if (filters.action) {
            logs = logs.filter(l => l.action === filters.action);
        }

        // Filter by source
        if (filters.source) {
            logs = logs.filter(l => l.source === filters.source);
        }

        // Filter by user
        if (filters.userId) {
            logs = logs.filter(l => l.userId === filters.userId);
        }

        // Filter by success
        if (filters.success !== undefined) {
            logs = logs.filter(l => l.success === filters.success);
        }

        // Filter by date range
        if (filters.startDate) {
            logs = logs.filter(l => new Date(l.timestamp) >= new Date(filters.startDate));
        }

        if (filters.endDate) {
            logs = logs.filter(l => new Date(l.timestamp) <= new Date(filters.endDate));
        }

        // Filter by search
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            logs = logs.filter(l =>
                l.action.toLowerCase().includes(searchLower) ||
                JSON.stringify(l.details).toLowerCase().includes(searchLower)
            );
        }

        // Sort by timestamp (descending)
        logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Apply limit
        if (filters.limit) {
            logs = logs.slice(0, filters.limit);
        }

        return logs;
    }

    /**
     * Get security events
     * @param {Object} filters - Optional filters
     * @returns {Array} Events array
     */
    getSecurityEvents(filters = {}) {
        let events = Array.from(this.securityEvents.values());

        // Filter by severity
        if (filters.severity) {
            events = events.filter(e => e.severity === filters.severity);
        }

        // Filter by type
        if (filters.type) {
            events = events.filter(e => e.type === filters.type);
        }

        // Filter by category
        if (filters.category) {
            events = events.filter(e => e.category === filters.category);
        }

        // Filter by resolved status
        if (filters.resolved !== undefined) {
            events = events.filter(e => e.resolved === filters.resolved);
        }

        // Filter by date range
        if (filters.startDate) {
            events = events.filter(e => new Date(e.timestamp) >= new Date(filters.startDate));
        }

        if (filters.endDate) {
            events = events.filter(e => new Date(e.timestamp) <= new Date(filters.endDate));
        }

        // Filter by search
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            events = events.filter(e =>
                e.action.toLowerCase().includes(searchLower) ||
                JSON.stringify(e.details).toLowerCase().includes(searchLower)
            );
        }

        // Sort by timestamp (descending)
        events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Apply limit
        if (filters.limit) {
            events = events.slice(0, filters.limit);
        }

        return events;
    }

    /**
     * Get log by ID
     * @param {string} logId - Log ID
     * @returns {Object|null} Log or null
     */
    getLog(logId) {
        return this.auditLogs.get(logId) || null;
    }

    /**
     * Get security event by ID
     * @param {string} eventId - Event ID
     * @returns {Object|null} Event or null
     */
    getSecurityEvent(eventId) {
        return this.securityEvents.get(eventId) || null;
    }

    // ==================== ANALYTICS ====================

    /**
     * Get audit statistics
     * @param {Object} filters - Optional filters
     * @returns {Object} Statistics
     */
    getAuditStatistics(filters = {}) {
        let logs = Array.from(this.auditLogs.values());

        // Apply filters
        if (filters.startDate) {
            logs = logs.filter(l => new Date(l.timestamp) >= new Date(filters.startDate));
        }

        if (filters.endDate) {
            logs = logs.filter(l => new Date(l.timestamp) <= new Date(filters.endDate));
        }

        // Calculate statistics
        const levelCounts = {};
        const categoryCounts = {};
        const actionCounts = {};
        const sourceCounts = {};
        const successCounts = { success: 0, failed: 0 };

        for (const log of logs) {
            // Level counts
            levelCounts[log.level] = (levelCounts[log.level] || 0) + 1;

            // Category counts
            categoryCounts[log.category] = (categoryCounts[log.category] || 0) + 1;

            // Action counts
            actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;

            // Source counts
            sourceCounts[log.source] = (sourceCounts[log.source] || 0) + 1;

            // Success/failure counts
            if (log.success) {
                successCounts.success++;
            } else {
                successCounts.failed++;
            }
        }

        return {
            totalLogs: logs.length,
            levelCounts,
            categoryCounts,
            actionCounts,
            sourceCounts,
            successCounts,
            dateRange: {
                start: filters.startDate || null,
                end: filters.endDate || null
            }
        };
    }

    /**
     * Get security statistics
     * @param {Object} filters - Optional filters
     * @returns {Object} Statistics
     */
    getSecurityStatistics(filters = {}) {
        let events = Array.from(this.securityEvents.values());

        // Apply filters
        if (filters.startDate) {
            events = events.filter(e => new Date(e.timestamp) >= new Date(filters.startDate));
        }

        if (filters.endDate) {
            events = events.filter(e => new Date(e.timestamp) <= new Date(filters.endDate));
        }

        // Calculate statistics
        const severityCounts = {};
        const typeCounts = {};
        const categoryCounts = {};
        const resolvedCounts = { resolved: 0, unresolved: 0 };

        for (const event of events) {
            // Severity counts
            severityCounts[event.severity] = (severityCounts[event.severity] || 0) + 1;

            // Type counts
            typeCounts[event.type] = (typeCounts[event.type] || 0) + 1;

            // Category counts
            categoryCounts[event.category] = (categoryCounts[event.category] || 0) + 1;

            // Resolved/unresolved counts
            if (event.resolved) {
                resolvedCounts.resolved++;
            } else {
                resolvedCounts.unresolved++;
            }
        }

        return {
            totalEvents: events.length,
            severityCounts,
            typeCounts,
            categoryCounts,
            resolvedCounts,
            dateRange: {
                start: filters.startDate || null,
                end: filters.endDate || null
            }
        };
    }

    /**
     * Get combined statistics
     * @param {Object} filters - Optional filters
     * @returns {Object} Combined statistics
     */
    getCombinedStatistics(filters = {}) {
        const auditStats = this.getAuditStatistics(filters);
        const securityStats = this.getSecurityStatistics(filters);

        return {
            audit: auditStats,
            security: securityStats,
            logLevel: this.currentLogLevel,
            maxLogSize: this.maxLogSize,
            logRetentionDays: this.logRetentionDays
        };
    }

    // ==================== LOG RETENTION ====================

    /**
     * Clean old logs
     * @returns {Promise<Object>} Clean result
     */
    async cleanOldLogs() {
        try {
            console.log('[AuditLogs] Cleaning old logs...');

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - this.logRetentionDays);

            // Clean audit logs
            for (const [logId, log] of this.auditLogs) {
                const logDate = new Date(log.timestamp);
                if (logDate < cutoffDate) {
                    this.auditLogs.delete(logId);
                }
            }

            // Clean security events
            for (const [eventId, event] of this.securityEvents) {
                const eventDate = new Date(event.timestamp);
                if (eventDate < cutoffDate) {
                    this.securityEvents.delete(eventId);
                }
            }

            // Save cleaned logs
            await this.saveAuditLogs();
            await this.saveSecurityEvents();

            const auditCleaned = Array.from(this.auditLogs.values()).length;
            const securityCleaned = Array.from(this.securityEvents.values()).length;

            console.log(`[AuditLogs] Cleaned logs: ${auditCleaned} audit, ${securityCleaned} security`);

            // Emit event
            this.emit('logsCleaned', {
                auditCleaned,
                securityCleaned,
                cutoffDate: cutoffDate.toISOString()
            });

            return { success: true, auditCleaned, securityCleaned };
        } catch (error) {
            console.error('[AuditLogs] Clean old logs error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Clear all logs
     * @returns {Promise<Object>} Clear result
     */
    async clearAllLogs() {
        try {
            console.log('[AuditLogs] Clearing all logs...');

            this.auditLogs.clear();
            this.securityEvents.clear();

            // Save cleared logs
            await this.saveAuditLogs();
            await this.saveSecurityEvents();

            console.log('[AuditLogs] All logs cleared');

            // Emit event
            this.emit('logsCleared');

            return { success: true };
        } catch (error) {
            console.error('[AuditLogs] Clear logs error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ==================== PERSISTENCE ====================

    /**
     * Save audit logs to file
     * @private
     */
    async saveAuditLogs() {
        try {
            const data = JSON.stringify(Array.from(this.auditLogs.entries()), null, 2);
            await fs.writeFile(this.logPath, data, 'utf-8');
        } catch (error) {
            console.error('[AuditLogs] Save audit logs error:', error);
        }
    }

    /**
     * Load audit logs from file
     * @private
     */
    async loadAuditLogs() {
        try {
            const data = await fs.readFile(this.logPath, 'utf-8');
            const entries = JSON.parse(data);
            this.auditLogs = new Map(entries);

            console.log(`[AuditLogs] Loaded ${this.auditLogs.size} audit logs`);
        } catch (error) {
            console.log('[AuditLogs] No saved audit logs found');
        }
    }

    /**
     * Save security events to file
     * @private
     */
    async saveSecurityEvents() {
        try {
            const data = JSON.stringify(Array.from(this.securityEvents.entries()), null, 2);
            await fs.writeFile(this.securityLogPath, data, 'utf-8');
        } catch (error) {
            console.error('[AuditLogs] Save security events error:', error);
        }
    }

    /**
     * Load security events from file
     * @private
     */
    async loadSecurityEvents() {
        try {
            const data = await fs.readFile(this.securityLogPath, 'utf-8');
            const entries = JSON.parse(data);
            this.securityEvents = new Map(entries);

            console.log(`[AuditLogs] Loaded ${this.securityEvents.size} security events`);
        } catch (error) {
            console.log('[AuditLogs] No saved security events found');
        }
    }

    // ==================== EXPORT/IMPORT ====================

    /**
     * Export logs
     * @param {Object} options - Export options
     * @returns {Object} Exported data
     */
    exportLogs(options = {}) {
        const auditLogs = Array.from(this.auditLogs.values());
        const securityEvents = Array.from(this.securityEvents.values());

        // Apply filters
        if (options.startDate) {
            const startDate = new Date(options.startDate);
            auditLogs = auditLogs.filter(l => new Date(l.timestamp) >= startDate);
            securityEvents = securityEvents.filter(e => new Date(e.timestamp) >= startDate);
        }

        if (options.endDate) {
            const endDate = new Date(options.endDate);
            auditLogs = auditLogs.filter(l => new Date(l.timestamp) <= endDate);
            securityEvents = securityEvents.filter(e => new Date(e.timestamp) <= endDate);
        }

        if (options.level) {
            auditLogs = auditLogs.filter(l => l.level === options.level);
        }

        if (options.severity) {
            securityEvents = securityEvents.filter(e => e.severity === options.severity);
        }

        return {
            auditLogs,
            securityEvents,
            exportedAt: new Date().toISOString(),
            options
        };
    }

    /**
     * Import logs
     * @param {Object} data - Data to import
     * @returns {Promise<Object>} Import result
     */
    async importLogs(data) {
        try {
            console.log('[AuditLogs] Importing logs...');

            // Import audit logs
            for (const log of data.auditLogs || []) {
                const logId = log.id || `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                this.auditLogs.set(logId, log);
            }

            // Import security events
            for (const event of data.securityEvents || []) {
                const eventId = event.id || `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                this.securityEvents.set(eventId, event);
            }

            // Save logs
            await this.saveAuditLogs();
            await this.saveSecurityEvents();

            console.log(`[AuditLogs] Imported ${data.auditLogs?.length || 0} audit logs, ${data.securityEvents?.length || 0} security events`);

            // Emit event
            this.emit('logsImported', {
                auditCount: data.auditLogs?.length || 0,
                securityCount: data.securityEvents?.length || 0
            });

            return { success: true };
        } catch (error) {
            console.error('[AuditLogs] Import logs error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ==================== CLEANUP ====================

    /**
     * Cleanup
     */
    async cleanup() {
        console.log('[AuditLogs] Cleaning up');

        // Clear caches
        this.auditLogs.clear();
        this.securityEvents.clear();
    }
}

// Export singleton instance
const auditLogsService = new AuditLogsService();
module.exports = auditLogsService;
