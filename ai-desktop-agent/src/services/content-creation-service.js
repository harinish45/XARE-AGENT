const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

/**
 * Content Creation Service - Image generation and content templates
 * Features: Image generation (DALL-E, Stable Diffusion), content templates, batch processing
 */
class ContentCreationService {
    constructor() {
        this.dalleApiKey = null;
        this.stableDiffusionApiKey = null;
        this.openaiApiKey = null;
        this.templates = new Map(); // Content templates
        this.imageCache = new Map(); // Image cache
        this.generationHistory = []; // Generation history
    }

    /**
     * Initialize with API keys
     * @param {Object} config - Configuration with API keys
     */
    async initialize(config) {
        try {
            this.dalleApiKey = config.dalleApiKey || null;
            this.stableDiffusionApiKey = config.stableDiffusionApiKey || null;
            this.openaiApiKey = config.openaiApiKey || null;

            // Load default templates
            await this.loadDefaultTemplates();

            console.log('[Content] Content Creation Service initialized');
            return { success: true };
        } catch (error) {
            console.error('[Content] Initialization error:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== IMAGE GENERATION ====================

    /**
     * Generate image with DALL-E
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Generation result
     */
    async generateImageDalle(options) {
        try {
            if (!this.dalleApiKey) {
                throw new Error('DALL-E API key not configured');
            }

            console.log(`[Content] Generating DALL-E image: ${options.prompt}`);

            const response = await axios.post(
                'https://api.openai.com/v1/images/generations',
                {
                    model: options.model || 'dall-e-3',
                    prompt: options.prompt,
                    n: options.n || 1,
                    size: options.size || '1024x1024',
                    quality: options.quality || 'standard',
                    response_format: options.responseFormat || 'url'
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.dalleApiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const images = response.data.data;

            // Cache images
            images.forEach((img, index) => {
                const cacheKey = `dalle_${Date.now()}_${index}`;
                this.imageCache.set(cacheKey, {
                    url: img.url,
                    b64_json: img.b64_json,
                    revised_prompt: img.revised_prompt,
                    createdAt: new Date().toISOString()
                });
            });

            // Add to history
            this.generationHistory.push({
                type: 'dalle',
                prompt: options.prompt,
                images: images.map(img => img.url),
                timestamp: new Date().toISOString()
            });

            return {
                success: true,
                images: images.map(img => ({
                    url: img.url,
                    b64_json: img.b64_json,
                    revised_prompt: img.revised_prompt
                }))
            };
        } catch (error) {
            console.error('[Content] DALL-E generation error:', error);
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message
            };
        }
    }

    /**
     * Generate image with Stable Diffusion
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Generation result
     */
    async generateImageStableDiffusion(options) {
        try {
            if (!this.stableDiffusionApiKey) {
                throw new Error('Stable Diffusion API key not configured');
            }

            console.log(`[Content] Generating Stable Diffusion image: ${options.prompt}`);

            const response = await axios.post(
                'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
                {
                    text_prompts: [
                        {
                            text: options.prompt,
                            weight: options.weight || 1
                        }
                    ],
                    cfg_scale: options.cfgScale || 7,
                    height: options.height || 1024,
                    width: options.width || 1024,
                    steps: options.steps || 30,
                    samples: options.samples || 1,
                    seed: options.seed || 0
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.stableDiffusionApiKey}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }
            );

            const images = response.data.artifacts;

            // Cache images
            images.forEach((img, index) => {
                const cacheKey = `sd_${Date.now()}_${index}`;
                this.imageCache.set(cacheKey, {
                    base64: img.base64,
                    seed: img.seed,
                    createdAt: new Date().toISOString()
                });
            });

            // Add to history
            this.generationHistory.push({
                type: 'stable-diffusion',
                prompt: options.prompt,
                count: images.length,
                timestamp: new Date().toISOString()
            });

            return {
                success: true,
                images: images.map(img => ({
                    base64: img.base64,
                    seed: img.seed
                }))
            };
        } catch (error) {
            console.error('[Content] Stable Diffusion generation error:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    /**
     * Generate image with Midjourney (via Discord API)
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Generation result
     */
    async generateImageMidjourney(options) {
        try {
            console.log(`[Content] Generating Midjourney image: ${options.prompt}`);

            // Note: Midjourney requires Discord API integration
            // This is a placeholder for the actual implementation
            // You would need to use Discord API to interact with Midjourney bot

            return {
                success: false,
                error: 'Midjourney integration requires Discord API setup. Please configure Discord bot credentials.'
            };
        } catch (error) {
            console.error('[Content] Midjourney generation error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Edit image with DALL-E
     * @param {Object} options - Edit options
     * @returns {Promise<Object>} Edit result
     */
    async editImageDalle(options) {
        try {
            if (!this.dalleApiKey) {
                throw new Error('DALL-E API key not configured');
            }

            console.log('[Content] Editing image with DALL-E');

            const formData = new FormData();
            formData.append('image', options.image);
            formData.append('mask', options.mask);
            formData.append('prompt', options.prompt);
            formData.append('n', options.n || 1);
            formData.append('size', options.size || '1024x1024');

            const response = await axios.post(
                'https://api.openai.com/v1/images/edits',
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${this.dalleApiKey}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            const images = response.data.data;

            return {
                success: true,
                images: images.map(img => ({
                    url: img.url,
                    b64_json: img.b64_json
                }))
            };
        } catch (error) {
            console.error('[Content] DALL-E edit error:', error);
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message
            };
        }
    }

    /**
     * Create image variation with DALL-E
     * @param {Object} options - Variation options
     * @returns {Promise<Object>} Variation result
     */
    async createImageVariation(options) {
        try {
            if (!this.dalleApiKey) {
                throw new Error('DALL-E API key not configured');
            }

            console.log('[Content] Creating image variation');

            const formData = new FormData();
            formData.append('image', options.image);
            formData.append('n', options.n || 1);
            formData.append('size', options.size || '1024x1024');

            const response = await axios.post(
                'https://api.openai.com/v1/images/variations',
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${this.dalleApiKey}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            const images = response.data.data;

            return {
                success: true,
                images: images.map(img => ({
                    url: img.url,
                    b64_json: img.b64_json
                }))
            };
        } catch (error) {
            console.error('[Content] Image variation error:', error);
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message
            };
        }
    }

    /**
     * Upscale image
     * @param {Object} options - Upscale options
     * @returns {Promise<Object>} Upscale result
     */
    async upscaleImage(options) {
        try {
            if (!this.stableDiffusionApiKey) {
                throw new Error('Stable Diffusion API key not configured');
            }

            console.log('[Content] Upscaling image');

            const response = await axios.post(
                'https://api.stability.ai/v1/generation/esrgan-v1-x2plus/image-to-image/upscale',
                {
                    image: options.image,
                    width: options.width || 2048,
                    height: options.height || 2048
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.stableDiffusionApiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const image = response.data.artifacts[0];

            return {
                success: true,
                image: {
                    base64: image.base64,
                    seed: image.seed
                }
            };
        } catch (error) {
            console.error('[Content] Upscale error:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    /**
     * Remove background from image
     * @param {Object} options - Remove background options
     * @returns {Promise<Object>} Result
     */
    async removeBackground(options) {
        try {
            console.log('[Content] Removing background from image');

            // Using remove.bg API (requires API key)
            const formData = new FormData();
            formData.append('image_file', options.image);
            formData.append('size', options.size || 'auto');

            const response = await axios.post(
                'https://api.remove.bg/v1.0/removebg',
                formData,
                {
                    headers: {
                        'X-Api-Key': options.removeBgApiKey || '',
                        'Content-Type': 'multipart/form-data'
                    },
                    responseType: 'arraybuffer'
                }
            );

            const base64 = Buffer.from(response.data).toString('base64');

            return {
                success: true,
                image: {
                    base64,
                    format: 'png'
                }
            };
        } catch (error) {
            console.error('[Content] Remove background error:', error);
            return {
                success: false,
                error: error.response?.data?.errors?.[0]?.title || error.message
            };
        }
    }

    /**
     * Batch generate images
     * @param {Array} prompts - Array of prompts
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} Batch result
     */
    async batchGenerateImages(prompts, options = {}) {
        try {
            console.log(`[Content] Batch generating ${prompts.length} images`);

            const results = [];
            const service = options.service || 'dalle';

            for (const prompt of prompts) {
                let result;
                if (service === 'dalle') {
                    result = await this.generateImageDalle({ ...options, prompt });
                } else if (service === 'stable-diffusion') {
                    result = await this.generateImageStableDiffusion({ ...options, prompt });
                }

                results.push({
                    prompt,
                    success: result.success,
                    images: result.images || [],
                    error: result.error
                });

                // Add delay between requests to avoid rate limiting
                if (options.delay) {
                    await new Promise(resolve => setTimeout(resolve, options.delay));
                }
            }

            return {
                success: true,
                results,
                total: prompts.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length
            };
        } catch (error) {
            console.error('[Content] Batch generation error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ==================== CONTENT TEMPLATES ====================

    /**
     * Load default templates
     * @private
     */
    async loadDefaultTemplates() {
        const defaultTemplates = [
            {
                id: 'blog-post',
                name: 'Blog Post',
                category: 'writing',
                template: `# {title}

## Introduction
{introduction}

## Main Content
{content}

## Conclusion
{conclusion}

---
*Generated by AI Desktop Agent*`,
                variables: ['title', 'introduction', 'content', 'conclusion']
            },
            {
                id: 'social-media',
                name: 'Social Media Post',
                category: 'social',
                template: `{hook}

{main_message}

{call_to_action}

{hashtags}`,
                variables: ['hook', 'main_message', 'call_to_action', 'hashtags']
            },
            {
                id: 'email',
                name: 'Email Template',
                category: 'email',
                template: `Subject: {subject}

Dear {recipient_name},

{greeting}

{body}

{closing}

Best regards,
{sender_name}`,
                variables: ['subject', 'recipient_name', 'greeting', 'body', 'closing', 'sender_name']
            },
            {
                id: 'product-description',
                name: 'Product Description',
                category: 'ecommerce',
                template: `# {product_name}

{headline}

## Features
{features}

## Benefits
{benefits}

## Specifications
{specifications}

## Price: {price}

{call_to_action}`,
                variables: ['product_name', 'headline', 'features', 'benefits', 'specifications', 'price', 'call_to_action']
            },
            {
                id: 'press-release',
                name: 'Press Release',
                category: 'business',
                template: `FOR IMMEDIATE RELEASE

{headline}

{dateline}

{body}

### About {company_name}
{about_company}

Media Contact:
{contact_name}
{contact_email}
{contact_phone}

###`,
                variables: ['headline', 'dateline', 'body', 'company_name', 'about_company', 'contact_name', 'contact_email', 'contact_phone']
            },
            {
                id: 'meeting-notes',
                name: 'Meeting Notes',
                category: 'business',
                template: `# Meeting Notes

**Date:** {date}
**Time:** {time}
**Location:** {location}
**Attendees:** {attendees}

## Agenda
{agenda}

## Discussion
{discussion}

## Action Items
{action_items}

## Next Steps
{next_steps}

---
*Notes taken by {note_taker}*`,
                variables: ['date', 'time', 'location', 'attendees', 'agenda', 'discussion', 'action_items', 'next_steps', 'note_taker']
            },
            {
                id: 'code-comment',
                name: 'Code Comment Template',
                category: 'development',
                template: `/**
 * {description}
 * 
 * @param {params} - {params_description}
 * @returns {returns_description}
 * 
 * @example
 * {example}
 * 
 * @author {author}
 * @since {since}
 */`,
                variables: ['description', 'params', 'params_description', 'returns_description', 'example', 'author', 'since']
            },
            {
                id: 'video-script',
                name: 'Video Script',
                category: 'video',
                template: `# {video_title}

## Duration: {duration}
## Target Audience: {target_audience}

### Opening (0:00 - {opening_duration})
{opening}

### Main Content ({main_start} - {main_end})
{main_content}

### Closing ({closing_start} - {closing_end})
{closing}

## Call to Action
{call_to_action}

## Notes
{notes}`,
                variables: ['video_title', 'duration', 'target_audience', 'opening_duration', 'opening', 'main_start', 'main_end', 'main_content', 'closing_start', 'closing_end', 'closing', 'call_to_action', 'notes']
            }
        ];

        defaultTemplates.forEach(template => {
            this.templates.set(template.id, template);
        });

        console.log(`[Content] Loaded ${defaultTemplates.length} default templates`);
    }

    /**
     * Create custom template
     * @param {Object} template - Template configuration
     * @returns {string} Template ID
     */
    createTemplate(template) {
        const templateId = template.id || `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const templateConfig = {
            id: templateId,
            name: template.name,
            category: template.category || 'custom',
            template: template.template,
            variables: template.variables || [],
            createdAt: new Date().toISOString()
        };

        this.templates.set(templateId, templateConfig);
        console.log(`[Content] Template created: ${templateId}`);

        return templateId;
    }

    /**
     * Get template by ID
     * @param {string} templateId - Template ID
     * @returns {Object|null} Template or null
     */
    getTemplate(templateId) {
        return this.templates.get(templateId) || null;
    }

    /**
     * Get all templates
     * @param {string} category - Optional category filter
     * @returns {Array} Array of templates
     */
    getTemplates(category = null) {
        const templates = Array.from(this.templates.values());

        if (category) {
            return templates.filter(t => t.category === category);
        }

        return templates;
    }

    /**
     * Delete template
     * @param {string} templateId - Template ID to delete
     */
    deleteTemplate(templateId) {
        this.templates.delete(templateId);
        console.log(`[Content] Template deleted: ${templateId}`);
    }

    /**
     * Fill template with variables
     * @param {string} templateId - Template ID
     * @param {Object} variables - Variable values
     * @returns {string} Filled content
     */
    fillTemplate(templateId, variables) {
        const template = this.getTemplate(templateId);

        if (!template) {
            throw new Error(`Template not found: ${templateId}`);
        }

        let content = template.template;

        // Replace variables
        for (const [key, value] of Object.entries(variables)) {
            const placeholder = `{${key}}`;
            content = content.replace(new RegExp(placeholder, 'g'), value || '');
        }

        return content;
    }

    /**
     * Generate content from template using AI
     * @param {string} templateId - Template ID
     * @param {Object} context - Context for AI generation
     * @returns {Promise<Object>} Generated content
     */
    async generateFromTemplate(templateId, context) {
        try {
            if (!this.openaiApiKey) {
                throw new Error('OpenAI API key not configured');
            }

            const template = this.getTemplate(templateId);

            if (!template) {
                throw new Error(`Template not found: ${templateId}`);
            }

            console.log(`[Content] Generating content from template: ${templateId}`);

            // Build prompt for AI
            const prompt = this.buildPromptFromTemplate(template, context);

            // Call OpenAI API
            const response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: context.model || 'gpt-4',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful content generation assistant. Generate high-quality content based on the provided template and context.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: context.temperature || 0.7,
                    max_tokens: context.maxTokens || 2000
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.openaiApiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const generatedContent = response.data.choices[0].message.content;

            return {
                success: true,
                content: generatedContent,
                templateId,
                model: context.model || 'gpt-4'
            };
        } catch (error) {
            console.error('[Content] Generate from template error:', error);
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message
            };
        }
    }

    /**
     * Build prompt from template
     * @private
     */
    buildPromptFromTemplate(template, context) {
        let prompt = `Generate content using this template:\n\n${template.template}\n\n`;

        prompt += `Context:\n`;
        for (const [key, value] of Object.entries(context)) {
            if (key !== 'model' && key !== 'temperature' && key !== 'maxTokens') {
                prompt += `- ${key}: ${value}\n`;
            }
        }

        prompt += `\nPlease fill in all the placeholders {variable_name} with appropriate content based on the context provided.`;

        return prompt;
    }

    /**
     * Save generated content to file
     * @param {string} content - Content to save
     * @param {string} filepath - File path
     * @returns {Promise<Object>} Save result
     */
    async saveContentToFile(content, filepath) {
        try {
            const dir = path.dirname(filepath);
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(filepath, content, 'utf-8');

            console.log(`[Content] Content saved to: ${filepath}`);

            return {
                success: true,
                filepath
            };
        } catch (error) {
            console.error('[Content] Save content error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Save image to file
     * @param {string} base64 - Base64 image data
     * @param {string} filepath - File path
     * @returns {Promise<Object>} Save result
     */
    async saveImageToFile(base64, filepath) {
        try {
            const dir = path.dirname(filepath);
            await fs.mkdir(dir, { recursive: true });

            const buffer = Buffer.from(base64, 'base64');
            await fs.writeFile(filepath, buffer);

            console.log(`[Content] Image saved to: ${filepath}`);

            return {
                success: true,
                filepath
            };
        } catch (error) {
            console.error('[Content] Save image error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get generation history
     * @param {number} limit - Limit number of results
     * @returns {Array} History array
     */
    getGenerationHistory(limit = 50) {
        return this.generationHistory.slice(-limit);
    }

    /**
     * Clear generation history
     */
    clearGenerationHistory() {
        this.generationHistory = [];
        console.log('[Content] Generation history cleared');
    }

    /**
     * Get cached images
     * @returns {Array} Cached images
     */
    getCachedImages() {
        return Array.from(this.imageCache.entries()).map(([key, value]) => ({
            key,
            ...value
        }));
    }

    /**
     * Clear image cache
     */
    clearImageCache() {
        this.imageCache.clear();
        console.log('[Content] Image cache cleared');
    }

    /**
     * Export templates
     * @returns {Array} Templates array
     */
    exportTemplates() {
        return Array.from(this.templates.values());
    }

    /**
     * Import templates
     * @param {Array} templates - Templates to import
     */
    importTemplates(templates) {
        templates.forEach(template => {
            this.templates.set(template.id, template);
        });

        console.log(`[Content] Imported ${templates.length} templates`);
    }

    /**
     * Cleanup
     */
    async cleanup() {
        console.log('[Content] Cleaning up');

        // Clear caches
        this.imageCache.clear();
        this.generationHistory = [];
        this.templates.clear();

        // Reload default templates
        await this.loadDefaultTemplates();
    }
}

// Export singleton instance
const contentCreationService = new ContentCreationService();
module.exports = contentCreationService;
