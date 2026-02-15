// Context Engine - Awareness Layer for Smarter Agent Decisions
// Provides temporal, file, calendar, history, and preference awareness

export interface ContextSnapshot {
    temporal: TemporalAwareness;
    file: FileAwareness;
    history: HistoryAwareness;
    preferences: UserPreferences;
    environment: EnvironmentInfo;
}

export interface TemporalAwareness {
    currentTime: Date;
    timezone: string;
    dayOfWeek: string;
    isWorkHours: boolean;
    isWeekend: boolean;
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    localHour: number;
}

export interface FileAwareness {
    recentDownloads: string[];
    recentlyModified: string[];
    projectFolders: string[];
    activeFile?: string;
}

export interface HistoryAwareness {
    recentCommands: CommandRecord[];
    frequentActions: { action: string; count: number }[];
    successRates: Record<string, number>;
    avgResponseTimes: Record<string, number>;
    lastActiveTime: Date | null;
    totalCommandsToday: number;
}

export interface CommandRecord {
    id: string;
    input: string;
    intent: string;
    agent: string;
    success: boolean;
    timestamp: Date;
    duration: number;
}

export interface UserPreferences {
    preferredPostingTimes: Record<string, number[]>; // platform -> hours
    preferredTone: string;
    defaultPlatforms: string[];
    autoApprove: boolean;
    notificationPreference: 'all' | 'errors' | 'none';
    language: string;
}

export interface EnvironmentInfo {
    os: string;
    browser: string;
    screenWidth: number;
    screenHeight: number;
    online: boolean;
}

export interface ContextSuggestion {
    type: 'timing' | 'content' | 'platform' | 'workflow' | 'optimization';
    message: string;
    confidence: number;
    actionable: boolean;
    suggestedAction?: string;
}

// ─── ContextEngine ────────────────────────────────────────────────────────────

export class ContextEngine {
    private commandHistory: CommandRecord[] = [];
    private preferences: UserPreferences;
    private maxHistory = 500;

    constructor(initialPreferences?: Partial<UserPreferences>) {
        this.preferences = {
            preferredPostingTimes: {},
            preferredTone: 'professional',
            defaultPlatforms: ['instagram', 'twitter', 'linkedin'],
            autoApprove: false,
            notificationPreference: 'all',
            language: 'en',
            ...initialPreferences,
        };

        // Load history from localStorage if available
        this.loadHistory();
    }

    // ─── Get Full Snapshot ────────────────────────────────────────────────────

    getSnapshot(): ContextSnapshot {
        return {
            temporal: this.getTemporalAwareness(),
            file: this.getFileAwareness(),
            history: this.getHistoryAwareness(),
            preferences: this.preferences,
            environment: this.getEnvironmentInfo(),
        };
    }

    // ─── Temporal Awareness ───────────────────────────────────────────────────

    getTemporalAwareness(): TemporalAwareness {
        const now = new Date();
        const hour = now.getHours();
        const dayOfWeek = now.getDay();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        let timeOfDay: TemporalAwareness['timeOfDay'];
        if (hour >= 5 && hour < 12) timeOfDay = 'morning';
        else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
        else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
        else timeOfDay = 'night';

        return {
            currentTime: now,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            dayOfWeek: days[dayOfWeek],
            isWorkHours: hour >= 9 && hour <= 17 && dayOfWeek >= 1 && dayOfWeek <= 5,
            isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
            timeOfDay,
            localHour: hour,
        };
    }

    // ─── File Awareness ───────────────────────────────────────────────────────

    getFileAwareness(): FileAwareness {
        // In web context, limited file system access
        // In desktop (Electron/Tauri), this would scan real dirs
        return {
            recentDownloads: [],
            recentlyModified: [],
            projectFolders: [],
            activeFile: undefined,
        };
    }

    // ─── History Awareness ────────────────────────────────────────────────────

    getHistoryAwareness(): HistoryAwareness {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayCommands = this.commandHistory.filter(c => c.timestamp >= today);

        // Calculate frequent actions
        const actionCounts = new Map<string, number>();
        for (const cmd of this.commandHistory) {
            actionCounts.set(cmd.intent, (actionCounts.get(cmd.intent) || 0) + 1);
        }
        const frequentActions = Array.from(actionCounts.entries())
            .map(([action, count]) => ({ action, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Calculate success rates by agent
        const agentSuccesses = new Map<string, { success: number; total: number }>();
        for (const cmd of this.commandHistory) {
            const current = agentSuccesses.get(cmd.agent) || { success: 0, total: 0 };
            current.total++;
            if (cmd.success) current.success++;
            agentSuccesses.set(cmd.agent, current);
        }
        const successRates: Record<string, number> = {};
        agentSuccesses.forEach((v, k) => { successRates[k] = v.total > 0 ? v.success / v.total : 0; });

        // Calculate avg response times by agent
        const agentTimes = new Map<string, number[]>();
        for (const cmd of this.commandHistory) {
            const times = agentTimes.get(cmd.agent) || [];
            times.push(cmd.duration);
            agentTimes.set(cmd.agent, times);
        }
        const avgResponseTimes: Record<string, number> = {};
        agentTimes.forEach((times, agent) => {
            avgResponseTimes[agent] = times.reduce((a, b) => a + b, 0) / times.length;
        });

        return {
            recentCommands: this.commandHistory.slice(-20),
            frequentActions,
            successRates,
            avgResponseTimes,
            lastActiveTime: this.commandHistory.length > 0
                ? this.commandHistory[this.commandHistory.length - 1].timestamp
                : null,
            totalCommandsToday: todayCommands.length,
        };
    }

    // ─── Environment Info ─────────────────────────────────────────────────────

    getEnvironmentInfo(): EnvironmentInfo {
        if (typeof window === 'undefined') {
            return {
                os: 'server',
                browser: 'none',
                screenWidth: 0,
                screenHeight: 0,
                online: true,
            };
        }

        return {
            os: navigator.platform || 'unknown',
            browser: navigator.userAgent.split(' ').pop() || 'unknown',
            screenWidth: window.screen?.width || 0,
            screenHeight: window.screen?.height || 0,
            online: navigator.onLine,
        };
    }

    // ─── Smart Suggestions ────────────────────────────────────────────────────

    getSuggestions(): ContextSuggestion[] {
        const suggestions: ContextSuggestion[] = [];
        const temporal = this.getTemporalAwareness();
        const history = this.getHistoryAwareness();

        // Timing suggestions
        if (temporal.timeOfDay === 'evening' && temporal.isWeekend) {
            suggestions.push({
                type: 'timing',
                message: 'Weekend evening — great time to schedule posts for Monday morning!',
                confidence: 0.8,
                actionable: true,
                suggestedAction: 'schedule_social',
            });
        }

        if (temporal.isWorkHours) {
            suggestions.push({
                type: 'timing',
                message: 'Work hours — LinkedIn posts perform best now.',
                confidence: 0.7,
                actionable: true,
                suggestedAction: 'post_social:linkedin',
            });
        }

        // History-based suggestions
        if (history.totalCommandsToday === 0) {
            suggestions.push({
                type: 'workflow',
                message: 'Good morning! Ready to review your content calendar?',
                confidence: 0.6,
                actionable: true,
                suggestedAction: 'content_calendar',
            });
        }

        // Frequent action suggestions
        if (history.frequentActions.length > 0) {
            const topAction = history.frequentActions[0];
            suggestions.push({
                type: 'optimization',
                message: `You frequently use "${topAction.action}" — consider creating a workflow template for it.`,
                confidence: 0.65,
                actionable: true,
                suggestedAction: 'create_workflow',
            });
        }

        return suggestions;
    }

    // ─── Record Command ───────────────────────────────────────────────────────

    recordCommand(record: Omit<CommandRecord, 'id'>): void {
        const cmd: CommandRecord = {
            ...record,
            id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        };

        this.commandHistory.push(cmd);

        // Trim history
        if (this.commandHistory.length > this.maxHistory) {
            this.commandHistory = this.commandHistory.slice(-this.maxHistory);
        }

        // Persist
        this.saveHistory();
    }

    // ─── User Preferences ─────────────────────────────────────────────────────

    updatePreferences(updates: Partial<UserPreferences>): void {
        this.preferences = { ...this.preferences, ...updates };
        this.savePreferences();
    }

    getPreferences(): UserPreferences {
        return { ...this.preferences };
    }

    // ─── Persistence ──────────────────────────────────────────────────────────

    private loadHistory(): void {
        if (typeof window === 'undefined') return;
        try {
            const stored = localStorage.getItem('antigravity_command_history');
            if (stored) {
                const parsed = JSON.parse(stored);
                this.commandHistory = parsed.map((c: any) => ({
                    ...c,
                    timestamp: new Date(c.timestamp),
                }));
            }
            const prefs = localStorage.getItem('antigravity_user_preferences');
            if (prefs) {
                this.preferences = { ...this.preferences, ...JSON.parse(prefs) };
            }
        } catch {
            // Ignore parse errors
        }
    }

    private saveHistory(): void {
        if (typeof window === 'undefined') return;
        try {
            // Keep only last 100 for storage
            const toStore = this.commandHistory.slice(-100);
            localStorage.setItem('antigravity_command_history', JSON.stringify(toStore));
        } catch {
            // Storage full, etc.
        }
    }

    private savePreferences(): void {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem('antigravity_user_preferences', JSON.stringify(this.preferences));
        } catch {
            // ignore
        }
    }
}

// Export singleton
export const contextEngine = new ContextEngine();
