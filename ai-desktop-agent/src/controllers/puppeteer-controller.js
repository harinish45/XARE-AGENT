/**
 * Puppeteer Browser Controller
 * Full browser automation with Puppeteer
 */

const puppeteer = require('puppeteer');
const EventEmitter = require('events');

class PuppeteerController extends EventEmitter {
    constructor() {
        super();
        this.browser = null;
        this.pages = new Map();
        this.contexts = new Map();
        this.isConnected = false;
        this.defaultOptions = {
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        };
    }

    /**
     * Initialize Puppeteer browser
     */
    async initialize(options = {}) {
        try {
            console.log('[Puppeteer] Initializing browser...');

            const launchOptions = {
                ...this.defaultOptions,
                ...options
            };

            this.browser = await puppeteer.launch(launchOptions);
            this.isConnected = true;

            this.emit('initialized');
            console.log('[Puppeteer] Browser initialized successfully');

            return { success: true, browser: this.browser };
        } catch (error) {
            console.error('[Puppeteer] Initialization error:', error);
            this.emit('error', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Create new page
     */
    async createPage(options = {}) {
        try {
            if (!this.browser) {
                await this.initialize();
            }

            const page = await this.browser.newPage();
            const pageId = `page_${Date.now()}`;

            // Set default viewport
            await page.setViewport({
                width: options.width || 1920,
                height: options.height || 1080,
                deviceScaleFactor: 1
            });

            // Set user agent
            await page.setUserAgent(options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

            // Enable request interception if needed
            if (options.interceptRequests) {
                await page.setRequestInterception(true);
            }

            // Store page
            this.pages.set(pageId, {
                id: pageId,
                page,
                url: null,
                title: null,
                createdAt: new Date().toISOString()
            });

            // Setup event listeners
            this.setupPageListeners(page, pageId);

            this.emit('page-created', { pageId, page });
            console.log(`[Puppeteer] Page created: ${pageId}`);

            return { success: true, pageId, page };
        } catch (error) {
            console.error('[Puppeteer] Page creation error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Setup page event listeners
     */
    setupPageListeners(page, pageId) {
        page.on('load', async () => {
            const url = page.url();
            const title = await page.title();
            const pageInfo = this.pages.get(pageId);
            if (pageInfo) {
                pageInfo.url = url;
                pageInfo.title = title;
            }
            this.emit('page-loaded', { pageId, url, title });
        });

        page.on('error', (error) => {
            this.emit('page-error', { pageId, error });
        });

        page.on('console', (msg) => {
            this.emit('page-console', { pageId, message: msg.text(), type: msg.type() });
        });

        page.on('requestfailed', (request) => {
            this.emit('request-failed', { pageId, url: request.url(), failure: request.failure() });
        });
    }

    /**
     * Navigate to URL
     */
    async navigate(pageId, url, options = {}) {
        try {
            const pageInfo = this.pages.get(pageId);
            if (!pageInfo) {
                return { success: false, error: 'Page not found' };
            }

            const { page } = pageInfo;

            console.log(`[Puppeteer] Navigating to: ${url}`);

            const response = await page.goto(url, {
                waitUntil: options.waitUntil || 'networkidle2',
                timeout: options.timeout || 30000
            });

            pageInfo.url = url;
            pageInfo.title = await page.title();

            this.emit('navigated', { pageId, url, response });

            return {
                success: true,
                url,
                status: response?.status(),
                title: pageInfo.title
            };
        } catch (error) {
            console.error('[Puppeteer] Navigation error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Click element
     */
    async clickElement(pageId, selector, options = {}) {
        try {
            const pageInfo = this.pages.get(pageId);
            if (!pageInfo) {
                return { success: false, error: 'Page not found' };
            }

            const { page } = pageInfo;

            // Wait for element
            await this.waitForElement(pageId, selector, options);

            // Click element
            await page.click(selector, {
                button: options.button || 'left',
                clickCount: options.clickCount || 1,
                delay: options.delay || 0
            });

            this.emit('element-clicked', { pageId, selector });

            return { success: true, selector };
        } catch (error) {
            console.error('[Puppeteer] Click error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Type text into element
     */
    async typeText(pageId, selector, text, options = {}) {
        try {
            const pageInfo = this.pages.get(pageId);
            if (!pageInfo) {
                return { success: false, error: 'Page not found' };
            }

            const { page } = pageInfo;

            // Wait for element
            await this.waitForElement(pageId, selector, options);

            // Clear existing text if needed
            if (options.clear !== false) {
                await page.click(selector, { clickCount: 3 });
            }

            // Type text
            await page.type(selector, text, {
                delay: options.delay || 10
            });

            this.emit('text-typed', { pageId, selector, text });

            return { success: true, selector, text };
        } catch (error) {
            console.error('[Puppeteer] Type error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get element text
     */
    async getElementText(pageId, selector, options = {}) {
        try {
            const pageInfo = this.pages.get(pageId);
            if (!pageInfo) {
                return { success: false, error: 'Page not found' };
            }

            const { page } = pageInfo;

            // Wait for element
            await this.waitForElement(pageId, selector, options);

            // Get text
            const text = await page.$eval(selector, el => el.textContent || el.innerText);

            return { success: true, selector, text };
        } catch (error) {
            console.error('[Puppeteer] Get text error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get element attribute
     */
    async getElementAttribute(pageId, selector, attribute, options = {}) {
        try {
            const pageInfo = this.pages.get(pageId);
            if (!pageInfo) {
                return { success: false, error: 'Page not found' };
            }

            const { page } = pageInfo;

            // Wait for element
            await this.waitForElement(pageId, selector, options);

            // Get attribute
            const value = await page.$eval(selector, (el, attr) => el.getAttribute(attr), attribute);

            return { success: true, selector, attribute, value };
        } catch (error) {
            console.error('[Puppeteer] Get attribute error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Wait for element
     */
    async waitForElement(pageId, selector, options = {}) {
        try {
            const pageInfo = this.pages.get(pageId);
            if (!pageInfo) {
                return { success: false, error: 'Page not found' };
            }

            const { page } = pageInfo;

            await page.waitForSelector(selector, {
                visible: options.visible !== false,
                timeout: options.timeout || 30000,
                hidden: options.hidden || false
            });

            return { success: true, selector };
        } catch (error) {
            console.error('[Puppeteer] Wait for element error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Wait for navigation
     */
    async waitForNavigation(pageId, options = {}) {
        try {
            const pageInfo = this.pages.get(pageId);
            if (!pageInfo) {
                return { success: false, error: 'Page not found' };
            }

            const { page } = pageInfo;

            await page.waitForNavigation({
                waitUntil: options.waitUntil || 'networkidle2',
                timeout: options.timeout || 30000
            });

            return { success: true };
        } catch (error) {
            console.error('[Puppeteer] Wait for navigation error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Wait for function
     */
    async waitForFunction(pageId, pageFunction, options = {}) {
        try {
            const pageInfo = this.pages.get(pageId);
            if (!pageInfo) {
                return { success: false, error: 'Page not found' };
            }

            const { page } = pageInfo;

            const result = await page.waitForFunction(pageFunction, options.args || {}, {
                polling: options.polling || 'raf',
                timeout: options.timeout || 30000
            });

            return { success: true, result };
        } catch (error) {
            console.error('[Puppeteer] Wait for function error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Execute JavaScript
     */
    async executeScript(pageId, script, options = {}) {
        try {
            const pageInfo = this.pages.get(pageId);
            if (!pageInfo) {
                return { success: false, error: 'Page not found' };
            }

            const { page } = pageInfo;

            const result = await page.evaluate(script, options.args || {});

            this.emit('script-executed', { pageId, script, result });

            return { success: true, result };
        } catch (error) {
            console.error('[Puppeteer] Execute script error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Screenshot
     */
    async screenshot(pageId, options = {}) {
        try {
            const pageInfo = this.pages.get(pageId);
            if (!pageInfo) {
                return { success: false, error: 'Page not found' };
            }

            const { page } = pageInfo;

            const screenshot = await page.screenshot({
                type: options.type || 'png',
                path: options.path,
                fullPage: options.fullPage !== false,
                clip: options.clip,
                encoding: options.encoding || 'base64'
            });

            this.emit('screenshot-taken', { pageId, options });

            return { success: true, screenshot };
        } catch (error) {
            console.error('[Puppeteer] Screenshot error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * PDF
     */
    async pdf(pageId, options = {}) {
        try {
            const pageInfo = this.pages.get(pageId);
            if (!pageInfo) {
                return { success: false, error: 'Page not found' };
            }

            const { page } = pageInfo;

            const pdf = await page.pdf({
                path: options.path,
                format: options.format || 'A4',
                printBackground: options.printBackground !== false,
                margin: options.margin || {}
            });

            this.emit('pdf-generated', { pageId, options });

            return { success: true, pdf };
        } catch (error) {
            console.error('[Puppeteer] PDF error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get page content
     */
    async getContent(pageId, options = {}) {
        try {
            const pageInfo = this.pages.get(pageId);
            if (!pageInfo) {
                return { success: false, error: 'Page not found' };
            }

            const { page } = pageInfo;

            let content;
            if (options.html) {
                content = await page.content();
            } else {
                content = await page.evaluate(() => document.body.innerText);
            }

            return { success: true, content };
        } catch (error) {
            console.error('[Puppeteer] Get content error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get page URL
     */
    async getUrl(pageId) {
        try {
            const pageInfo = this.pages.get(pageId);
            if (!pageInfo) {
                return { success: false, error: 'Page not found' };
            }

            const { page } = pageInfo;
            const url = page.url();

            return { success: true, url };
        } catch (error) {
            console.error('[Puppeteer] Get URL error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get page title
     */
    async getTitle(pageId) {
        try {
            const pageInfo = this.pages.get(pageId);
            if (!pageInfo) {
                return { success: false, error: 'Page not found' };
            }

            const { page } = pageInfo;
            const title = await page.title();

            return { success: true, title };
        } catch (error) {
            console.error('[Puppeteer] Get title error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Scroll page
     */
    async scroll(pageId, options = {}) {
        try {
            const pageInfo = this.pages.get(pageId);
            if (!pageInfo) {
                return { success: false, error: 'Page not found' };
            }

            const { page } = pageInfo;

            await page.evaluate((options) => {
                const scrollAmount = options.amount || 500;
                const scrollDirection = options.direction || 'down';

                if (scrollDirection === 'down') {
                    window.scrollBy(0, scrollAmount);
                } else if (scrollDirection === 'up') {
                    window.scrollBy(0, -scrollAmount);
                } else if (scrollDirection === 'left') {
                    window.scrollBy(-scrollAmount, 0);
                } else if (scrollDirection === 'right') {
                    window.scrollBy(scrollAmount, 0);
                } else if (options.to === 'top') {
                    window.scrollTo(0, 0);
                } else if (options.to === 'bottom') {
                    window.scrollTo(0, document.body.scrollHeight);
                }
            }, options);

            this.emit('page-scrolled', { pageId, options });

            return { success: true };
        } catch (error) {
            console.error('[Puppeteer] Scroll error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Handle Shadow DOM
     */
    async findInShadowDOM(pageId, selector, options = {}) {
        try {
            const pageInfo = this.pages.get(pageId);
            if (!pageInfo) {
                return { success: false, error: 'Page not found' };
            }

            const { page } = pageInfo;

            const element = await page.evaluateHandle((selector) => {
                function findElement(root, selector) {
                    // Check direct children
                    const element = root.querySelector(selector);
                    if (element) return element;

                    // Check shadow roots
                    for (const child of root.children) {
                        if (child.shadowRoot) {
                            const found = findElement(child.shadowRoot, selector);
                            if (found) return found;
                        }
                    }

                    return null;
                }

                return findElement(document.body, selector);
            }, selector);

            return { success: true, element };
        } catch (error) {
            console.error('[Puppeteer] Shadow DOM error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Handle frames/iframes
     */
    async switchToFrame(pageId, frameSelector, options = {}) {
        try {
            const pageInfo = this.pages.get(pageId);
            if (!pageInfo) {
                return { success: false, error: 'Page not found' };
            }

            const { page } = pageInfo;

            // Get all frames
            const frames = page.frames();

            let targetFrame;
            if (options.byIndex !== undefined) {
                targetFrame = frames[options.byIndex];
            } else if (options.byName) {
                targetFrame = frames.find(f => f.name() === options.byName);
            } else if (options.byUrl) {
                targetFrame = frames.find(f => f.url().includes(options.byUrl));
            } else if (frameSelector) {
                // Find frame by selector
                for (const frame of frames) {
                    const element = await frame.$(frameSelector);
                    if (element) {
                        targetFrame = frame;
                        break;
                    }
                }
            }

            if (!targetFrame) {
                return { success: false, error: 'Frame not found' };
            }

            // Store current frame context
            const contextId = `context_${Date.now()}`;
            this.contexts.set(contextId, {
                pageId,
                frame: targetFrame,
                previousFrame: null
            });

            this.emit('frame-switched', { pageId, frame: targetFrame });

            return { success: true, frameId: contextId };
        } catch (error) {
            console.error('[Puppeteer] Frame switch error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Intercept network requests
     */
    async interceptRequests(pageId, callback) {
        try {
            const pageInfo = this.pages.get(pageId);
            if (!pageInfo) {
                return { success: false, error: 'Page not found' };
            }

            const { page } = pageInfo;

            await page.setRequestInterception(true);

            page.on('request', (request) => {
                callback(request);
            });

            return { success: true };
        } catch (error) {
            console.error('[Puppeteer] Intercept requests error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get cookies
     */
    async getCookies(pageId, urls = []) {
        try {
            const pageInfo = this.pages.get(pageId);
            if (!pageInfo) {
                return { success: false, error: 'Page not found' };
            }

            const { page } = pageInfo;

            const cookies = await page.cookies(...urls);

            return { success: true, cookies };
        } catch (error) {
            console.error('[Puppeteer] Get cookies error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Set cookies
     */
    async setCookies(pageId, cookies) {
        try {
            const pageInfo = this.pages.get(pageId);
            if (!pageInfo) {
                return { success: false, error: 'Page not found' };
            }

            const { page } = pageInfo;

            await page.setCookie(...cookies);

            this.emit('cookies-set', { pageId, cookies });

            return { success: true };
        } catch (error) {
            console.error('[Puppeteer] Set cookies error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Close page
     */
    async closePage(pageId) {
        try {
            const pageInfo = this.pages.get(pageId);
            if (!pageInfo) {
                return { success: false, error: 'Page not found' };
            }

            const { page } = pageInfo;
            await page.close();

            this.pages.delete(pageId);

            this.emit('page-closed', { pageId });
            console.log(`[Puppeteer] Page closed: ${pageId}`);

            return { success: true };
        } catch (error) {
            console.error('[Puppeteer] Close page error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get all pages
     */
    getPages() {
        return Array.from(this.pages.values()).map(p => ({
            id: p.id,
            url: p.url,
            title: p.title,
            createdAt: p.createdAt
        }));
    }

    /**
     * Get page by ID
     */
    getPage(pageId) {
        return this.pages.get(pageId) || null;
    }

    /**
     * Close browser
     */
    async close() {
        try {
            if (this.browser) {
                await this.browser.close();
                this.browser = null;
                this.isConnected = false;
                this.pages.clear();
                this.contexts.clear();

                this.emit('closed');
                console.log('[Puppeteer] Browser closed');
            }

            return { success: true };
        } catch (error) {
            console.error('[Puppeteer] Close error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get status
     */
    getStatus() {
        return {
            isConnected: this.isConnected,
            pages: this.pages.size,
            contexts: this.contexts.size
        };
    }
}

module.exports = new PuppeteerController();
