// Social Media Agent - Handles all social media automation tasks
// Posts, schedules, monitors, and engages across Instagram, YouTube, Twitter, LinkedIn, TikTok

import { ParsedIntent } from './IntentParser';
import { Agent, AgentResult } from './AgentRouter';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SocialPlatform = 'instagram' | 'youtube' | 'twitter' | 'linkedin' | 'tiktok' | 'reddit' | 'discord' | 'telegram';

export interface SocialPost {
    id: string;
    platform: SocialPlatform;
    type: 'text' | 'image' | 'video' | 'story' | 'reel' | 'carousel' | 'thread' | 'article';
    content: string;
    media?: MediaAttachment[];
    hashtags?: string[];
    mentions?: string[];
    scheduledAt?: Date;
    publishedAt?: Date;
    status: 'draft' | 'scheduled' | 'published' | 'failed';
    engagement?: EngagementMetrics;
    url?: string;
}

export interface MediaAttachment {
    type: 'image' | 'video' | 'gif';
    url?: string;
    localPath?: string;
    thumbnail?: string;
    width?: number;
    height?: number;
    duration?: number; // seconds, for video
    mimeType?: string;
    sizeBytes?: number;
}

export interface EngagementMetrics {
    likes: number;
    comments: number;
    shares: number;
    views: number;
    saves: number;
    reach: number;
    impressions: number;
    engagementRate: number;
    clickThroughRate?: number;
}

export interface ScheduleConfig {
    postAt: Date;
    timezone: string;
    repeatInterval?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    bestTimeOptimization: boolean;
}

export interface CommentAction {
    postId: string;
    platform: SocialPlatform;
    action: 'reply' | 'like' | 'hide' | 'delete';
    content?: string; // For reply
    aiGenerated?: boolean;
}

export interface CrossPostConfig {
    sourcePlatform: SocialPlatform;
    targetPlatforms: SocialPlatform[];
    adaptContent: boolean; // AI-adapt caption/format per platform
    scheduleOptimally: boolean;
}

export interface SocialMediaAgentConfig {
    connectedPlatforms: SocialPlatform[];
    defaultHashtagCount: number;
    autoReply: boolean;
    contentAdaptation: boolean;
    analyticsTracking: boolean;
    bestTimePosting: boolean;
}

// ─── Platform Specs ───────────────────────────────────────────────────────────

const PLATFORM_SPECS: Record<SocialPlatform, {
    maxCaptionLength: number;
    maxHashtags: number;
    videoFormats: string[];
    imageFormats: string[];
    maxVideoSeconds: number;
    aspectRatios: string[];
}> = {
    instagram: {
        maxCaptionLength: 2200,
        maxHashtags: 30,
        videoFormats: ['mp4', 'mov'],
        imageFormats: ['jpg', 'png', 'webp'],
        maxVideoSeconds: 90,
        aspectRatios: ['1:1', '4:5', '9:16'],
    },
    youtube: {
        maxCaptionLength: 5000,
        maxHashtags: 15,
        videoFormats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
        imageFormats: ['jpg', 'png'],
        maxVideoSeconds: 43200, // 12 hours
        aspectRatios: ['16:9'],
    },
    twitter: {
        maxCaptionLength: 280,
        maxHashtags: 5,
        videoFormats: ['mp4'],
        imageFormats: ['jpg', 'png', 'gif', 'webp'],
        maxVideoSeconds: 140,
        aspectRatios: ['16:9', '1:1'],
    },
    linkedin: {
        maxCaptionLength: 3000,
        maxHashtags: 10,
        videoFormats: ['mp4'],
        imageFormats: ['jpg', 'png'],
        maxVideoSeconds: 600,
        aspectRatios: ['1:1', '16:9', '9:16'],
    },
    tiktok: {
        maxCaptionLength: 2200,
        maxHashtags: 30,
        videoFormats: ['mp4', 'mov'],
        imageFormats: ['jpg', 'png'],
        maxVideoSeconds: 180,
        aspectRatios: ['9:16'],
    },
    reddit: {
        maxCaptionLength: 40000,
        maxHashtags: 0,
        videoFormats: ['mp4'],
        imageFormats: ['jpg', 'png', 'gif'],
        maxVideoSeconds: 900,
        aspectRatios: ['16:9', '1:1'],
    },
    discord: {
        maxCaptionLength: 2000,
        maxHashtags: 0,
        videoFormats: ['mp4', 'mov'],
        imageFormats: ['jpg', 'png', 'gif', 'webp'],
        maxVideoSeconds: 600,
        aspectRatios: ['any'],
    },
    telegram: {
        maxCaptionLength: 4096,
        maxHashtags: 0,
        videoFormats: ['mp4'],
        imageFormats: ['jpg', 'png'],
        maxVideoSeconds: 600,
        aspectRatios: ['any'],
    },
};

// ─── Best Posting Times (data-driven defaults) ───────────────────────────────

const BEST_POSTING_TIMES: Record<SocialPlatform, { day: number; hour: number }[]> = {
    instagram: [
        { day: 1, hour: 11 }, { day: 2, hour: 11 }, { day: 3, hour: 11 },
        { day: 4, hour: 11 }, { day: 5, hour: 10 }, { day: 6, hour: 9 },
        { day: 0, hour: 10 },
    ],
    youtube: [
        { day: 5, hour: 15 }, { day: 6, hour: 12 }, { day: 0, hour: 12 },
        { day: 4, hour: 17 },
    ],
    twitter: [
        { day: 1, hour: 8 }, { day: 2, hour: 9 }, { day: 3, hour: 12 },
        { day: 4, hour: 9 }, { day: 5, hour: 7 },
    ],
    linkedin: [
        { day: 2, hour: 10 }, { day: 3, hour: 12 }, { day: 4, hour: 8 },
    ],
    tiktok: [
        { day: 2, hour: 19 }, { day: 4, hour: 19 }, { day: 5, hour: 17 },
        { day: 6, hour: 11 },
    ],
    reddit: [{ day: 1, hour: 6 }, { day: 6, hour: 8 }],
    discord: [{ day: 0, hour: 20 }, { day: 6, hour: 20 }],
    telegram: [{ day: 1, hour: 9 }, { day: 4, hour: 9 }],
};

// ─── SocialMediaAgent ─────────────────────────────────────────────────────────

export class SocialMediaAgent {
    private config: SocialMediaAgentConfig;
    private posts: Map<string, SocialPost> = new Map();
    private scheduledQueue: SocialPost[] = [];

    constructor(config?: Partial<SocialMediaAgentConfig>) {
        this.config = {
            connectedPlatforms: config?.connectedPlatforms || [],
            defaultHashtagCount: config?.defaultHashtagCount || 15,
            autoReply: config?.autoReply ?? false,
            contentAdaptation: config?.contentAdaptation ?? true,
            analyticsTracking: config?.analyticsTracking ?? true,
            bestTimePosting: config?.bestTimePosting ?? true,
        };
    }

    // ─── Main Execution ───────────────────────────────────────────────────────

    async execute(intent: ParsedIntent, agent: Agent): Promise<AgentResult> {
        const startTime = Date.now();

        try {
            let result: any;
            const input = intent.rawInput.toLowerCase();

            if (input.includes('post') || input.includes('publish') || input.includes('share')) {
                result = await this.createPost(intent.parameters);
            } else if (input.includes('schedule')) {
                result = await this.schedulePost(intent.parameters);
            } else if (input.includes('cross-post') || input.includes('distribute') || input.includes('everywhere')) {
                result = await this.crossPost(intent.parameters);
            } else if (input.includes('reply') || input.includes('comment') || input.includes('respond')) {
                result = await this.handleComments(intent.parameters);
            } else if (input.includes('analytics') || input.includes('stats') || input.includes('performance')) {
                result = await this.getAnalytics(intent.parameters);
            } else if (input.includes('hashtag')) {
                result = await this.generateHashtags(intent.parameters);
            } else if (input.includes('thread')) {
                result = await this.createThread(intent.parameters);
            } else {
                result = await this.handleGeneralTask(intent);
            }

            return {
                success: true,
                agentId: agent.id,
                action: intent.action,
                output: result,
                duration: Date.now() - startTime,
            };
        } catch (error) {
            return {
                success: false,
                agentId: agent.id,
                action: intent.action,
                output: null,
                error: error instanceof Error ? error.message : 'Unknown social media error',
                duration: Date.now() - startTime,
            };
        }
    }

    // ─── Create Post ──────────────────────────────────────────────────────────

    async createPost(params: Record<string, any>): Promise<{
        post: SocialPost;
        adaptedVersions?: Record<SocialPlatform, SocialPost>;
        suggestedTime?: Date;
    }> {
        const platform: SocialPlatform = params.platform || 'instagram';
        const specs = PLATFORM_SPECS[platform];

        // Generate content
        let caption = params.caption || params.content || params.text || '';

        // Truncate to platform limit
        if (caption.length > specs.maxCaptionLength) {
            caption = caption.substring(0, specs.maxCaptionLength - 3) + '...';
        }

        // Generate hashtags if not provided
        const hashtags = params.hashtags || await this.generateHashtags({
            topic: params.topic || caption.substring(0, 50),
            platform,
            count: Math.min(this.config.defaultHashtagCount, specs.maxHashtags),
        });

        const postId = `post_${platform}_${Date.now()}`;
        const post: SocialPost = {
            id: postId,
            platform,
            type: params.type || this.detectPostType(params),
            content: caption,
            media: params.media,
            hashtags: Array.isArray(hashtags) ? hashtags : hashtags.hashtags,
            mentions: params.mentions,
            status: 'draft',
        };

        // Determine best time
        let suggestedTime: Date | undefined;
        if (this.config.bestTimePosting) {
            suggestedTime = this.calculateBestTime(platform);
        }

        this.posts.set(postId, post);

        return {
            post,
            suggestedTime,
        };
    }

    // ─── Schedule Post ────────────────────────────────────────────────────────

    async schedulePost(params: Record<string, any>): Promise<{
        scheduled: boolean;
        post: SocialPost;
        scheduledAt: Date;
    }> {
        const postResult = await this.createPost(params);
        const post = postResult.post;

        const scheduledAt = params.scheduledAt
            ? new Date(params.scheduledAt)
            : postResult.suggestedTime || new Date(Date.now() + 3600000);

        post.scheduledAt = scheduledAt;
        post.status = 'scheduled';
        this.scheduledQueue.push(post);
        this.posts.set(post.id, post);

        return {
            scheduled: true,
            post,
            scheduledAt,
        };
    }

    // ─── Cross-Post ───────────────────────────────────────────────────────────

    async crossPost(params: Record<string, any>): Promise<{
        posts: SocialPost[];
        platforms: SocialPlatform[];
        schedule: Record<SocialPlatform, Date>;
    }> {
        const sourcePlatform: SocialPlatform = params.sourcePlatform || 'instagram';
        const targets: SocialPlatform[] = params.targetPlatforms ||
            (['instagram', 'twitter', 'linkedin', 'tiktok', 'youtube'] as SocialPlatform[])
                .filter(p => p !== sourcePlatform);

        const posts: SocialPost[] = [];
        const schedule: Record<string, Date> = {};

        for (const platform of targets) {
            const adapted = await this.adaptContentForPlatform(
                params.content || params.caption || '',
                params.media,
                platform,
            );

            const post: SocialPost = {
                id: `post_${platform}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                platform,
                type: adapted.type,
                content: adapted.caption,
                hashtags: adapted.hashtags,
                media: adapted.media,
                status: 'scheduled',
                scheduledAt: this.calculateBestTime(platform),
            };

            posts.push(post);
            this.posts.set(post.id, post);
            schedule[platform] = post.scheduledAt!;
        }

        return { posts, platforms: targets, schedule };
    }

    // ─── Comment Management ───────────────────────────────────────────────────

    async handleComments(params: Record<string, any>): Promise<{
        actions: CommentAction[];
        repliesGenerated: number;
    }> {
        const postId = params.postId || 'latest';
        const actions: CommentAction[] = [];

        // AI-generated reply
        if (params.autoReply || this.config.autoReply) {
            const replies = params.comments || [];
            for (const comment of replies.slice(0, 5)) {
                actions.push({
                    postId,
                    platform: params.platform || 'instagram',
                    action: 'reply',
                    content: this.generateReply(comment),
                    aiGenerated: true,
                });
            }
        }

        return {
            actions,
            repliesGenerated: actions.filter(a => a.action === 'reply').length,
        };
    }

    // ─── Analytics ────────────────────────────────────────────────────────────

    async getAnalytics(params: Record<string, any>): Promise<{
        platform: SocialPlatform;
        period: string;
        metrics: EngagementMetrics;
        topPosts: SocialPost[];
        insights: string[];
    }> {
        const platform = params.platform || 'instagram';
        const period = params.period || '7d';

        // In real implementation, this would pull from MCP connectors
        const metrics: EngagementMetrics = {
            likes: 0,
            comments: 0,
            shares: 0,
            views: 0,
            saves: 0,
            reach: 0,
            impressions: 0,
            engagementRate: 0,
        };

        return {
            platform,
            period,
            metrics,
            topPosts: [],
            insights: [
                `Best posting time for ${platform}: ${this.getBestTimeLabel(platform)}`,
                'Engagement rate is within normal range',
                'Consider posting more video content for higher reach',
            ],
        };
    }

    // ─── Hashtag Generation ───────────────────────────────────────────────────

    async generateHashtags(params: Record<string, any>): Promise<{
        hashtags: string[];
        categories: Record<string, string[]>;
    }> {
        const topic = params.topic || '';
        const platform: SocialPlatform = params.platform || 'instagram';
        const count = params.count || this.config.defaultHashtagCount;
        const specs = PLATFORM_SPECS[platform];

        // Generate contextual hashtags (in production, AI-powered)
        const baseHashtags = this.generateTopicHashtags(topic);
        const trendingHashtags = this.getTrendingHashtags(platform);
        const nicheHashtags = this.getNicheHashtags(topic);

        const all = [...new Set([...baseHashtags, ...trendingHashtags, ...nicheHashtags])];
        const selected = all.slice(0, Math.min(count, specs.maxHashtags));

        return {
            hashtags: selected,
            categories: {
                topic: baseHashtags.slice(0, 5),
                trending: trendingHashtags.slice(0, 5),
                niche: nicheHashtags.slice(0, 5),
            },
        };
    }

    // ─── Thread Creation ──────────────────────────────────────────────────────

    async createThread(params: Record<string, any>): Promise<{
        posts: SocialPost[];
        totalParts: number;
    }> {
        const content = params.content || '';
        const platform: SocialPlatform = params.platform || 'twitter';
        const specs = PLATFORM_SPECS[platform];

        // Split content into thread parts
        const parts = this.splitIntoThreadParts(content, specs.maxCaptionLength);
        const posts: SocialPost[] = parts.map((part, i) => ({
            id: `thread_${platform}_${Date.now()}_${i}`,
            platform,
            type: 'thread' as const,
            content: `${part}${parts.length > 1 ? `\n\n(${i + 1}/${parts.length})` : ''}`,
            status: 'draft' as const,
        }));

        posts.forEach(p => this.posts.set(p.id, p));

        return { posts, totalParts: parts.length };
    }

    // ─── Content Adaptation ───────────────────────────────────────────────────

    private async adaptContentForPlatform(
        content: string,
        media: MediaAttachment[] | undefined,
        targetPlatform: SocialPlatform,
    ): Promise<{
        caption: string;
        hashtags: string[];
        media?: MediaAttachment[];
        type: SocialPost['type'];
    }> {
        const specs = PLATFORM_SPECS[targetPlatform];

        // Adapt caption length
        let caption = content;
        if (caption.length > specs.maxCaptionLength) {
            caption = caption.substring(0, specs.maxCaptionLength - 20) + '...';
        }

        // Platform-specific tone adaptation
        caption = this.adaptTone(caption, targetPlatform);

        // Generate platform-specific hashtags
        const hashtagResult = await this.generateHashtags({
            topic: content.substring(0, 50),
            platform: targetPlatform,
            count: Math.min(10, specs.maxHashtags),
        });

        // Determine post type
        const type = this.determinePostType(media, targetPlatform);

        return {
            caption,
            hashtags: hashtagResult.hashtags,
            media,
            type,
        };
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private detectPostType(params: Record<string, any>): SocialPost['type'] {
        if (params.media?.some((m: any) => m.type === 'video')) return 'video';
        if (params.media?.length > 1) return 'carousel';
        if (params.media?.length === 1) return 'image';
        return 'text';
    }

    private determinePostType(media: MediaAttachment[] | undefined, platform: SocialPlatform): SocialPost['type'] {
        if (!media || media.length === 0) return 'text';
        const hasVideo = media.some(m => m.type === 'video');
        if (platform === 'tiktok' || platform === 'youtube') return 'video';
        if (hasVideo && platform === 'instagram') return 'reel';
        if (media.length > 1) return 'carousel';
        return hasVideo ? 'video' : 'image';
    }

    private calculateBestTime(platform: SocialPlatform): Date {
        const times = BEST_POSTING_TIMES[platform];
        const now = new Date();
        const today = now.getDay();

        // Find next best time
        for (const t of times) {
            const target = new Date();
            const dayDiff = (t.day - today + 7) % 7;
            target.setDate(target.getDate() + (dayDiff === 0 && now.getHours() >= t.hour ? 7 : dayDiff));
            target.setHours(t.hour, 0, 0, 0);
            if (target > now) return target;
        }

        // Default: tomorrow same time
        const fallback = new Date(now.getTime() + 86400000);
        fallback.setHours(10, 0, 0, 0);
        return fallback;
    }

    private getBestTimeLabel(platform: SocialPlatform): string {
        const times = BEST_POSTING_TIMES[platform];
        if (times.length === 0) return 'Anytime';
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return times.slice(0, 3).map(t =>
            `${days[t.day]} ${t.hour > 12 ? t.hour - 12 + 'PM' : t.hour + 'AM'}`
        ).join(', ');
    }

    private adaptTone(caption: string, platform: SocialPlatform): string {
        switch (platform) {
            case 'twitter':
                // Shorter, punchier
                return caption.length > 250
                    ? caption.split('.').slice(0, 2).join('.') + '.'
                    : caption;
            case 'linkedin':
                // Professional tone
                return caption.replace(/!+/g, '.').replace(/lol|lmao|haha/gi, '');
            case 'tiktok':
                // Casual, emoji-heavy
                return caption;
            default:
                return caption;
        }
    }

    private generateReply(comment: string): string {
        const replies = [
            'Thank you so much! 🙏',
            'Appreciate the love! ❤️',
            'Glad you enjoyed it! 🎉',
            'Thanks for watching! 🔥',
            'Means a lot! 💪',
        ];
        return replies[Math.floor(Math.random() * replies.length)];
    }

    private generateTopicHashtags(topic: string): string[] {
        const words = topic.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        return words.map(w => `#${w.replace(/[^a-z0-9]/g, '')}`).filter(h => h.length > 2);
    }

    private getTrendingHashtags(platform: SocialPlatform): string[] {
        const trends: Record<SocialPlatform, string[]> = {
            instagram: ['#reels', '#explore', '#viral', '#trending', '#instagood'],
            youtube: ['#shorts', '#subscribe', '#trending', '#viral'],
            twitter: ['#tech', '#ai', '#trending'],
            linkedin: ['#innovation', '#leadership', '#growth', '#business'],
            tiktok: ['#fyp', '#foryou', '#viral', '#trending', '#foryoupage'],
            reddit: [],
            discord: [],
            telegram: [],
        };
        return trends[platform] || [];
    }

    private getNicheHashtags(topic: string): string[] {
        return [`#${topic.replace(/\s+/g, '').toLowerCase()}tips`,
        `#${topic.replace(/\s+/g, '').toLowerCase()}community`];
    }

    private splitIntoThreadParts(content: string, maxLength: number): string[] {
        if (content.length <= maxLength) return [content];

        const parts: string[] = [];
        const sentences = content.split(/(?<=[.!?])\s+/);
        let current = '';

        for (const sentence of sentences) {
            if ((current + ' ' + sentence).trim().length > maxLength - 20) {
                if (current) parts.push(current.trim());
                current = sentence;
            } else {
                current = (current + ' ' + sentence).trim();
            }
        }
        if (current) parts.push(current.trim());

        return parts;
    }

    private handleGeneralTask(intent: ParsedIntent): any {
        return {
            message: 'Social media task processed',
            suggestions: [
                'Post to Instagram',
                'Schedule a tweet',
                'Cross-post to all platforms',
                'Check analytics',
                'Generate hashtags for a topic',
                'Create a Twitter thread',
            ],
        };
    }

    // ─── Public Getters ───────────────────────────────────────────────────────

    getPost(id: string): SocialPost | undefined {
        return this.posts.get(id);
    }

    getAllPosts(): SocialPost[] {
        return Array.from(this.posts.values());
    }

    getScheduledPosts(): SocialPost[] {
        return this.scheduledQueue.filter(p => p.status === 'scheduled');
    }

    getPlatformSpecs(platform: SocialPlatform) {
        return PLATFORM_SPECS[platform];
    }
}

// Export factory
export function createSocialMediaAgent(config?: Partial<SocialMediaAgentConfig>): SocialMediaAgent {
    return new SocialMediaAgent(config);
}
