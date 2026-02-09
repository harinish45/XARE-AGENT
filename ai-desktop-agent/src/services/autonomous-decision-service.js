const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');

/**
 * Autonomous Decision Making Service - Make decisions with safety limits
 * Features: Decision engine, safety checks, approval workflows, autonomous execution
 */
class AutonomousDecisionService extends EventEmitter {
    constructor() {
        super();
        this.decisionHistory = []; // Decision history
        this.safetyRules = new Map(); // Safety rules
        this.approvalQueue = []; // Approval queue
        this.autonomousMode = false; // Autonomous mode status
        this.safetyLevel = 'medium'; // Safety level (low, medium, high)
        this.confidenceThreshold = 0.8; // Confidence threshold for autonomous decisions
        this.maxAutonomousActions = 100; // Max autonomous actions per session
        this.autonomousActionCount = 0; // Current autonomous action count
    }

    /**
     * Initialize autonomous decision service
     * @param {Object} config - Configuration
     */
    async initialize(config = {}) {
        try {
            this.safetyLevel = config.safetyLevel || 'medium';
            this.confidenceThreshold = config.confidenceThreshold || 0.8;
            this.maxAutonomousActions = config.maxAutonomousActions || 100;

            // Load default safety rules
            await this.loadDefaultSafetyRules();

            // Load saved data
            await this.loadDecisionHistory();

            console.log('[Autonomous] Autonomous Decision Service initialized');
            return { success: true };
        } catch (error) {
            console.error('[Autonomous] Initialization error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Enable autonomous mode
     */
    enableAutonomousMode() {
        if (this.autonomousMode) {
            console.log('[Autonomous] Already in autonomous mode');
            return { success: true };
        }

        console.log('[Autonomous] Enabling autonomous mode');
        this.autonomousMode = true;
        this.autonomousActionCount = 0;

        // Emit event
        this.emit('autonomousModeEnabled');

        return { success: true };
    }

    /**
     * Disable autonomous mode
     */
    disableAutonomousMode() {
        if (!this.autonomousMode) {
            console.log('[Autonomous] Already not in autonomous mode');
            return { success: true };
        }

        console.log('[Autonomous] Disabling autonomous mode');
        this.autonomousMode = false;

        // Emit event
        this.emit('autonomousModeDisabled');

        return { success: true };
    }

    // ==================== DECISION MAKING ====================

    /**
     * Make decision
     * @param {Object} decision - Decision data
     * @returns {Promise<Object>} Decision result
     */
    async makeDecision(decision) {
        const decisionId = `dec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const decisionData = {
            id: decisionId,
            type: decision.type || 'general',
            description: decision.description || '',
            context: decision.context || {},
            options: decision.options || [],
            confidence: decision.confidence || 0.5,
            priority: decision.priority || 'normal',
            timestamp: new Date().toISOString(),
            status: 'pending',
            result: null,
            safetyCheck: null
        };

        console.log(`[Autonomous] Making decision: ${decisionId}`);

        // Step 1: Safety check
        const safetyCheck = await this.performSafetyCheck(decisionData);
        decisionData.safetyCheck = safetyCheck;

        if (!safetyCheck.approved) {
            decisionData.status = 'rejected';
            decisionData.result = {
                action: 'none',
                reason: `Safety check failed: ${safetyCheck.reason}`
            };

            this.decisionHistory.push(decisionData);
            this.emit('decisionRejected', decisionData);

            return {
                success: false,
                decision: decisionData,
                reason: safetyCheck.reason
            };
        }

        // Step 2: Determine if autonomous execution is allowed
        const canExecuteAutonomously = this.canExecuteAutonomously(decisionData);

        if (canExecuteAutonomously) {
            // Execute autonomously
            const executionResult = await this.executeDecision(decisionData);
            decisionData.status = 'completed';
            decisionData.result = executionResult;
            decisionData.executionMode = 'autonomous';
            this.autonomousActionCount++;

            console.log(`[Autonomous] Decision executed autonomously: ${decisionId}`);

            // Emit event
            this.emit('decisionExecuted', decisionData);
        } else {
            // Request approval
            decisionData.status = 'awaiting-approval';
            decisionData.executionMode = 'manual';
            this.approvalQueue.push(decisionData);

            console.log(`[Autonomous] Decision awaiting approval: ${decisionId}`);

            // Emit event
            this.emit('decisionAwaitingApproval', decisionData);

            return {
                success: true,
                decision: decisionData,
                requiresApproval: true
            };
        }

        // Add to history
        this.decisionHistory.push(decisionData);

        // Save history
        await this.saveDecisionHistory();

        return {
            success: true,
            decision: decisionData
        };
    }

    /**
     * Check if decision can be executed autonomously
     * @private
     */
    canExecuteAutonomously(decision) {
        // Check if autonomous mode is enabled
        if (!this.autonomousMode) {
            return false;
        }

        // Check confidence threshold
        if (decision.confidence < this.confidenceThreshold) {
            return false;
        }

        // Check action count limit
        if (this.autonomousActionCount >= this.maxAutonomousActions) {
            return false;
        }

        // Check safety level
        if (this.safetyLevel === 'high') {
            // High safety: require approval for all actions
            return false;
        } else if (this.safetyLevel === 'medium') {
            // Medium safety: require approval for high-priority actions
            if (decision.priority === 'high' || decision.priority === 'critical') {
                return false;
            }
        }

        return true;
    }

    /**
     * Execute decision
     * @private
     */
    async executeDecision(decision) {
        console.log(`[Autonomous] Executing decision: ${decision.id}`);

        // This would integrate with actual automation services
        // For now, simulate execution
        const executionResult = {
            action: decision.options[0] || 'default',
            success: true,
            output: `Executed ${decision.description}`,
            timestamp: new Date().toISOString()
        };

        return executionResult;
    }

    // ==================== SAFETY CHECKS ====================

    /**
     * Perform safety check
     * @private
     */
    async performSafetyCheck(decision) {
        console.log(`[Autonomous] Performing safety check for: ${decision.id}`);

        const checks = [];

        // Check against safety rules
        for (const [ruleId, rule] of this.safetyRules) {
            if (!rule.enabled) {
                continue;
            }

            const checkResult = await this.checkRule(decision, rule);
            checks.push({
                ruleId,
                ruleName: rule.name,
                passed: checkResult.passed,
                reason: checkResult.reason
            });

            if (!checkResult.passed && rule.blocking) {
                return {
                    approved: false,
                    reason: `Blocked by rule: ${rule.name} - ${checkResult.reason}`,
                    checks
                };
            }
        }

        // Check if all checks passed
        const allPassed = checks.every(c => c.passed);

        return {
            approved: allPassed,
            reason: allPassed ? 'All safety checks passed' : 'Some safety checks failed',
            checks
        };
    }

    /**
     * Check individual rule
     * @private
     */
    async checkRule(decision, rule) {
        switch (rule.type) {
            case 'destructive':
                return this.checkDestructiveRule(decision, rule);
            case 'sensitive':
                return this.checkSensitiveRule(decision, rule);
            case 'network':
                return this.checkNetworkRule(decision, rule);
            case 'file':
                return this.checkFileRule(decision, rule);
            case 'system':
                return this.checkSystemRule(decision, rule);
            case 'cost':
                return this.checkCostRule(decision, rule);
            default:
                return { passed: true, reason: 'No check defined' };
        }
    }

    /**
     * Check destructive action rule
     * @private
     */
    checkDestructiveRule(decision, rule) {
        const destructiveActions = ['delete', 'remove', 'format', 'wipe'];
        const isDestructive = destructiveActions.some(action =>
            decision.description.toLowerCase().includes(action)
        );

        if (isDestructive && rule.blocking) {
            return {
                passed: false,
                reason: 'Destructive action detected'
            };
        }

        return {
            passed: true,
            reason: 'Not a destructive action'
        };
    }

    /**
     * Check sensitive data rule
     * @private
     */
    checkSensitiveRule(decision, rule) {
        const sensitiveKeywords = ['password', 'credit', 'ssn', 'token', 'key'];
        const hasSensitiveData = sensitiveKeywords.some(keyword =>
            decision.description.toLowerCase().includes(keyword)
        );

        if (hasSensitiveData && rule.blocking) {
            return {
                passed: false,
                reason: 'Sensitive data detected'
            };
        }

        return {
            passed: true,
            reason: 'No sensitive data detected'
        };
    }

    /**
     * Check network action rule
     * @private
     */
    checkNetworkRule(decision, rule) {
        const networkActions = ['upload', 'download', 'send', 'receive'];
        const isNetworkAction = networkActions.some(action =>
            decision.description.toLowerCase().includes(action)
        );

        if (isNetworkAction && rule.blocking) {
            return {
                passed: false,
                reason: 'Network action detected'
            };
        }

        return {
            passed: true,
            reason: 'Not a network action'
        };
    }

    /**
     * Check file operation rule
     * @private
     */
    checkFileRule(decision, rule) {
        const fileOperations = ['delete', 'move', 'rename', 'copy'];
        const isFileOperation = fileOperations.some(action =>
            decision.description.toLowerCase().includes(action)
        );

        if (isFileOperation && rule.blocking) {
            return {
                passed: false,
                reason: 'File operation detected'
            };
        }

        return {
            passed: true,
            reason: 'Not a file operation'
        };
    }

    /**
     * Check system operation rule
     * @private
     */
    checkSystemRule(decision, rule) {
        const systemOperations = ['shutdown', 'restart', 'install', 'uninstall'];
        const isSystemOperation = systemOperations.some(action =>
            decision.description.toLowerCase().includes(action)
        );

        if (isSystemOperation && rule.blocking) {
            return {
                passed: false,
                reason: 'System operation detected'
            };
        }

        return {
            passed: true,
            reason: 'Not a system operation'
        };
    }

    /**
     * Check cost-related rule
     * @private
     */
    checkCostRule(decision, rule) {
        const costKeywords = ['purchase', 'buy', 'pay', 'subscribe'];
        const hasCost = costKeywords.some(keyword =>
            decision.description.toLowerCase().includes(keyword)
        );

        if (hasCost && rule.blocking) {
            return {
                passed: false,
                reason: 'Cost-related action detected'
            };
        }

        return {
            passed: true,
            reason: 'Not a cost-related action'
        };
    }

    // ==================== SAFETY RULES ====================

    /**
     * Load default safety rules
     * @private
     */
    async loadDefaultSafetyRules() {
        const defaultRules = [
            {
                id: 'destructive-block',
                name: 'Block Destructive Actions',
                type: 'destructive',
                enabled: true,
                blocking: true,
                description: 'Block destructive actions like delete, format, wipe'
            },
            {
                id: 'sensitive-block',
                name: 'Block Sensitive Data',
                type: 'sensitive',
                enabled: true,
                blocking: true,
                description: 'Block actions involving sensitive data like passwords, credit cards'
            },
            {
                id: 'network-block',
                name: 'Block Network Actions',
                type: 'network',
                enabled: true,
                blocking: true,
                description: 'Block network actions like upload, download'
            },
            {
                id: 'file-block',
                name: 'Block File Operations',
                type: 'file',
                enabled: true,
                blocking: true,
                description: 'Block file operations like delete, move, rename'
            },
            {
                id: 'system-block',
                name: 'Block System Operations',
                type: 'system',
                enabled: true,
                blocking: true,
                description: 'Block system operations like shutdown, restart, install'
            },
            {
                id: 'cost-block',
                name: 'Block Cost Actions',
                type: 'cost',
                enabled: true,
                blocking: true,
                description: 'Block cost-related actions like purchase, pay, subscribe'
            },
            {
                id: 'destructive-warn',
                name: 'Warn Destructive Actions',
                type: 'destructive',
                enabled: true,
                blocking: false,
                description: 'Warn about destructive actions'
            },
            {
                id: 'sensitive-warn',
                name: 'Warn Sensitive Data',
                type: 'sensitive',
                enabled: true,
                blocking: false,
                description: 'Warn about sensitive data'
            }
        ];

        for (const rule of defaultRules) {
            this.safetyRules.set(rule.id, rule);
        }

        console.log(`[Autonomous] Loaded ${defaultRules.length} safety rules`);
    }

    /**
     * Add safety rule
     * @param {Object} rule - Rule configuration
     * @returns {string} Rule ID
     */
    addSafetyRule(rule) {
        const ruleId = rule.id || `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const ruleConfig = {
            id: ruleId,
            name: rule.name || 'Unnamed Rule',
            type: rule.type || 'general',
            enabled: rule.enabled !== false,
            blocking: rule.blocking || false,
            description: rule.description || '',
            createdAt: new Date().toISOString()
        };

        this.safetyRules.set(ruleId, ruleConfig);
        console.log(`[Autonomous] Safety rule added: ${ruleId}`);

        // Emit event
        this.emit('safetyRuleAdded', ruleConfig);

        return ruleId;
    }

    /**
     * Update safety rule
     * @param {string} ruleId - Rule ID
     * @param {Object} updates - Updates to apply
     */
    updateSafetyRule(ruleId, updates) {
        const rule = this.safetyRules.get(ruleId);
        if (rule) {
            const updatedRule = { ...rule, ...updates };
            this.safetyRules.set(ruleId, updatedRule);
            console.log(`[Autonomous] Safety rule updated: ${ruleId}`);
        }
    }

    /**
     * Delete safety rule
     * @param {string} ruleId - Rule ID
     */
    deleteSafetyRule(ruleId) {
        this.safetyRules.delete(ruleId);
        console.log(`[Autonomous] Safety rule deleted: ${ruleId}`);
    }

    /**
     * Get safety rules
     * @param {Object} filters - Optional filters
     * @returns {Array} Rules array
     */
    getSafetyRules(filters = {}) {
        let rules = Array.from(this.safetyRules.values());

        if (filters.type) {
            rules = rules.filter(r => r.type === filters.type);
        }

        if (filters.enabled !== undefined) {
            rules = rules.filter(r => r.enabled === filters.enabled);
        }

        if (filters.blocking !== undefined) {
            rules = rules.filter(r => r.blocking === filters.blocking);
        }

        return rules;
    }

    /**
     * Enable safety rule
     * @param {string} ruleId - Rule ID
     */
    enableSafetyRule(ruleId) {
        const rule = this.safetyRules.get(ruleId);
        if (rule) {
            rule.enabled = true;
            console.log(`[Autonomous] Safety rule enabled: ${ruleId}`);
        }
    }

    /**
     * Disable safety rule
     * @param {string} ruleId - Rule ID
     */
    disableSafetyRule(ruleId) {
        const rule = this.safetyRules.get(ruleId);
        if (rule) {
            rule.enabled = false;
            console.log(`[Autonomous] Safety rule disabled: ${ruleId}`);
        }
    }

    // ==================== APPROVAL WORKFLOW ====================

    /**
     * Get approval queue
     * @returns {Array} Approval queue
     */
    getApprovalQueue() {
        return this.approvalQueue;
    }

    /**
     * Approve decision
     * @param {string} decisionId - Decision ID
     */
    async approveDecision(decisionId) {
        const decision = this.approvalQueue.find(d => d.id === decisionId);
        if (!decision) {
            throw new Error(`Decision not found: ${decisionId}`);
        }

        console.log(`[Autonomous] Approving decision: ${decisionId}`);

        // Execute decision
        const executionResult = await this.executeDecision(decision);
        decision.status = 'completed';
        decision.result = executionResult;
        decision.approvedAt = new Date().toISOString();

        // Remove from queue
        const index = this.approvalQueue.findIndex(d => d.id === decisionId);
        if (index !== -1) {
            this.approvalQueue.splice(index, 1);
        }

        // Add to history
        this.decisionHistory.push(decision);

        // Save history
        await this.saveDecisionHistory();

        // Emit event
        this.emit('decisionApproved', decision);

        return {
            success: true,
            decision
        };
    }

    /**
     * Reject decision
     * @param {string} decisionId - Decision ID
     * @param {string} reason - Rejection reason
     */
    rejectDecision(decisionId, reason) {
        const decision = this.approvalQueue.find(d => d.id === decisionId);
        if (!decision) {
            throw new Error(`Decision not found: ${decisionId}`);
        }

        console.log(`[Autonomous] Rejecting decision: ${decisionId}`);

        decision.status = 'rejected';
        decision.rejectedAt = new Date().toISOString();
        decision.rejectionReason = reason;

        // Remove from queue
        const index = this.approvalQueue.findIndex(d => d.id === decisionId);
        if (index !== -1) {
            this.approvalQueue.splice(index, 1);
        }

        // Add to history
        this.decisionHistory.push(decision);

        // Save history
        this.saveDecisionHistory();

        // Emit event
        this.emit('decisionRejected', decision);

        return {
            success: true,
            decision
        };
    }

    // ==================== CONFIGURATION ====================

    /**
     * Set safety level
     * @param {string} level - Safety level (low, medium, high)
     */
    setSafetyLevel(level) {
        const validLevels = ['low', 'medium', 'high'];
        if (!validLevels.includes(level)) {
            throw new Error(`Invalid safety level: ${level}`);
        }

        this.safetyLevel = level;
        console.log(`[Autonomous] Safety level set to: ${level}`);

        // Emit event
        this.emit('safetyLevelChanged', level);
    }

    /**
     * Set confidence threshold
     * @param {number} threshold - Confidence threshold (0-1)
     */
    setConfidenceThreshold(threshold) {
        if (threshold < 0 || threshold > 1) {
            throw new Error('Confidence threshold must be between 0 and 1');
        }

        this.confidenceThreshold = threshold;
        console.log(`[Autonomous] Confidence threshold set to: ${threshold}`);

        // Emit event
        this.emit('confidenceThresholdChanged', threshold);
    }

    /**
     * Set max autonomous actions
     * @param {number} max - Max actions per session
     */
    setMaxAutonomousActions(max) {
        this.maxAutonomousActions = max;
        console.log(`[Autonomous] Max autonomous actions set to: ${max}`);
    }

    /**
     * Get configuration
     * @returns {Object} Configuration
     */
    getConfiguration() {
        return {
            autonomousMode: this.autonomousMode,
            safetyLevel: this.safetyLevel,
            confidenceThreshold: this.confidenceThreshold,
            maxAutonomousActions: this.maxAutonomousActions,
            autonomousActionCount: this.autonomousActionCount
        };
    }

    // ==================== ANALYTICS ====================

    /**
     * Get decision history
     * @param {Object} filters - Optional filters
     * @returns {Array} History array
     */
    getDecisionHistory(filters = {}) {
        let history = this.decisionHistory;

        if (filters.status) {
            history = history.filter(d => d.status === filters.status);
        }

        if (filters.type) {
            history = history.filter(d => d.type === filters.type);
        }

        if (filters.executionMode) {
            history = history.filter(d => d.executionMode === filters.executionMode);
        }

        if (filters.startDate) {
            history = history.filter(d => new Date(d.timestamp) >= new Date(filters.startDate));
        }

        if (filters.endDate) {
            history = history.filter(d => new Date(d.timestamp) <= new Date(filters.endDate));
        }

        if (filters.limit) {
            history = history.slice(-filters.limit);
        }

        // Sort by timestamp (descending)
        history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        return history;
    }

    /**
     * Get statistics
     * @returns {Object} Statistics
     */
    getStatistics() {
        const history = this.decisionHistory;

        return {
            totalDecisions: history.length,
            autonomousDecisions: history.filter(d => d.executionMode === 'autonomous').length,
            manualDecisions: history.filter(d => d.executionMode === 'manual').length,
            approvedDecisions: history.filter(d => d.status === 'completed').length,
            rejectedDecisions: history.filter(d => d.status === 'rejected').length,
            pendingDecisions: history.filter(d => d.status === 'awaiting-approval').length,
            approvalQueueSize: this.approvalQueue.length,
            safetyRulesCount: this.safetyRules.size,
            configuration: this.getConfiguration()
        };
    }

    // ==================== PERSISTENCE ====================

    /**
     * Save decision history to file
     * @private
     */
    async saveDecisionHistory() {
        try {
            const data = JSON.stringify(this.decisionHistory, null, 2);
            await fs.writeFile(
                path.join(__dirname, '../../data/autonomous-decisions.json'),
                data,
                'utf-8'
            );

            console.log('[Autonomous] Decision history saved');
        } catch (error) {
            console.error('[Autonomous] Save decision history error:', error);
        }
    }

    /**
     * Load decision history from file
     * @private
     */
    async loadDecisionHistory() {
        try {
            const data = await fs.readFile(
                path.join(__dirname, '../../data/autonomous-decisions.json'),
                'utf-8'
            );
            const history = JSON.parse(data);
            this.decisionHistory = history;

            console.log(`[Autonomous] Loaded ${this.decisionHistory.length} decisions`);
        } catch (error) {
            console.log('[Autonomous] No saved decision history found');
        }
    }

    /**
     * Export data
     * @returns {Object} Exported data
     */
    exportData() {
        return {
            decisionHistory: this.decisionHistory,
            safetyRules: Array.from(this.safetyRules.entries()),
            approvalQueue: this.approvalQueue,
            configuration: this.getConfiguration(),
            exportedAt: new Date().toISOString()
        };
    }

    /**
     * Import data
     * @param {Object} data - Data to import
     */
    importData(data) {
        try {
            // Import decision history
            this.decisionHistory = data.decisionHistory || [];

            // Import safety rules
            this.safetyRules = new Map(data.safetyRules || []);

            // Import approval queue
            this.approvalQueue = data.approvalQueue || [];

            // Import configuration
            if (data.configuration) {
                this.autonomousMode = data.configuration.autonomousMode || false;
                this.safetyLevel = data.configuration.safetyLevel || 'medium';
                this.confidenceThreshold = data.configuration.confidenceThreshold || 0.8;
                this.maxAutonomousActions = data.configuration.maxAutonomousActions || 100;
                this.autonomousActionCount = data.configuration.autonomousActionCount || 0;
            }

            console.log('[Autonomous] Data imported successfully');

            // Emit event
            this.emit('dataImported', {
                decisionsCount: this.decisionHistory.length,
                rulesCount: this.safetyRules.size
            });
        } catch (error) {
            console.error('[Autonomous] Import data error:', error);
        }
    }

    // ==================== CLEANUP ====================

    /**
     * Cleanup
     */
    async cleanup() {
        console.log('[Autonomous] Cleaning up');

        // Disable autonomous mode
        this.disableAutonomousMode();

        // Save data
        await this.saveDecisionHistory();

        // Clear caches
        this.decisionHistory = [];
        this.approvalQueue = [];
    }
}

// Export singleton instance
const autonomousDecisionService = new AutonomousDecisionService();
module.exports = autonomousDecisionService;
