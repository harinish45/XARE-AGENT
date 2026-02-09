const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');

/**
 * Reinforcement Learning Service - Learn from outcomes
 * Features: Experience replay, reward tracking, policy optimization, adaptive behavior
 */
class ReinforcementLearningService extends EventEmitter {
    constructor() {
        super();
        this.experienceBuffer = []; // Experience replay buffer
        this.policies = new Map(); // Learned policies
        this.rewards = new Map(); // Reward tracking
        this.stateHistory = []; // State history
        this.actionHistory = []; // Action history
        this.maxBufferSize = 10000; // Max experience buffer size
        this.learningRate = 0.01; // Learning rate
        this.discountFactor = 0.95; // Discount factor
        this.explorationRate = 0.1; // Exploration rate
        this.isLearning = false;
    }

    /**
     * Initialize reinforcement learning service
     * @param {Object} config - Configuration
     */
    async initialize(config = {}) {
        try {
            this.maxBufferSize = config.maxBufferSize || 10000;
            this.learningRate = config.learningRate || 0.01;
            this.discountFactor = config.discountFactor || 0.95;
            this.explorationRate = config.explorationRate || 0.1;

            // Load saved data
            await this.loadPolicies();
            await this.loadExperienceBuffer();

            console.log('[RL] Reinforcement Learning Service initialized');
            return { success: true };
        } catch (error) {
            console.error('[RL] Initialization error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Start learning
     */
    startLearning() {
        if (this.isLearning) {
            console.log('[RL] Already learning');
            return { success: true };
        }

        console.log('[RL] Starting learning');
        this.isLearning = true;

        // Emit event
        this.emit('learningStarted');

        return { success: true };
    }

    /**
     * Stop learning
     */
    stopLearning() {
        if (!this.isLearning) {
            console.log('[RL] Already stopped');
            return { success: true };
        }

        console.log('[RL] Stopping learning');
        this.isLearning = false;

        // Save data
        this.savePolicies();
        this.saveExperienceBuffer();

        // Emit event
        this.emit('learningStopped');

        return { success: true };
    }

    // ==================== EXPERIENCE MANAGEMENT ====================

    /**
     * Record experience
     * @param {Object} experience - Experience data
     */
    recordExperience(experience) {
        const experienceData = {
            id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            state: experience.state || {},
            action: experience.action || null,
            reward: experience.reward || 0,
            nextState: experience.nextState || {},
            done: experience.done || false,
            timestamp: new Date().toISOString(),
            metadata: experience.metadata || {}
        };

        // Add to buffer
        this.experienceBuffer.push(experienceData);

        // Trim buffer if too large
        if (this.experienceBuffer.length > this.maxBufferSize) {
            this.experienceBuffer.shift();
        }

        // Add to history
        this.stateHistory.push(experienceData.state);
        this.actionHistory.push(experienceData.action);

        // Trim history
        if (this.stateHistory.length > 1000) {
            this.stateHistory.shift();
            this.actionHistory.shift();
        }

        console.log(`[RL] Experience recorded: ${experienceData.id}`);

        // Emit event
        this.emit('experienceRecorded', experienceData);

        // Learn from experience
        if (this.isLearning) {
            this.learnFromExperience(experienceData);
        }
    }

    /**
     * Learn from experience
     * @private
     */
    learnFromExperience(experience) {
        const stateKey = this.getStateKey(experience.state);
        const actionKey = this.getActionKey(experience.action);

        // Get or create Q-value
        if (!this.policies.has(stateKey)) {
            this.policies.set(stateKey, new Map());
        }

        const qValues = this.policies.get(stateKey);
        const currentQ = qValues.get(actionKey) || 0;

        // Calculate new Q-value using Q-learning
        const maxNextQ = this.getMaxQValue(experience.nextState);
        const newQ = currentQ + this.learningRate * (
            experience.reward +
            this.discountFactor * maxNextQ -
            currentQ
        );

        // Update Q-value
        qValues.set(actionKey, newQ);

        // Track reward
        const totalReward = this.rewards.get(stateKey) || 0;
        this.rewards.set(stateKey, totalReward + experience.reward);

        console.log(`[RL] Learned: state=${stateKey}, action=${actionKey}, Q=${newQ.toFixed(4)}`);

        // Emit event
        this.emit('policyUpdated', {
            stateKey,
            actionKey,
            qValue: newQ
        });
    }

    /**
     * Get state key
     * @private
     */
    getStateKey(state) {
        // Convert state to string key
        return JSON.stringify(state);
    }

    /**
     * Get action key
     * @private
     */
    getActionKey(action) {
        // Convert action to string key
        return JSON.stringify(action);
    }

    /**
     * Get max Q-value for state
     * @private
     */
    getMaxQValue(state) {
        const stateKey = this.getStateKey(state);
        const qValues = this.policies.get(stateKey);

        if (!qValues || qValues.size === 0) {
            return 0;
        }

        return Math.max(...qValues.values());
    }

    /**
     * Get best action for state
     * @param {Object} state - Current state
     * @returns {Object|null} Best action or null
     */
    getBestAction(state) {
        const stateKey = this.getStateKey(state);
        const qValues = this.policies.get(stateKey);

        if (!qValues || qValues.size === 0) {
            return null;
        }

        // Find action with max Q-value
        let bestAction = null;
        let maxQ = -Infinity;

        for (const [actionKey, qValue] of qValues) {
            if (qValue > maxQ) {
                maxQ = qValue;
                bestAction = JSON.parse(actionKey);
            }
        }

        return bestAction;
    }

    /**
     * Select action using epsilon-greedy policy
     * @param {Object} state - Current state
     * @returns {Object} Selected action
     */
    selectAction(state, availableActions = []) {
        // Explore with probability epsilon
        if (Math.random() < this.explorationRate) {
            // Random exploration
            const randomAction = availableActions.length > 0
                ? availableActions[Math.floor(Math.random() * availableActions.length)]
                : { type: 'random' };

            console.log('[RL] Exploring: random action');
            return randomAction;
        }

        // Exploit best known action
        const bestAction = this.getBestAction(state);
        if (bestAction) {
            console.log('[RL] Exploiting: best action');
            return bestAction;
        }

        // Fallback to random if no policy
        const randomAction = availableActions.length > 0
            ? availableActions[Math.floor(Math.random() * availableActions.length)]
            : { type: 'random' };

        console.log('[RL] No policy, using random action');
        return randomAction;
    }

    // ==================== POLICY MANAGEMENT ====================

    /**
     * Get policy for state
     * @param {Object} state - State
     * @returns {Object} Policy data
     */
    getPolicy(state) {
        const stateKey = this.getStateKey(state);
        const qValues = this.policies.get(stateKey);

        if (!qValues || qValues.size === 0) {
            return {
                stateKey,
                hasPolicy: false,
                actions: []
            };
        }

        const actions = Array.from(qValues.entries()).map(([actionKey, qValue]) => ({
            action: JSON.parse(actionKey),
            qValue
        }));

        // Sort by Q-value (descending)
        actions.sort((a, b) => b.qValue - a.qValue);

        return {
            stateKey,
            hasPolicy: true,
            actions,
            bestAction: actions[0].action,
            bestQValue: actions[0].qValue
        };
    }

    /**
     * Get all policies
     * @returns {Array} Policies array
     */
    getAllPolicies() {
        const policies = [];

        for (const [stateKey, qValues] of this.policies) {
            const actions = Array.from(qValues.entries()).map(([actionKey, qValue]) => ({
                action: JSON.parse(actionKey),
                qValue
            }));

            // Sort by Q-value (descending)
            actions.sort((a, b) => b.qValue - a.qValue);

            policies.push({
                stateKey,
                state: JSON.parse(stateKey),
                actions,
                bestAction: actions[0].action,
                bestQValue: actions[0].qValue
            });
        }

        return policies;
    }

    /**
     * Clear policy for state
     * @param {Object} state - State to clear
     */
    clearPolicy(state) {
        const stateKey = this.getStateKey(state);
        this.policies.delete(stateKey);
        this.rewards.delete(stateKey);

        console.log(`[RL] Policy cleared: ${stateKey}`);
    }

    /**
     * Clear all policies
     */
    clearAllPolicies() {
        this.policies.clear();
        this.rewards.clear();

        console.log('[RL] All policies cleared');
    }

    // ==================== REWARD TRACKING ====================

    /**
     * Get reward statistics
     * @returns {Object} Reward statistics
     */
    getRewardStatistics() {
        const rewards = Array.from(this.rewards.values());

        if (rewards.length === 0) {
            return {
                total: 0,
                average: 0,
                min: 0,
                max: 0,
                count: 0
            };
        }

        return {
            total: rewards.reduce((a, b) => a + b, 0),
            average: rewards.reduce((a, b) => a + b, 0) / rewards.length,
            min: Math.min(...rewards),
            max: Math.max(...rewards),
            count: rewards.length
        };
    }

    /**
     * Get reward history
     * @param {number} limit - Limit number of results
     * @returns {Array} Reward history
     */
    getRewardHistory(limit = 100) {
        const experiences = this.experienceBuffer.slice(-limit);
        return experiences.map(exp => ({
            id: exp.id,
            reward: exp.reward,
            timestamp: exp.timestamp
        }));
    }

    // ==================== EXPERIENCE REPLAY ====================

    /**
     * Sample experiences from buffer
     * @param {number} batchSize - Batch size
     * @returns {Array} Sampled experiences
     */
    sampleExperiences(batchSize = 32) {
        if (this.experienceBuffer.length === 0) {
            return [];
        }

        // Random sampling
        const sampled = [];
        const indices = new Set();

        while (sampled.length < batchSize && sampled.length < this.experienceBuffer.length) {
            const index = Math.floor(Math.random() * this.experienceBuffer.length);

            if (!indices.has(index)) {
                indices.add(index);
                sampled.push(this.experienceBuffer[index]);
            }
        }

        return sampled;
    }

    /**
     * Train on batch of experiences
     * @param {number} batchSize - Batch size
     */
    trainOnBatch(batchSize = 32) {
        const experiences = this.sampleExperiences(batchSize);

        console.log(`[RL] Training on batch of ${experiences.length} experiences`);

        for (const experience of experiences) {
            this.learnFromExperience(experience);
        }

        // Emit event
        this.emit('batchTrainingCompleted', {
            batchSize: experiences.length
        });
    }

    // ==================== ADAPTIVE BEHAVIOR ====================

    /**
     * Adjust learning rate
     * @param {number} newRate - New learning rate
     */
    setLearningRate(newRate) {
        this.learningRate = newRate;
        console.log(`[RL] Learning rate set to: ${newRate}`);
    }

    /**
     * Adjust exploration rate
     * @param {number} newRate - New exploration rate
     */
    setExplorationRate(newRate) {
        this.explorationRate = newRate;
        console.log(`[RL] Exploration rate set to: ${newRate}`);
    }

    /**
     * Decay exploration rate
     * @param {number} decayFactor - Decay factor (0-1)
     */
    decayExplorationRate(decayFactor = 0.995) {
        this.explorationRate *= decayFactor;
        console.log(`[RL] Exploration rate decayed to: ${this.explorationRate.toFixed(4)}`);

        // Emit event
        this.emit('explorationRateDecayed', {
            newRate: this.explorationRate
        });
    }

    /**
     * Get learning statistics
     * @returns {Object} Learning statistics
     */
    getLearningStatistics() {
        const rewardStats = this.getRewardStatistics();

        return {
            isLearning: this.isLearning,
            learningRate: this.learningRate,
            explorationRate: this.explorationRate,
            discountFactor: this.discountFactor,
            experienceBufferSize: this.experienceBuffer.length,
            policyCount: this.policies.size,
            stateHistorySize: this.stateHistory.length,
            actionHistorySize: this.actionHistory.length,
            rewardStatistics: rewardStats
        };
    }

    // ==================== PERSISTENCE ====================

    /**
     * Save policies to file
     * @private
     */
    async savePolicies() {
        try {
            const policies = {};
            for (const [stateKey, qValues] of this.policies) {
                policies[stateKey] = Array.from(qValues.entries());
            }

            const data = JSON.stringify({
                policies,
                rewards: Array.from(this.rewards.entries()),
                config: {
                    learningRate: this.learningRate,
                    explorationRate: this.explorationRate,
                    discountFactor: this.discountFactor
                }
            }, null, 2);

            await fs.writeFile(
                path.join(__dirname, '../../data/rl-policies.json'),
                data,
                'utf-8'
            );

            console.log('[RL] Policies saved');
        } catch (error) {
            console.error('[RL] Save policies error:', error);
        }
    }

    /**
     * Load policies from file
     * @private
     */
    async loadPolicies() {
        try {
            const data = await fs.readFile(
                path.join(__dirname, '../../data/rl-policies.json'),
                'utf-8'
            );
            const parsed = JSON.parse(data);

            // Load policies
            for (const [stateKey, qValues] of Object.entries(parsed.policies)) {
                this.policies.set(stateKey, new Map(qValues));
            }

            // Load rewards
            this.rewards = new Map(parsed.rewards);

            // Load config
            if (parsed.config) {
                this.learningRate = parsed.config.learningRate || this.learningRate;
                this.explorationRate = parsed.config.explorationRate || this.explorationRate;
                this.discountFactor = parsed.config.discountFactor || this.discountFactor;
            }

            console.log(`[RL] Loaded ${this.policies.size} policies`);
        } catch (error) {
            console.log('[RL] No saved policies found');
        }
    }

    /**
     * Save experience buffer to file
     * @private
     */
    async saveExperienceBuffer() {
        try {
            const data = JSON.stringify(this.experienceBuffer, null, 2);
            await fs.writeFile(
                path.join(__dirname, '../../data/rl-experience-buffer.json'),
                data,
                'utf-8'
            );

            console.log('[RL] Experience buffer saved');
        } catch (error) {
            console.error('[RL] Save experience buffer error:', error);
        }
    }

    /**
     * Load experience buffer from file
     * @private
     */
    async loadExperienceBuffer() {
        try {
            const data = await fs.readFile(
                path.join(__dirname, '../../data/rl-experience-buffer.json'),
                'utf-8'
            );
            const experiences = JSON.parse(data);

            this.experienceBuffer = experiences;

            console.log(`[RL] Loaded ${this.experienceBuffer.length} experiences`);
        } catch (error) {
            console.log('[RL] No saved experience buffer found');
        }
    }

    /**
     * Export policies
     * @returns {Object} Policies data
     */
    exportPolicies() {
        const policies = {};
        for (const [stateKey, qValues] of this.policies) {
            policies[stateKey] = Array.from(qValues.entries());
        }

        return {
            policies,
            rewards: Array.from(this.rewards.entries()),
            config: {
                learningRate: this.learningRate,
                explorationRate: this.explorationRate,
                discountFactor: this.discountFactor
            },
            exportedAt: new Date().toISOString()
        };
    }

    /**
     * Import policies
     * @param {Object} data - Policies data
     */
    importPolicies(data) {
        try {
            // Import policies
            for (const [stateKey, qValues] of Object.entries(data.policies)) {
                this.policies.set(stateKey, new Map(qValues));
            }

            // Import rewards
            this.rewards = new Map(data.rewards);

            // Import config
            if (data.config) {
                this.learningRate = data.config.learningRate || this.learningRate;
                this.explorationRate = data.config.explorationRate || this.explorationRate;
                this.discountFactor = data.config.discountFactor || this.discountFactor;
            }

            console.log(`[RL] Imported ${this.policies.size} policies`);

            // Emit event
            this.emit('policiesImported', {
                count: this.policies.size
            });
        } catch (error) {
            console.error('[RL] Import policies error:', error);
        }
    }

    // ==================== CLEANUP ====================

    /**
     * Cleanup
     */
    async cleanup() {
        console.log('[RL] Cleaning up');

        // Stop learning
        this.stopLearning();

        // Save data
        await this.savePolicies();
        await this.saveExperienceBuffer();

        // Clear caches
        this.experienceBuffer = [];
        this.policies.clear();
        this.rewards.clear();
        this.stateHistory = [];
        this.actionHistory = [];
    }
}

// Export singleton instance
const reinforcementLearningService = new ReinforcementLearningService();
module.exports = reinforcementLearningService;
