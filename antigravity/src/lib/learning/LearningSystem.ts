// Learning System - Handles agent training, feedback, and improvement
// Collects feedback, manages skill library, and enables continuous learning

export interface Feedback {
    id: string;
    agentId: string;
    action: string;
    type: 'rating' | 'approval' | 'correction' | 'rejection';
    rating?: number; // 1-5
    approved?: boolean;
    correction?: string;
    comment?: string;
    context: {
        input: string;
        output: any;
        timestamp: Date;
    };
    userId?: string;
    createdAt: Date;
}

export interface Skill {
    id: string;
    name: string;
    description: string;
    category: string;
    examples: SkillExample[];
    parameters: SkillParameter[];
    successRate: number;
    usageCount: number;
    lastUsed?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface SkillExample {
    input: string;
    output: any;
    explanation?: string;
}

export interface SkillParameter {
    name: string;
    type: string;
    description: string;
    required: boolean;
    default?: any;
}

export interface TrainingSession {
    id: string;
    agentId: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    type: 'fine-tune' | 'few-shot' | 'reinforcement';
    config: TrainingConfig;
    progress: number;
    metrics?: TrainingMetrics;
    startedAt?: Date;
    completedAt?: Date;
    error?: string;
}

export interface TrainingConfig {
    model: string;
    baseModel?: string;
    epochs?: number;
    batchSize?: number;
    learningRate?: number;
    examples?: SkillExample[];
}

export interface TrainingMetrics {
    loss: number[];
    accuracy: number[];
    epochs: number;
    duration: number;
}

export interface LearningConfig {
    feedbackEnabled: boolean;
    autoImprove: boolean;
    minFeedbackForImprovement: number;
    improvementThreshold: number;
    maxExamples: number;
}

export class LearningSystem {
    private config: LearningConfig;
    private feedback: Map<string, Feedback[]> = new Map();
    private skills: Map<string, Skill> = new Map();
    private trainingSessions: Map<string, TrainingSession> = new Map();

    // Default skills library
    private defaultSkills: Skill[] = [
        {
            id: 'email-compose',
            name: 'Compose Email',
            description: 'Compose professional emails based on context',
            category: 'communication',
            examples: [
                { input: 'Send a meeting request to John', output: { subject: 'Meeting Request', body: '...' } },
                { input: 'Write a follow-up email', output: { subject: 'Following Up', body: '...' } },
            ],
            parameters: [
                { name: 'recipient', type: 'string', description: 'Email recipient', required: true },
                { name: 'purpose', type: 'string', description: 'Email purpose', required: true },
                { name: 'tone', type: 'string', description: 'Email tone', required: false, default: 'professional' },
            ],
            successRate: 0.95,
            usageCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            id: 'data-analyze',
            name: 'Analyze Data',
            description: 'Analyze datasets and generate insights',
            category: 'analysis',
            examples: [
                { input: 'Analyze sales data for trends', output: { trends: [], insights: [] } },
                { input: 'Find correlations in the data', output: { correlations: [] } },
            ],
            parameters: [
                { name: 'dataset', type: 'string', description: 'Dataset to analyze', required: true },
                { name: 'analysisType', type: 'string', description: 'Type of analysis', required: false },
            ],
            successRate: 0.92,
            usageCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            id: 'code-generate',
            name: 'Generate Code',
            description: 'Generate code from natural language descriptions',
            category: 'development',
            examples: [
                { input: 'Create a React component for a button', output: { code: '...', language: 'typescript' } },
                { input: 'Write a Python function to sort a list', output: { code: '...', language: 'python' } },
            ],
            parameters: [
                { name: 'description', type: 'string', description: 'Code description', required: true },
                { name: 'language', type: 'string', description: 'Programming language', required: false, default: 'typescript' },
            ],
            successRate: 0.88,
            usageCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            id: 'schedule-meeting',
            name: 'Schedule Meeting',
            description: 'Schedule meetings and manage calendar events',
            category: 'productivity',
            examples: [
                { input: 'Schedule a team meeting tomorrow at 2pm', output: { eventId: '...', time: '...' } },
                { input: 'Find a time slot for a 30-minute call', output: { slots: [] } },
            ],
            parameters: [
                { name: 'date', type: 'string', description: 'Meeting date', required: true },
                { name: 'duration', type: 'number', description: 'Duration in minutes', required: false, default: 30 },
                { name: 'attendees', type: 'array', description: 'List of attendees', required: false },
            ],
            successRate: 0.97,
            usageCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ];

    constructor(config?: Partial<LearningConfig>) {
        this.config = {
            feedbackEnabled: config?.feedbackEnabled ?? true,
            autoImprove: config?.autoImprove ?? true,
            minFeedbackForImprovement: config?.minFeedbackForImprovement || 10,
            improvementThreshold: config?.improvementThreshold || 0.7,
            maxExamples: config?.maxExamples || 100,
            ...config,
        };

        // Initialize default skills
        this.defaultSkills.forEach(skill => {
            this.skills.set(skill.id, skill);
        });
    }

    // Record feedback
    recordFeedback(feedback: Omit<Feedback, 'id' | 'createdAt'>): Feedback {
        const id = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const newFeedback: Feedback = {
            ...feedback,
            id,
            createdAt: new Date(),
        };

        // Store by agent
        const agentFeedback = this.feedback.get(feedback.agentId) || [];
        agentFeedback.push(newFeedback);
        this.feedback.set(feedback.agentId, agentFeedback);

        // Update skill if applicable
        this.updateSkillFromFeedback(newFeedback);

        // Check for improvement opportunity
        if (this.config.autoImprove) {
            this.checkForImprovement(feedback.agentId);
        }

        return newFeedback;
    }

    // Get feedback for agent
    getFeedback(agentId: string): Feedback[] {
        return this.feedback.get(agentId) || [];
    }

    // Get all feedback
    getAllFeedback(): Feedback[] {
        return Array.from(this.feedback.values()).flat();
    }

    // Get feedback statistics
    getFeedbackStats(agentId: string): {
        total: number;
        averageRating: number;
        approvalRate: number;
        rejectionRate: number;
        correctionRate: number;
    } {
        const feedback = this.getFeedback(agentId);

        if (feedback.length === 0) {
            return {
                total: 0,
                averageRating: 0,
                approvalRate: 0,
                rejectionRate: 0,
                correctionRate: 0,
            };
        }

        const ratings = feedback.filter(f => f.rating !== undefined);
        const approvals = feedback.filter(f => f.approved === true);
        const rejections = feedback.filter(f => f.approved === false);
        const corrections = feedback.filter(f => f.correction !== undefined);

        return {
            total: feedback.length,
            averageRating: ratings.length > 0
                ? ratings.reduce((sum, f) => sum + (f.rating || 0), 0) / ratings.length
                : 0,
            approvalRate: approvals.length / feedback.length,
            rejectionRate: rejections.length / feedback.length,
            correctionRate: corrections.length / feedback.length,
        };
    }

    // Create skill
    createSkill(skill: Omit<Skill, 'id' | 'createdAt' | 'updatedAt' | 'successRate' | 'usageCount'>): Skill {
        const id = `skill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const newSkill: Skill = {
            ...skill,
            id,
            successRate: 1.0,
            usageCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        this.skills.set(id, newSkill);
        return newSkill;
    }

    // Get skill
    getSkill(skillId: string): Skill | undefined {
        return this.skills.get(skillId);
    }

    // Get all skills
    getAllSkills(): Skill[] {
        return Array.from(this.skills.values());
    }

    // Get skills by category
    getSkillsByCategory(category: string): Skill[] {
        return Array.from(this.skills.values()).filter(s => s.category === category);
    }

    // Update skill from feedback
    private updateSkillFromFeedback(feedback: Feedback): void {
        // Find related skill based on action
        const skill = Array.from(this.skills.values()).find(s =>
            feedback.action.includes(s.name.toLowerCase().replace(/\s+/g, '-'))
        );

        if (!skill) return;

        // Update success rate
        const isSuccess = feedback.approved === true ||
            (feedback.rating !== undefined && feedback.rating >= 4);

        const newCount = skill.usageCount + 1;
        const newSuccessRate = (skill.successRate * skill.usageCount + (isSuccess ? 1 : 0)) / newCount;

        skill.usageCount = newCount;
        skill.successRate = newSuccessRate;
        skill.lastUsed = new Date();
        skill.updatedAt = new Date();

        // Add as example if it's a correction
        if (feedback.correction && skill.examples.length < this.config.maxExamples) {
            skill.examples.push({
                input: feedback.context.input,
                output: feedback.correction,
                explanation: feedback.comment,
            });
        }
    }

    // Check for improvement opportunity
    private checkForImprovement(agentId: string): void {
        const stats = this.getFeedbackStats(agentId);

        if (stats.total >= this.config.minFeedbackForImprovement) {
            if (stats.approvalRate < this.config.improvementThreshold) {
                // Trigger improvement
                this.triggerImprovement(agentId);
            }
        }
    }

    // Trigger improvement
    private triggerImprovement(agentId: string): void {
        // In real implementation, this would:
        // 1. Analyze feedback patterns
        // 2. Identify common failure modes
        // 3. Generate training examples
        // 4. Initiate fine-tuning or few-shot learning

        console.log(`Improvement triggered for agent: ${agentId}`);
    }

    // Start training session
    async startTraining(
        agentId: string,
        type: TrainingSession['type'],
        config: TrainingConfig
    ): Promise<TrainingSession> {
        const id = `training_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const session: TrainingSession = {
            id,
            agentId,
            status: 'pending',
            type,
            config,
            progress: 0,
        };

        this.trainingSessions.set(id, session);

        // Start training (simulated)
        this.runTraining(session);

        return session;
    }

    // Run training (simulated)
    private async runTraining(session: TrainingSession): Promise<void> {
        session.status = 'running';
        session.startedAt = new Date();

        try {
            // Simulate training progress
            for (let i = 0; i <= 100; i += 10) {
                await new Promise(resolve => setTimeout(resolve, 500));
                session.progress = i;
            }

            // Set metrics
            session.metrics = {
                loss: [0.8, 0.6, 0.4, 0.3, 0.2, 0.15, 0.12, 0.1, 0.08, 0.07],
                accuracy: [0.5, 0.6, 0.7, 0.75, 0.8, 0.85, 0.88, 0.9, 0.92, 0.94],
                epochs: session.config.epochs || 10,
                duration: 5000,
            };

            session.status = 'completed';
            session.completedAt = new Date();
        } catch (error) {
            session.status = 'failed';
            session.error = error instanceof Error ? error.message : 'Training failed';
            session.completedAt = new Date();
        }
    }

    // Get training session
    getTrainingSession(sessionId: string): TrainingSession | undefined {
        return this.trainingSessions.get(sessionId);
    }

    // Get training sessions for agent
    getTrainingSessions(agentId: string): TrainingSession[] {
        return Array.from(this.trainingSessions.values())
            .filter(s => s.agentId === agentId);
    }

    // Get recommended examples for few-shot learning
    getRecommendedExamples(skillId: string, count: number = 5): SkillExample[] {
        const skill = this.skills.get(skillId);
        if (!skill) return [];

        // Return most relevant examples
        return skill.examples.slice(0, count);
    }

    // Export learning data
    exportLearningData(): {
        feedback: Feedback[];
        skills: Skill[];
        trainingSessions: TrainingSession[];
    } {
        return {
            feedback: this.getAllFeedback(),
            skills: this.getAllSkills(),
            trainingSessions: Array.from(this.trainingSessions.values()),
        };
    }

    // Import learning data
    importLearningData(data: {
        feedback?: Feedback[];
        skills?: Skill[];
        trainingSessions?: TrainingSession[];
    }): void {
        if (data.feedback) {
            data.feedback.forEach(f => {
                const agentFeedback = this.feedback.get(f.agentId) || [];
                agentFeedback.push(f);
                this.feedback.set(f.agentId, agentFeedback);
            });
        }

        if (data.skills) {
            data.skills.forEach(s => {
                this.skills.set(s.id, s);
            });
        }

        if (data.trainingSessions) {
            data.trainingSessions.forEach(s => {
                this.trainingSessions.set(s.id, s);
            });
        }
    }

    // Get learning insights
    getLearningInsights(): {
        topSkills: Skill[];
        improvementAreas: string[];
        feedbackTrends: { date: string; count: number; avgRating: number }[];
    } {
        // Top skills by success rate
        const topSkills = Array.from(this.skills.values())
            .sort((a, b) => b.successRate - a.successRate)
            .slice(0, 5);

        // Areas needing improvement
        const improvementAreas = Array.from(this.skills.values())
            .filter(s => s.successRate < 0.8)
            .map(s => s.name);

        // Feedback trends (last 7 days)
        const feedbackTrends: { date: string; count: number; avgRating: number }[] = [];
        const allFeedback = this.getAllFeedback();

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const dayFeedback = allFeedback.filter(f =>
                f.createdAt.toISOString().split('T')[0] === dateStr
            );

            feedbackTrends.push({
                date: dateStr,
                count: dayFeedback.length,
                avgRating: dayFeedback.length > 0
                    ? dayFeedback.filter(f => f.rating).reduce((sum, f) => sum + (f.rating || 0), 0) / dayFeedback.length
                    : 0,
            });
        }

        return {
            topSkills,
            improvementAreas,
            feedbackTrends,
        };
    }

    // Delete skill
    deleteSkill(skillId: string): boolean {
        return this.skills.delete(skillId);
    }

    // Update skill
    updateSkill(skillId: string, updates: Partial<Skill>): Skill | null {
        const skill = this.skills.get(skillId);
        if (!skill) return null;

        const updated = {
            ...skill,
            ...updates,
            updatedAt: new Date(),
        };

        this.skills.set(skillId, updated);
        return updated;
    }
}

// Export singleton instance
export const learningSystem = new LearningSystem();
