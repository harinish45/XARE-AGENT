// Content Agent - AI-Powered Content Creation & Transformation
// Generates captions, hashtags, blog posts, video descriptions, and cross-platform content adaptation

import { ParsedIntent } from './IntentParser';
import { Agent, AgentResult } from './AgentRouter';
import { SocialPlatform } from './SocialMediaAgent';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ContentType = 'caption' | 'blog_post' | 'article' | 'newsletter' | 'video_description'
    | 'tweet_thread' | 'carousel_slides' | 'email_copy' | 'ad_copy' | 'product_description';

export type ContentTone = 'professional' | 'casual' | 'humorous' | 'inspirational' | 'educational'
    | 'persuasive' | 'storytelling' | 'technical' | 'conversational';

export type ContentLength = 'short' | 'medium' | 'long' | 'thread';

export interface ContentRequest {
    type: ContentType;
    topic: string;
    tone?: ContentTone;
    length?: ContentLength;
    targetAudience?: string;
    platform?: SocialPlatform;
    keywords?: string[];
    references?: string[];
    language?: string;
    includeEmojis?: boolean;
    includeHashtags?: boolean;
    includeCTA?: boolean;
    brandVoice?: string;
}

export interface GeneratedContent {
    id: string;
    type: ContentType;
    title?: string;
    body: string;
    variants?: string[]; // A/B testing variations
    hashtags?: string[];
    emojis?: string[];
    estimatedReadTime?: number; // minutes
    wordCount: number;
    seoScore?: number;
    metadata: ContentMetadata;
}

export interface ContentMetadata {
    tone: ContentTone;
    platform?: SocialPlatform;
    generatedAt: Date;
    keywords: string[];
    callToAction?: string;
    targetAudience?: string;
}

export interface TranscriptToContentResult {
    blogPost: string;
    socialPosts: Record<SocialPlatform, string>;
    keyQuotes: string[];
    summary: string;
    chapters: { title: string; timestamp: string; summary: string }[];
}

export interface ContentCalendar {
    posts: ContentCalendarEntry[];
    startDate: Date;
    endDate: Date;
    platforms: SocialPlatform[];
}

export interface ContentCalendarEntry {
    date: Date;
    platform: SocialPlatform;
    contentType: ContentType;
    topic: string;
    status: 'idea' | 'drafted' | 'scheduled' | 'published';
    content?: GeneratedContent;
}

export interface ContentAgentConfig {
    defaultTone: ContentTone;
    defaultLanguage: string;
    includeEmojis: boolean;
    hashtagStrategy: 'aggressive' | 'moderate' | 'minimal';
    brandVoice?: string;
    targetAudience?: string;
}

// ─── Platform Content Specs ───────────────────────────────────────────────────

const PLATFORM_CONTENT_GUIDE: Record<SocialPlatform, {
    idealCaptionLength: number;
    tone: ContentTone;
    emojiDensity: 'high' | 'medium' | 'low' | 'none';
    hashtagCount: number;
    ctaStyle: string;
}> = {
    instagram: {
        idealCaptionLength: 150,
        tone: 'casual',
        emojiDensity: 'high',
        hashtagCount: 20,
        ctaStyle: 'Double tap if you agree! 💭',
    },
    youtube: {
        idealCaptionLength: 300,
        tone: 'conversational',
        emojiDensity: 'medium',
        hashtagCount: 5,
        ctaStyle: 'Subscribe and hit the bell 🔔',
    },
    twitter: {
        idealCaptionLength: 240,
        tone: 'casual',
        emojiDensity: 'low',
        hashtagCount: 3,
        ctaStyle: 'RT if you relate 🔄',
    },
    linkedin: {
        idealCaptionLength: 300,
        tone: 'professional',
        emojiDensity: 'low',
        hashtagCount: 5,
        ctaStyle: 'What are your thoughts? Share below 👇',
    },
    tiktok: {
        idealCaptionLength: 100,
        tone: 'casual',
        emojiDensity: 'high',
        hashtagCount: 15,
        ctaStyle: 'Follow for more! 🔥',
    },
    reddit: {
        idealCaptionLength: 500,
        tone: 'conversational',
        emojiDensity: 'none',
        hashtagCount: 0,
        ctaStyle: 'What do you think? Discussion in comments.',
    },
    discord: {
        idealCaptionLength: 300,
        tone: 'casual',
        emojiDensity: 'medium',
        hashtagCount: 0,
        ctaStyle: 'React below!',
    },
    telegram: {
        idealCaptionLength: 300,
        tone: 'conversational',
        emojiDensity: 'medium',
        hashtagCount: 3,
        ctaStyle: 'Share with your friends!',
    },
};

// ─── Emoji Library ────────────────────────────────────────────────────────────

const TOPIC_EMOJIS: Record<string, string[]> = {
    tech: ['💻', '🚀', '⚡', '🔧', '📱', '🤖', '🧠', '💡'],
    business: ['📈', '💼', '🏆', '🎯', '💰', '📊', '🤝', '⭐'],
    fitness: ['💪', '🏋️', '🏃', '🧘', '🔥', '❤️', '🥗', '💯'],
    food: ['🍕', '🍔', '🍣', '🥗', '🍰', '☕', '🍳', '😋'],
    travel: ['✈️', '🌍', '🗺️', '🏖️', '⛰️', '📸', '🧳', '🌅'],
    education: ['📚', '✏️', '🎓', '🧠', '💡', '📝', '🔬', '🎯'],
    music: ['🎵', '🎸', '🎹', '🎤', '🎧', '🎶', '🎺', '🥁'],
    art: ['🎨', '✨', '🖌️', '🎭', '📸', '🌈', '💫', '🖼️'],
    gaming: ['🎮', '🕹️', '🏆', '⚔️', '🎯', '🔥', '💀', '👾'],
    lifestyle: ['✨', '🌟', '💫', '🌿', '🙌', '💕', '🎉', '😊'],
    default: ['✨', '🔥', '💡', '🚀', '⭐', '💪', '🎯', '🌟'],
};

// ─── ContentAgent ─────────────────────────────────────────────────────────────

export class ContentAgent {
    private config: ContentAgentConfig;
    private generatedContent: Map<string, GeneratedContent> = new Map();

    constructor(config?: Partial<ContentAgentConfig>) {
        this.config = {
            defaultTone: config?.defaultTone || 'professional',
            defaultLanguage: config?.defaultLanguage || 'en',
            includeEmojis: config?.includeEmojis ?? true,
            hashtagStrategy: config?.hashtagStrategy || 'moderate',
            brandVoice: config?.brandVoice,
            targetAudience: config?.targetAudience,
        };
    }

    // ─── Main Execution ───────────────────────────────────────────────────────

    async execute(intent: ParsedIntent, agent: Agent): Promise<AgentResult> {
        const startTime = Date.now();

        try {
            let result: any;
            const input = intent.rawInput.toLowerCase();

            if (input.includes('caption') || input.includes('description')) {
                result = await this.generateCaption(intent.parameters);
            } else if (input.includes('blog') || input.includes('article')) {
                result = await this.generateBlogPost(intent.parameters);
            } else if (input.includes('transcript') || input.includes('convert video')) {
                result = await this.transcriptToContent(intent.parameters);
            } else if (input.includes('calendar') || input.includes('content plan')) {
                result = await this.generateContentCalendar(intent.parameters);
            } else if (input.includes('carousel') || input.includes('slides')) {
                result = await this.generateCarouselSlides(intent.parameters);
            } else if (input.includes('ad') || input.includes('copy')) {
                result = await this.generateAdCopy(intent.parameters);
            } else if (input.includes('seo') || input.includes('optimize')) {
                result = await this.optimizeForSEO(intent.parameters);
            } else {
                result = await this.generateContent({
                    type: 'caption',
                    topic: intent.rawInput,
                    tone: this.config.defaultTone,
                });
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
                error: error instanceof Error ? error.message : 'Content generation error',
                duration: Date.now() - startTime,
            };
        }
    }

    // ─── Generate Caption ─────────────────────────────────────────────────────

    async generateCaption(params: Record<string, any>): Promise<GeneratedContent> {
        const platform: SocialPlatform = params.platform || 'instagram';
        const guide = PLATFORM_CONTENT_GUIDE[platform];

        const topic = params.topic || params.subject || '';
        const tone = params.tone || guide.tone;

        // Build caption
        let caption = this.buildCaption(topic, tone, guide.idealCaptionLength);

        // Add emojis
        if (this.config.includeEmojis && guide.emojiDensity !== 'none') {
            caption = this.addEmojis(caption, topic, guide.emojiDensity);
        }

        // Add CTA
        if (params.includeCTA !== false) {
            caption += `\n\n${guide.ctaStyle}`;
        }

        // Generate hashtags
        let hashtags: string[] = [];
        if (guide.hashtagCount > 0) {
            hashtags = this.generatePlatformHashtags(topic, platform, guide.hashtagCount);
        }

        // Create variants
        const variants = [
            this.buildCaption(topic, 'casual', guide.idealCaptionLength),
            this.buildCaption(topic, 'inspirational', guide.idealCaptionLength),
        ];

        const content: GeneratedContent = {
            id: `content_${Date.now()}`,
            type: 'caption',
            body: caption,
            variants,
            hashtags,
            wordCount: caption.split(/\s+/).length,
            metadata: {
                tone,
                platform,
                generatedAt: new Date(),
                keywords: this.extractKeywords(topic),
                callToAction: guide.ctaStyle,
                targetAudience: params.targetAudience || this.config.targetAudience,
            },
        };

        this.generatedContent.set(content.id, content);
        return content;
    }

    // ─── Generate Blog Post ───────────────────────────────────────────────────

    async generateBlogPost(params: Record<string, any>): Promise<GeneratedContent> {
        const topic = params.topic || '';
        const tone = params.tone || 'educational';
        const keywords = params.keywords || this.extractKeywords(topic);

        const sections = [
            { heading: 'Introduction', paragraphs: 2 },
            { heading: `Understanding ${topic}`, paragraphs: 3 },
            { heading: 'Key Benefits', paragraphs: 2 },
            { heading: 'How to Get Started', paragraphs: 3 },
            { heading: 'Best Practices', paragraphs: 2 },
            { heading: 'Conclusion', paragraphs: 1 },
        ];

        let body = `# ${this.generateTitle(topic)}\n\n`;
        for (const section of sections) {
            body += `## ${section.heading}\n\n`;
            for (let i = 0; i < section.paragraphs; i++) {
                body += this.generateParagraph(topic, tone, keywords) + '\n\n';
            }
        }

        const wordCount = body.split(/\s+/).length;

        const content: GeneratedContent = {
            id: `blog_${Date.now()}`,
            type: 'blog_post',
            title: this.generateTitle(topic),
            body,
            wordCount,
            estimatedReadTime: Math.ceil(wordCount / 200),
            seoScore: this.calculateSEOScore(body, keywords),
            metadata: {
                tone,
                generatedAt: new Date(),
                keywords,
                targetAudience: params.targetAudience,
            },
        };

        this.generatedContent.set(content.id, content);
        return content;
    }

    // ─── Transcript to Content ────────────────────────────────────────────────

    async transcriptToContent(params: Record<string, any>): Promise<TranscriptToContentResult> {
        const transcript = params.transcript || params.text || '';
        const sentences = transcript.split(/[.!?]+/).filter((s: string) => s.trim().length > 10);

        // Extract key quotes
        const keyQuotes = sentences
            .filter((s: string) => s.length > 30 && s.length < 200)
            .slice(0, 5)
            .map((s: string) => `"${s.trim()}"`);

        // Generate summary
        const summary = sentences.slice(0, 3).join('. ').trim() + '.';

        // Generate chapters
        const chunkSize = Math.ceil(sentences.length / 5);
        const chapters = [];
        for (let i = 0; i < sentences.length; i += chunkSize) {
            const chunk = sentences.slice(i, i + chunkSize);
            const mins = Math.floor((i / sentences.length) * 30);
            chapters.push({
                title: this.generateChapterTitle(chunk.join('. ')),
                timestamp: `${mins}:00`,
                summary: chunk.slice(0, 2).join('. ').trim() + '.',
            });
        }

        // Generate platform-specific posts
        const socialPosts: Record<string, string> = {};
        const platforms: SocialPlatform[] = ['instagram', 'twitter', 'linkedin', 'tiktok'];

        for (const platform of platforms) {
            const guide = PLATFORM_CONTENT_GUIDE[platform];
            let post = summary.substring(0, guide.idealCaptionLength);
            if (this.config.includeEmojis) {
                post = this.addEmojis(post, summary.substring(0, 30), guide.emojiDensity);
            }
            socialPosts[platform] = post;
        }

        // Generate blog post
        const blogPost = `# ${this.generateChapterTitle(summary)}\n\n${summary}\n\n${chapters.map(c =>
            `## ${c.title}\n\n${c.summary}`
        ).join('\n\n')}`;

        return {
            blogPost,
            socialPosts: socialPosts as Record<SocialPlatform, string>,
            keyQuotes,
            summary,
            chapters,
        };
    }

    // ─── Content Calendar ─────────────────────────────────────────────────────

    async generateContentCalendar(params: Record<string, any>): Promise<ContentCalendar> {
        const days = params.days || 30;
        const platforms: SocialPlatform[] = params.platforms || ['instagram', 'twitter', 'linkedin'];
        const topics: string[] = params.topics || ['industry news', 'tips', 'behind the scenes', 'product updates', 'user stories'];
        const postsPerDay = params.postsPerDay || 1;

        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + days * 86400000);
        const posts: ContentCalendarEntry[] = [];

        for (let d = 0; d < days; d++) {
            const date = new Date(startDate.getTime() + d * 86400000);

            for (let p = 0; p < postsPerDay; p++) {
                const platform = platforms[(d + p) % platforms.length];
                const topic = topics[(d + p) % topics.length];
                const contentTypes: ContentType[] = ['caption', 'carousel_slides', 'video_description', 'blog_post'];

                posts.push({
                    date,
                    platform,
                    contentType: contentTypes[d % contentTypes.length],
                    topic,
                    status: 'idea',
                });
            }
        }

        return {
            posts,
            startDate,
            endDate,
            platforms,
        };
    }

    // ─── Carousel Slides ──────────────────────────────────────────────────────

    async generateCarouselSlides(params: Record<string, any>): Promise<{
        slides: { title: string; body: string; slideNumber: number }[];
        totalSlides: number;
    }> {
        const topic = params.topic || '';
        const slideCount = params.count || 8;

        const slides = [];
        const points = this.generateKeyPoints(topic, slideCount - 2);

        // Title slide
        slides.push({
            title: this.generateTitle(topic),
            body: `Everything you need to know about ${topic}`,
            slideNumber: 1,
        });

        // Content slides
        for (let i = 0; i < points.length; i++) {
            slides.push({
                title: points[i].title,
                body: points[i].detail,
                slideNumber: i + 2,
            });
        }

        // CTA slide
        slides.push({
            title: 'Ready to Get Started?',
            body: `Follow for more ${topic} tips!\n\n💾 Save this post\n📤 Share with someone who needs this\n🔔 Turn on notifications`,
            slideNumber: slides.length + 1,
        });

        return { slides, totalSlides: slides.length };
    }

    // ─── Ad Copy ──────────────────────────────────────────────────────────────

    async generateAdCopy(params: Record<string, any>): Promise<GeneratedContent> {
        const product = params.product || params.topic || '';
        const audience = params.audience || 'general';
        const goal = params.goal || 'awareness'; // awareness | conversion | engagement

        const headlines = [
            `Transform Your ${product} Experience`,
            `The Smarter Way to ${product}`,
            `${product}: Built for You`,
        ];

        const bodies: Record<string, string> = {
            awareness: `Discover how ${product} is changing the game. Join thousands who have already made the switch.`,
            conversion: `Limited time offer! Get started with ${product} today and see results in 24 hours. Try it free →`,
            engagement: `What's your biggest challenge with ${product}? Drop a comment below and let's solve it together 👇`,
        };

        const content: GeneratedContent = {
            id: `ad_${Date.now()}`,
            type: 'ad_copy',
            title: headlines[0],
            body: bodies[goal] || bodies.awareness,
            variants: headlines.map((h, i) => `${h}\n\n${Object.values(bodies)[i % 3]}`),
            wordCount: bodies[goal].split(/\s+/).length,
            metadata: {
                tone: 'persuasive',
                generatedAt: new Date(),
                keywords: [product, goal, audience],
                callToAction: goal === 'conversion' ? 'Try it free →' : 'Learn more',
                targetAudience: audience,
            },
        };

        this.generatedContent.set(content.id, content);
        return content;
    }

    // ─── SEO Optimization ─────────────────────────────────────────────────────

    async optimizeForSEO(params: Record<string, any>): Promise<{
        optimizedContent: string;
        seoScore: number;
        suggestions: string[];
        keywords: string[];
        metaTitle: string;
        metaDescription: string;
    }> {
        const content = params.content || params.text || '';
        const keywords = params.keywords || this.extractKeywords(content);

        const suggestions: string[] = [];

        // Check content length
        const wordCount = content.split(/\s+/).length;
        if (wordCount < 300) suggestions.push('Content is too short. Aim for 1000+ words for better SEO.');
        if (wordCount > 3000) suggestions.push('Consider breaking into multiple posts for better readability.');

        // Check headings
        if (!content.includes('#')) suggestions.push('Add H2/H3 headings to structure your content.');

        // Check keywords
        const keywordDensity = this.calculateKeywordDensity(content, keywords);
        if (keywordDensity < 1) suggestions.push('Keyword density is low. Naturally incorporate target keywords.');
        if (keywordDensity > 3) suggestions.push('Keyword density is too high. Reduce keyword stuffing.');

        // Check meta
        if (!content.includes('http')) suggestions.push('Add internal/external links to boost authority.');

        const seoScore = this.calculateSEOScore(content, keywords);

        return {
            optimizedContent: content,
            seoScore,
            suggestions,
            keywords,
            metaTitle: this.generateMetaTitle(content, keywords),
            metaDescription: this.generateMetaDescription(content),
        };
    }

    // ─── Content Generation Core ──────────────────────────────────────────────

    async generateContent(request: ContentRequest): Promise<GeneratedContent> {
        switch (request.type) {
            case 'caption':
                return this.generateCaption(request);
            case 'blog_post':
            case 'article':
                return this.generateBlogPost(request);
            case 'ad_copy':
                return this.generateAdCopy(request);
            default:
                return this.generateCaption(request);
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private buildCaption(topic: string, tone: ContentTone, maxLength: number): string {
        const templates: Record<ContentTone, string[]> = {
            professional: [
                `Here's an essential insight about ${topic} that every professional should know.`,
                `${topic} is reshaping the way we approach our work. Here's what matters most.`,
            ],
            casual: [
                `Let's talk about ${topic} — because this is actually really interesting! 🤔`,
                `OK so ${topic} is kind of a game changer and here's why...`,
            ],
            humorous: [
                `When someone says they don't care about ${topic}... sure Jan 😏`,
                `Me before learning about ${topic}: 😴 Me after: 🤯`,
            ],
            inspirational: [
                `${topic} isn't just a trend — it's a movement. And you're part of it. ✨`,
                `Every great journey starts with a single step. Let ${topic} be yours.`,
            ],
            educational: [
                `Did you know? Here are the key facts about ${topic} that most people miss.`,
                `Let's break down ${topic} into simple, actionable steps you can start today.`,
            ],
            persuasive: [
                `If you're still sleeping on ${topic}, you're leaving results on the table.`,
                `The data is clear: ${topic} delivers. Here's the proof.`,
            ],
            storytelling: [
                `A year ago, I knew nothing about ${topic}. Today, it changed everything.`,
                `Picture this: You discover ${topic} and suddenly everything clicks.`,
            ],
            technical: [
                `A deep dive into ${topic}: architecture, implementation, and best practices.`,
                `Understanding the fundamentals of ${topic} from an engineering perspective.`,
            ],
            conversational: [
                `So I've been thinking a lot about ${topic} lately, and here's what I've realized...`,
                `Can we talk about ${topic} for a second? Because this is important.`,
            ],
        };

        const options = templates[tone] || templates.casual;
        return options[Math.floor(Math.random() * options.length)];
    }

    private addEmojis(text: string, topic: string, density: 'high' | 'medium' | 'low' | 'none'): string {
        if (density === 'none') return text;

        const topicKey = Object.keys(TOPIC_EMOJIS).find(k => topic.toLowerCase().includes(k)) || 'default';
        const emojis = TOPIC_EMOJIS[topicKey] || TOPIC_EMOJIS.default;

        const count = density === 'high' ? 4 : density === 'medium' ? 2 : 1;
        const selected = emojis.slice(0, count);

        return `${selected[0] || ''} ${text} ${selected.slice(1).join(' ')}`.trim();
    }

    private generatePlatformHashtags(topic: string, platform: SocialPlatform, count: number): string[] {
        const words = topic.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        const base = words.map(w => `#${w.replace(/[^a-z0-9]/g, '')}`);

        const platformTags: Record<SocialPlatform, string[]> = {
            instagram: ['#instagood', '#photooftheday', '#explore', '#reels', '#trending'],
            youtube: ['#youtube', '#subscribe', '#shorts', '#tutorial'],
            twitter: ['#tech', '#trending', '#thread'],
            linkedin: ['#leadership', '#innovation', '#career', '#business'],
            tiktok: ['#fyp', '#foryou', '#viral', '#foryoupage'],
            reddit: [],
            discord: [],
            telegram: [],
        };

        const combined = [...new Set([...base, ...(platformTags[platform] || [])])];
        return combined.slice(0, count);
    }

    private extractKeywords(text: string): string[] {
        const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'is', 'are', 'was', 'were', 'be', 'been', 'with', 'that', 'this', 'it', 'not', 'as', 'by', 'from', 'have', 'has', 'had', 'will', 'can', 'do', 'does', 'did', 'would', 'should', 'could', 'may', 'might']);
        return text.toLowerCase()
            .split(/\W+/)
            .filter(w => w.length > 3 && !stopWords.has(w))
            .slice(0, 10);
    }

    private generateTitle(topic: string): string {
        const templates = [
            `The Ultimate Guide to ${topic}`,
            `${topic}: Everything You Need to Know`,
            `How ${topic} Is Changing the Game`,
            `Master ${topic} in 2025`,
        ];
        return templates[Math.floor(Math.random() * templates.length)];
    }

    private generateChapterTitle(text: string): string {
        const words = text.split(/\s+/).slice(0, 5).join(' ');
        return words.charAt(0).toUpperCase() + words.slice(1);
    }

    private generateParagraph(topic: string, tone: ContentTone, keywords: string[]): string {
        return `Understanding ${topic} is crucial in today's landscape. ${keywords.slice(0, 2).join(' and ')} play a significant role in how we approach this subject. By focusing on these core aspects, you can unlock new levels of performance and efficiency that drive meaningful results.`;
    }

    private generateKeyPoints(topic: string, count: number): { title: string; detail: string }[] {
        const points = [];
        const templates = [
            { title: `Why ${topic} Matters`, detail: `The impact of ${topic} on modern workflows cannot be overstated.` },
            { title: 'Getting Started', detail: 'Begin with the fundamentals and build a strong foundation.' },
            { title: 'Common Mistakes', detail: 'Avoid these pitfalls that trip up most beginners.' },
            { title: 'Advanced Tips', detail: 'Level up your skills with these expert strategies.' },
            { title: 'Tools & Resources', detail: 'Essential tools that will accelerate your progress.' },
            { title: 'Case Studies', detail: 'Real-world examples of success stories.' },
            { title: 'Future Trends', detail: 'What to expect in the coming months and years.' },
            { title: 'Action Steps', detail: 'Concrete steps you can take today to see results.' },
        ];
        return templates.slice(0, count);
    }

    private calculateSEOScore(content: string, keywords: string[]): number {
        let score = 0;
        const wordCount = content.split(/\s+/).length;

        // Word count (20 points)
        if (wordCount >= 300) score += 5;
        if (wordCount >= 800) score += 10;
        if (wordCount >= 1500) score += 5;

        // Headings (20 points)
        if (content.includes('## ')) score += 10;
        if (content.includes('### ')) score += 5;
        if (content.includes('# ')) score += 5;

        // Keywords (30 points)
        const density = this.calculateKeywordDensity(content, keywords);
        if (density >= 1 && density <= 3) score += 30;
        else if (density > 0) score += 15;

        // Links (10 points)
        if (content.includes('http')) score += 10;

        // Lists (10 points)
        if (content.includes('- ') || content.includes('1. ')) score += 10;

        // Meta (10 points)
        if (content.length > 0) score += 10;

        return Math.min(100, score);
    }

    private calculateKeywordDensity(content: string, keywords: string[]): number {
        const words = content.toLowerCase().split(/\s+/);
        const totalWords = words.length;
        if (totalWords === 0) return 0;

        let keywordCount = 0;
        for (const keyword of keywords) {
            keywordCount += words.filter(w => w.includes(keyword.toLowerCase())).length;
        }

        return (keywordCount / totalWords) * 100;
    }

    private generateMetaTitle(content: string, keywords: string[]): string {
        const firstLine = content.split('\n')[0].replace(/^#\s*/, '');
        const title = firstLine.substring(0, 60);
        return title || `${keywords[0] || 'Content'} | Antigravity`;
    }

    private generateMetaDescription(content: string): string {
        const plainText = content.replace(/[#*_\[\]()]/g, '').trim();
        return plainText.substring(0, 155) + '...';
    }

    // ─── Public Getters ───────────────────────────────────────────────────────

    getContent(id: string): GeneratedContent | undefined {
        return this.generatedContent.get(id);
    }

    getAllContent(): GeneratedContent[] {
        return Array.from(this.generatedContent.values());
    }
}

// Export factory
export function createContentAgent(config?: Partial<ContentAgentConfig>): ContentAgent {
    return new ContentAgent(config);
}
