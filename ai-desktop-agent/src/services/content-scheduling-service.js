const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

/**
 * Content Scheduling Service - Social media scheduling and content management
 * Features: Schedule posts, manage content calendar, multi-platform publishing
 */
class ContentSchedulingService extends EventEmitter {
    constructor() {
        super();
        this.scheduledPosts = new Map(); // Scheduled posts
        this.publishedPosts = new Map(); // Published posts history
        this.contentCalendar = new Map(); // Content calendar
        this.platforms = new Map(); // Platform configurations
        this.checkInterval = 60000; // Check interval (1 minute)
        this.checkTimer = null;
        this.isRunning = false;
    }

    /**
     * Initialize content scheduling service
     * @param {Object} config - Configuration
     */
    async initialize(config = {}) {
        try {
            this.checkInterval = config.checkInterval || 60000;

            // Load saved data
            await this.loadScheduledPosts();
            await this.loadPublishedPosts();
            await this.loadContentCalendar();
            await this.loadPlatforms();

            console.log('[ContentSchedule] Content Scheduling Service initialized');
            return { success: true };
        } catch (error) {
            console.error('[ContentSchedule] Initialization error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Start scheduling service
     */
    async start() {
        if (this.isRunning) {
            console.log('[ContentSchedule] Already running');
            return { success: true };
        }

        console.log('[ContentSchedule] Starting scheduling service');
        this.isRunning = true;

        // Start periodic checks
        this.checkTimer = setInterval(() => {
            this.checkScheduledPosts();
        }, this.checkInterval);

        // Run initial check
        await this.checkScheduledPosts();

        return { success: true };
    }

    /**
     * Stop scheduling service
     */
    async stop() {
        if (!this.isRunning) {
            console.log('[ContentSchedule] Already stopped');
            return { success: true };
        }

        console.log('[ContentSchedule] Stopping scheduling service');
        this.isRunning = false;

        if (this.checkTimer) {
            clearInterval(this.checkTimer);
            this.checkTimer = null;
        }

        return { success: true };
    }

    /**
     * Check for posts to publish
     * @private
     */
    async checkScheduledPosts() {
        console.log('[ContentSchedule] Checking scheduled posts...');

        const now = new Date();
        const postsToPublish = [];

        // Find posts that are due
        for (const [postId, post] of this.scheduledPosts) {
            if (!post.published && new Date(post.scheduledTime) <= now) {
                postsToPublish.push(post);
            }
        }

        // Publish posts
        for (const post of postsToPublish) {
            try {
                await this.publishPost(post);
            } catch (error) {
                console.error(`[ContentSchedule] Failed to publish post ${post.id}:`, error);
            }
        }
    }

    /**
     * Publish post
     * @private
     */
    async publishPost(post) {
        console.log(`[ContentSchedule] Publishing post: ${post.id}`);

        let result;
        switch (post.platform) {
            case 'twitter':
                result = await this.publishToTwitter(post);
                break;
            case 'facebook':
                result = await this.publishToFacebook(post);
                break;
            case 'instagram':
                result = await this.publishToInstagram(post);
                break;
            case 'linkedin':
                result = await this.publishToLinkedIn(post);
                break;
            case 'tiktok':
                result = await this.publishToTikTok(post);
                break;
            case 'youtube':
                result = await this.publishToYouTube(post);
                break;
            default:
                throw new Error(`Unknown platform: ${post.platform}`);
        }

        if (result.success) {
            // Update post status
            post.published = true;
            post.publishedAt = new Date().toISOString();
            post.platformPostId = result.postId;
            post.platformUrl = result.postUrl;

            // Move to published posts
            this.publishedPosts.set(post.id, post);
            this.scheduledPosts.delete(post.id);

            // Save state
            await this.saveScheduledPosts();
            await this.savePublishedPosts();

            // Emit event
            this.emit('postPublished', post);

            console.log(`[ContentSchedule] Post published successfully: ${post.id}`);
        } else {
            // Mark as failed
            post.failed = true;
            post.error = result.error;
            post.failedAt = new Date().toISOString();

            // Save state
            await this.saveScheduledPosts();

            // Emit event
            this.emit('postFailed', post);

            console.error(`[ContentSchedule] Post failed to publish: ${post.id}`);
        }

        return result;
    }

    // ==================== PLATFORM PUBLISHING ====================

    /**
     * Publish to Twitter
     * @private
     */
    async publishToTwitter(post) {
        try {
            const platform = this.platforms.get('twitter');
            if (!platform || !platform.enabled) {
                throw new Error('Twitter not configured');
            }

            console.log('[ContentSchedule] Publishing to Twitter');

            const response = await axios.post(
                'https://api.twitter.com/2/tweets',
                {
                    text: post.content
                },
                {
                    headers: {
                        'Authorization': `Bearer ${platform.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                success: true,
                postId: response.data.data.id,
                postUrl: `https://twitter.com/i/status/${response.data.data.id}`
            };
        } catch (error) {
            console.error('[ContentSchedule] Twitter publish error:', error);
            return {
                success: false,
                error: error.response?.data?.detail || error.message
            };
        }
    }

    /**
     * Publish to Facebook
     * @private
     */
    async publishToFacebook(post) {
        try {
            const platform = this.platforms.get('facebook');
            if (!platform || !platform.enabled) {
                throw new Error('Facebook not configured');
            }

            console.log('[ContentSchedule] Publishing to Facebook');

            const response = await axios.post(
                `https://graph.facebook.com/v18.0/${platform.pageId}/feed`,
                {
                    message: post.content,
                    access_token: platform.accessToken
                }
            );

            return {
                success: true,
                postId: response.data.id,
                postUrl: `https://facebook.com/${response.data.id}`
            };
        } catch (error) {
            console.error('[ContentSchedule] Facebook publish error:', error);
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message
            };
        }
    }

    /**
     * Publish to Instagram
     * @private
     */
    async publishToInstagram(post) {
        try {
            const platform = this.platforms.get('instagram');
            if (!platform || !platform.enabled) {
                throw new Error('Instagram not configured');
            }

            console.log('[ContentSchedule] Publishing to Instagram');

            // Note: Instagram requires a multi-step process (upload -> publish)
            // This is a simplified placeholder
            return {
                success: false,
                error: 'Instagram publishing requires additional setup (upload container -> publish)'
            };
        } catch (error) {
            console.error('[ContentSchedule] Instagram publish error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Publish to LinkedIn
     * @private
     */
    async publishToLinkedIn(post) {
        try {
            const platform = this.platforms.get('linkedin');
            if (!platform || !platform.enabled) {
                throw new Error('LinkedIn not configured');
            }

            console.log('[ContentSchedule] Publishing to LinkedIn');

            const response = await axios.post(
                `https://api.linkedin.com/v2/ugcPosts`,
                {
                    author: `urn:li:person:${platform.personId}`,
                    lifecycleState: 'PUBLISHED',
                    specificContent: {
                        'com.linkedin.ugc.ShareContent': {
                            shareCommentary: {
                                text: post.content
                            },
                            shareMediaCategory: 'NONE'
                        }
                    },
                    visibility: {
                        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${platform.accessToken}`,
                        'Content-Type': 'application/json',
                        'X-Restli-Protocol-Version': '2.0.0'
                    }
                }
            );

            return {
                success: true,
                postId: response.data.id,
                postUrl: `https://linkedin.com/feed/update/${response.data.id}`
            };
        } catch (error) {
            console.error('[ContentSchedule] LinkedIn publish error:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    /**
     * Publish to TikTok
     * @private
     */
    async publishToTikTok(post) {
        try {
            const platform = this.platforms.get('tiktok');
            if (!platform || !platform.enabled) {
                throw new Error('TikTok not configured');
            }

            console.log('[ContentSchedule] Publishing to TikTok');

            // Note: TikTok requires video upload and publishing
            // This is a simplified placeholder
            return {
                success: false,
                error: 'TikTok publishing requires video upload and additional setup'
            };
        } catch (error) {
            console.error('[ContentSchedule] TikTok publish error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Publish to YouTube
     * @private
     */
    async publishToYouTube(post) {
        try {
            const platform = this.platforms.get('youtube');
            if (!platform || !platform.enabled) {
                throw new Error('YouTube not configured');
            }

            console.log('[ContentSchedule] Publishing to YouTube');

            // Note: YouTube requires video upload and metadata
            // This is a simplified placeholder
            return {
                success: false,
                error: 'YouTube publishing requires video upload and additional setup'
            };
        } catch (error) {
            console.error('[ContentSchedule] YouTube publish error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ==================== POST MANAGEMENT ====================

    /**
     * Schedule post
     * @param {Object} post - Post configuration
     * @returns {string} Post ID
     */
    schedulePost(post) {
        const postId = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const postConfig = {
            id: postId,
            platform: post.platform,
            content: post.content,
            media: post.media || [],
            scheduledTime: post.scheduledTime,
            timezone: post.timezone || 'UTC',
            tags: post.tags || [],
            metadata: post.metadata || {},
            createdAt: new Date().toISOString(),
            published: false,
            failed: false
        };

        this.scheduledPosts.set(postId, postConfig);
        console.log(`[ContentSchedule] Post scheduled: ${postId} for ${post.scheduledTime}`);

        // Add to content calendar
        this.addToContentCalendar(postConfig);

        // Save state
        this.saveScheduledPosts();
        this.saveContentCalendar();

        // Emit event
        this.emit('postScheduled', postConfig);

        return postId;
    }

    /**
     * Update scheduled post
     * @param {string} postId - Post ID
     * @param {Object} updates - Updates to apply
     */
    updateScheduledPost(postId, updates) {
        const post = this.scheduledPosts.get(postId);
        if (post) {
            const updatedPost = { ...post, ...updates };
            this.scheduledPosts.set(postId, updatedPost);
            console.log(`[ContentSchedule] Post updated: ${postId}`);

            // Update content calendar
            this.updateContentCalendar(updatedPost);

            // Save state
            this.saveScheduledPosts();
            this.saveContentCalendar();
        }
    }

    /**
     * Delete scheduled post
     * @param {string} postId - Post ID
     */
    deleteScheduledPost(postId) {
        const post = this.scheduledPosts.get(postId);
        if (post) {
            this.scheduledPosts.delete(postId);
            this.removeFromContentCalendar(postId);
            console.log(`[ContentSchedule] Post deleted: ${postId}`);

            // Save state
            this.saveScheduledPosts();
            this.saveContentCalendar();
        }
    }

    /**
     * Get scheduled posts
     * @param {Object} filters - Optional filters
     * @returns {Array} Posts array
     */
    getScheduledPosts(filters = {}) {
        let posts = Array.from(this.scheduledPosts.values());

        if (filters.platform) {
            posts = posts.filter(p => p.platform === filters.platform);
        }

        if (filters.startDate) {
            posts = posts.filter(p => new Date(p.scheduledTime) >= new Date(filters.startDate));
        }

        if (filters.endDate) {
            posts = posts.filter(p => new Date(p.scheduledTime) <= new Date(filters.endDate));
        }

        if (filters.tags && filters.tags.length > 0) {
            posts = posts.filter(p =>
                filters.tags.some(tag => p.tags.includes(tag))
            );
        }

        // Sort by scheduled time
        posts.sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));

        return posts;
    }

    /**
     * Get published posts
     * @param {Object} filters - Optional filters
     * @returns {Array} Posts array
     */
    getPublishedPosts(filters = {}) {
        let posts = Array.from(this.publishedPosts.values());

        if (filters.platform) {
            posts = posts.filter(p => p.platform === filters.platform);
        }

        if (filters.startDate) {
            posts = posts.filter(p => new Date(p.publishedAt) >= new Date(filters.startDate));
        }

        if (filters.endDate) {
            posts = posts.filter(p => new Date(p.publishedAt) <= new Date(filters.endDate));
        }

        // Sort by published time (descending)
        posts.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

        return posts;
    }

    /**
     * Get post by ID
     * @param {string} postId - Post ID
     * @returns {Object|null} Post or null
     */
    getPost(postId) {
        return this.scheduledPosts.get(postId) || this.publishedPosts.get(postId) || null;
    }

    // ==================== CONTENT CALENDAR ====================

    /**
     * Add to content calendar
     * @private
     */
    addToContentCalendar(post) {
        const date = new Date(post.scheduledTime).toISOString().split('T')[0];

        if (!this.contentCalendar.has(date)) {
            this.contentCalendar.set(date, []);
        }

        this.contentCalendar.get(date).push({
            postId: post.id,
            platform: post.platform,
            scheduledTime: post.scheduledTime,
            content: post.content.substring(0, 100) + '...'
        });
    }

    /**
     * Update content calendar
     * @private
     */
    updateContentCalendar(post) {
        // Remove old entry
        this.removeFromContentCalendar(post.id);

        // Add new entry
        this.addToContentCalendar(post);
    }

    /**
     * Remove from content calendar
     * @private
     */
    removeFromContentCalendar(postId) {
        for (const [date, posts] of this.contentCalendar) {
            const index = posts.findIndex(p => p.postId === postId);
            if (index !== -1) {
                posts.splice(index, 1);
                if (posts.length === 0) {
                    this.contentCalendar.delete(date);
                }
                break;
            }
        }
    }

    /**
     * Get content calendar
     * @param {Object} options - Calendar options
     * @returns {Object} Calendar data
     */
    getContentCalendar(options = {}) {
        const startDate = options.startDate
            ? new Date(options.startDate)
            : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

        const endDate = options.endDate
            ? new Date(options.endDate)
            : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days ahead

        const calendar = {};

        for (const [date, posts] of this.contentCalendar) {
            const dateObj = new Date(date);
            if (dateObj >= startDate && dateObj <= endDate) {
                calendar[date] = posts;
            }
        }

        return calendar;
    }

    /**
     * Get calendar summary
     * @param {Object} options - Summary options
     * @returns {Object} Summary data
     */
    getCalendarSummary(options = {}) {
        const calendar = this.getContentCalendar(options);
        const summary = {
            totalPosts: 0,
            byPlatform: {},
            byDate: {}
        };

        for (const [date, posts] of Object.entries(calendar)) {
            summary.totalPosts += posts.length;
            summary.byDate[date] = posts.length;

            for (const post of posts) {
                if (!summary.byPlatform[post.platform]) {
                    summary.byPlatform[post.platform] = 0;
                }
                summary.byPlatform[post.platform]++;
            }
        }

        return summary;
    }

    // ==================== PLATFORM MANAGEMENT ====================

    /**
     * Configure platform
     * @param {string} platform - Platform name
     * @param {Object} config - Platform configuration
     */
    configurePlatform(platform, config) {
        const platformConfig = {
            name: platform,
            enabled: config.enabled !== false,
            ...config,
            configuredAt: new Date().toISOString()
        };

        this.platforms.set(platform, platformConfig);
        console.log(`[ContentSchedule] Platform configured: ${platform}`);

        // Save state
        this.savePlatforms();
    }

    /**
     * Get platform configuration
     * @param {string} platform - Platform name
     * @returns {Object|null} Platform config or null
     */
    getPlatform(platform) {
        return this.platforms.get(platform) || null;
    }

    /**
     * Get all platforms
     * @returns {Array} Platforms array
     */
    getPlatforms() {
        return Array.from(this.platforms.values());
    }

    /**
     * Enable platform
     * @param {string} platform - Platform name
     */
    enablePlatform(platform) {
        const config = this.platforms.get(platform);
        if (config) {
            config.enabled = true;
            console.log(`[ContentSchedule] Platform enabled: ${platform}`);
            this.savePlatforms();
        }
    }

    /**
     * Disable platform
     * @param {string} platform - Platform name
     */
    disablePlatform(platform) {
        const config = this.platforms.get(platform);
        if (config) {
            config.enabled = false;
            console.log(`[ContentSchedule] Platform disabled: ${platform}`);
            this.savePlatforms();
        }
    }

    // ==================== BULK OPERATIONS ====================

    /**
     * Schedule multiple posts
     * @param {Array} posts - Array of post configurations
     * @returns {Array} Array of post IDs
     */
    scheduleBulkPosts(posts) {
        const postIds = [];

        for (const post of posts) {
            const postId = this.schedulePost(post);
            postIds.push(postId);
        }

        console.log(`[ContentSchedule] Scheduled ${postIds.length} posts in bulk`);
        return postIds;
    }

    /**
     * Delete multiple scheduled posts
     * @param {Array} postIds - Array of post IDs
     */
    deleteBulkPosts(postIds) {
        for (const postId of postIds) {
            this.deleteScheduledPost(postId);
        }

        console.log(`[ContentSchedule] Deleted ${postIds.length} posts in bulk`);
    }

    // ==================== PERSISTENCE ====================

    /**
     * Save scheduled posts to file
     * @private
     */
    async saveScheduledPosts() {
        try {
            const data = JSON.stringify(Array.from(this.scheduledPosts.entries()), null, 2);
            await fs.writeFile(
                path.join(__dirname, '../../data/scheduled-posts.json'),
                data,
                'utf-8'
            );
        } catch (error) {
            console.error('[ContentSchedule] Save scheduled posts error:', error);
        }
    }

    /**
     * Load scheduled posts from file
     * @private
     */
    async loadScheduledPosts() {
        try {
            const data = await fs.readFile(
                path.join(__dirname, '../../data/scheduled-posts.json'),
                'utf-8'
            );
            const entries = JSON.parse(data);
            this.scheduledPosts = new Map(entries);
            console.log(`[ContentSchedule] Loaded ${this.scheduledPosts.size} scheduled posts`);
        } catch (error) {
            console.log('[ContentSchedule] No saved scheduled posts found');
        }
    }

    /**
     * Save published posts to file
     * @private
     */
    async savePublishedPosts() {
        try {
            const data = JSON.stringify(Array.from(this.publishedPosts.entries()), null, 2);
            await fs.writeFile(
                path.join(__dirname, '../../data/published-posts.json'),
                data,
                'utf-8'
            );
        } catch (error) {
            console.error('[ContentSchedule] Save published posts error:', error);
        }
    }

    /**
     * Load published posts from file
     * @private
     */
    async loadPublishedPosts() {
        try {
            const data = await fs.readFile(
                path.join(__dirname, '../../data/published-posts.json'),
                'utf-8'
            );
            const entries = JSON.parse(data);
            this.publishedPosts = new Map(entries);
            console.log(`[ContentSchedule] Loaded ${this.publishedPosts.size} published posts`);
        } catch (error) {
            console.log('[ContentSchedule] No saved published posts found');
        }
    }

    /**
     * Save content calendar to file
     * @private
     */
    async saveContentCalendar() {
        try {
            const data = JSON.stringify(Array.from(this.contentCalendar.entries()), null, 2);
            await fs.writeFile(
                path.join(__dirname, '../../data/content-calendar.json'),
                data,
                'utf-8'
            );
        } catch (error) {
            console.error('[ContentSchedule] Save content calendar error:', error);
        }
    }

    /**
     * Load content calendar from file
     * @private
     */
    async loadContentCalendar() {
        try {
            const data = await fs.readFile(
                path.join(__dirname, '../../data/content-calendar.json'),
                'utf-8'
            );
            const entries = JSON.parse(data);
            this.contentCalendar = new Map(entries);
            console.log(`[ContentSchedule] Loaded content calendar with ${this.contentCalendar.size} dates`);
        } catch (error) {
            console.log('[ContentSchedule] No saved content calendar found');
        }
    }

    /**
     * Save platforms to file
     * @private
     */
    async savePlatforms() {
        try {
            const data = JSON.stringify(Array.from(this.platforms.entries()), null, 2);
            await fs.writeFile(
                path.join(__dirname, '../../data/platforms.json'),
                data,
                'utf-8'
            );
        } catch (error) {
            console.error('[ContentSchedule] Save platforms error:', error);
        }
    }

    /**
     * Load platforms from file
     * @private
     */
    async loadPlatforms() {
        try {
            const data = await fs.readFile(
                path.join(__dirname, '../../data/platforms.json'),
                'utf-8'
            );
            const entries = JSON.parse(data);
            this.platforms = new Map(entries);
            console.log(`[ContentSchedule] Loaded ${this.platforms.size} platform configurations`);
        } catch (error) {
            console.log('[ContentSchedule] No saved platforms found');
        }
    }

    /**
     * Cleanup
     */
    async cleanup() {
        console.log('[ContentSchedule] Cleaning up');

        // Stop scheduling
        await this.stop();

        // Save state
        await this.saveScheduledPosts();
        await this.savePublishedPosts();
        await this.saveContentCalendar();
        await this.savePlatforms();

        // Clear caches
        this.scheduledPosts.clear();
        this.publishedPosts.clear();
        this.contentCalendar.clear();
        this.platforms.clear();
    }
}

// Export singleton instance
const contentSchedulingService = new ContentSchedulingService();
module.exports = contentSchedulingService;
