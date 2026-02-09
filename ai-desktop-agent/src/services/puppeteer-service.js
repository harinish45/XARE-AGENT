const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Puppeteer Service - Full browser automation with Puppeteer
 * Features: Multi-tab management, cookies, CAPTCHA, screenshots, data extraction
 */
class PuppeteerService {
    constructor() {
        this.browser = null;
        this.pages = new Map(); // Store pages by ID
        this.currentPageId = null;
        this.cookies = [];
        this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        this.downloadPath = path.join(os.homedir(), 'Downloads', 'ai-desktop-agent');
        this.screenshotPath = path.join(os.tmpdir(), 'ai-desktop-agent', 'screenshots');
        this.ensureDirectories();
    }

    ensureDirectories() {
        if (!fs.existsSync(this.downloadPath)) {
            fs.mkdirSync(this.downloadPath, { recursive: true });
        }
        if (!fs.existsSync(this.screenshotPath)) {
            fs.mkdirSync(this.screenshotPath, { recursive: true });
        }
    }

    /**
     * Launch browser with options
     * @param {Object} options - Browser launch options
     * @returns {Promise<Browser>} Puppeteer browser instance
     */
    async launch(options = {}) {
        try {
            const launchOptions = {
                headless: options.headless !== false,
                defaultViewport: options.viewport || { width: 1920, height: 1080 },
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-web-security',
                    '--disable-features=IsolateOrigins,site-per-process'
                ],
                ...options
            };

            this.browser = await puppeteer.launch(launchOptions);
            console.log('[Puppeteer] Browser launched successfully');

            // Set up download behavior
            const pages = await this.browser.pages();
            if (pages.length > 0) {
                await this.setupPage(pages[0]);
            }

            return this.browser;
        } catch (error) {
            console.error('[Puppeteer] Launch error:', error);
            throw new Error(`Failed to launch browser: ${error.message}`);
        }
    }

    /**
     * Setup page with default configurations
     * @param {Page} page - Puppeteer page instance
     * @returns {Promise<string>} Page ID
     */
    async setupPage(page) {
        const pageId = `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Set user agent
        await page.setUserAgent(this.userAgent);

        // Set download behavior
        const client = await page.target().createCDPSession();
        await client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: this.downloadPath
        });

        // Set viewport
        await page.setViewport({ width: 1920, height: 1080 });

        // Enable request interception for debugging
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            request.continue();
        });

        // Store page
        this.pages.set(pageId, page);
        this.currentPageId = pageId;

        console.log(`[Puppeteer] Page setup complete: ${pageId}`);
        return pageId;
    }

    /**
     * Navigate to URL
     * @param {string} url - URL to navigate to
     * @param {Object} options - Navigation options
     * @returns {Promise<Object>} Navigation result
     */
    async navigate(url, options = {}) {
        try {
            if (!this.browser) {
                await this.launch();
            }

            let page;
            if (options.newTab || !this.currentPageId) {
                page = await this.browser.newPage();
                await this.setupPage(page);
            } else {
                page = this.pages.get(this.currentPageId);
            }

            console.log(`[Puppeteer] Navigating to: ${url}`);

            const response = await page.goto(url, {
                waitUntil: options.waitUntil || 'networkidle2',
                timeout: options.timeout || 30000
            });

            // Wait for page to be ready
            if (options.waitForSelector) {
                await page.waitForSelector(options.waitForSelector, { timeout: 10000 });
            }

            return {
                success: true,
                url: page.url(),
                status: response?.status(),
                pageId: this.currentPageId
            };
        } catch (error) {
            console.error('[Puppeteer] Navigation error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Click element by selector
     * @param {string} selector - CSS selector
     * @param {Object} options - Click options
     * @returns {Promise<Object>} Click result
     */
    async click(selector, options = {}) {
        try {
            const page = this.pages.get(this.currentPageId);
            if (!page) {
                throw new Error('No active page');
            }

            console.log(`[Puppeteer] Clicking: ${selector}`);

            // Wait for element
            await page.waitForSelector(selector, { timeout: options.timeout || 10000 });

            // Click element
            await page.click(selector, {
                button: options.button || 'left',
                clickCount: options.clickCount || 1,
                delay: options.delay || 0
            });

            // Wait for navigation if expected
            if (options.waitForNavigation) {
                await page.waitForNavigation({ waitUntil: 'networkidle2' });
            }

            return { success: true };
        } catch (error) {
            console.error('[Puppeteer] Click error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Type text into element
     * @param {string} selector - CSS selector
     * @param {string} text - Text to type
     * @param {Object} options - Type options
     * @returns {Promise<Object>} Type result
     */
    async type(selector, text, options = {}) {
        try {
            const page = this.pages.get(this.currentPageId);
            if (!page) {
                throw new Error('No active page');
            }

            console.log(`[Puppeteer] Typing into: ${selector}`);

            // Wait for element
            await page.waitForSelector(selector, { timeout: options.timeout || 10000 });

            // Clear field if requested
            if (options.clear) {
                await page.click(selector);
                await page.keyboard.down('Control');
                await page.keyboard.press('A');
                await page.keyboard.up('Control');
                await page.keyboard.press('Backspace');
            }

            // Type text
            await page.type(selector, text, {
                delay: options.delay || 50
            });

            return { success: true };
        } catch (error) {
            console.error('[Puppeteer] Type error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Select option from dropdown
     * @param {string} selector - CSS selector
     * @param {string} value - Value to select
     * @returns {Promise<Object>} Select result
     */
    async select(selector, value) {
        try {
            const page = this.pages.get(this.currentPageId);
            if (!page) {
                throw new Error('No active page');
            }

            console.log(`[Puppeteer] Selecting: ${value} from ${selector}`);

            await page.waitForSelector(selector, { timeout: 10000 });
            await page.select(selector, value);

            return { success: true };
        } catch (error) {
            console.error('[Puppeteer] Select error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Extract text from element
     * @param {string} selector - CSS selector
     * @returns {Promise<Object>} Extract result
     */
    async extractText(selector) {
        try {
            const page = this.pages.get(this.currentPageId);
            if (!page) {
                throw new Error('No active page');
            }

            await page.waitForSelector(selector, { timeout: 10000 });
            const text = await page.$eval(selector, el => el.textContent);

            return { success: true, text };
        } catch (error) {
            console.error('[Puppeteer] Extract text error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Extract attribute from element
     * @param {string} selector - CSS selector
     * @param {string} attribute - Attribute name
     * @returns {Promise<Object>} Extract result
     */
    async extractAttribute(selector, attribute) {
        try {
            const page = this.pages.get(this.currentPageId);
            if (!page) {
                throw new Error('No active page');
            }

            await page.waitForSelector(selector, { timeout: 10000 });
            const value = await page.$eval(selector, (el, attr) => el.getAttribute(attr), attribute);

            return { success: true, value };
        } catch (error) {
            console.error('[Puppeteer] Extract attribute error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Extract all links from page
     * @returns {Promise<Object>} Extract result
     */
    async extractLinks() {
        try {
            const page = this.pages.get(this.currentPageId);
            if (!page) {
                throw new Error('No active page');
            }

            const links = await page.evaluate(() => {
                const anchors = Array.from(document.querySelectorAll('a[href]'));
                return anchors.map(a => ({
                    text: a.textContent.trim(),
                    href: a.href,
                    title: a.title || ''
                }));
            });

            return { success: true, links };
        } catch (error) {
            console.error('[Puppeteer] Extract links error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Extract all images from page
     * @returns {Promise<Object>} Extract result
     */
    async extractImages() {
        try {
            const page = this.pages.get(this.currentPageId);
            if (!page) {
                throw new Error('No active page');
            }

            const images = await page.evaluate(() => {
                const imgs = Array.from(document.querySelectorAll('img'));
                return imgs.map(img => ({
                    src: img.src,
                    alt: img.alt || '',
                    width: img.width,
                    height: img.height
                }));
            });

            return { success: true, images };
        } catch (error) {
            console.error('[Puppeteer] Extract images error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Extract table data
     * @param {string} selector - CSS selector for table
     * @returns {Promise<Object>} Extract result
     */
    async extractTable(selector = 'table') {
        try {
            const page = this.pages.get(this.currentPageId);
            if (!page) {
                throw new Error('No active page');
            }

            const table = await page.evaluate((sel) => {
                const table = document.querySelector(sel);
                if (!table) return null;

                const rows = Array.from(table.querySelectorAll('tr'));
                return rows.map(row => {
                    const cells = Array.from(row.querySelectorAll('td, th'));
                    return cells.map(cell => cell.textContent.trim());
                });
            }, selector);

            return { success: true, table };
        } catch (error) {
            console.error('[Puppeteer] Extract table error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Take screenshot of page
     * @param {Object} options - Screenshot options
     * @returns {Promise<Object>} Screenshot result
     */
    async screenshot(options = {}) {
        try {
            const page = this.pages.get(this.currentPageId);
            if (!page) {
                throw new Error('No active page');
            }

            const filename = options.filename || `screenshot_${Date.now()}.png`;
            const filepath = path.join(this.screenshotPath, filename);

            await page.screenshot({
                path: filepath,
                fullPage: options.fullPage || false,
                type: options.type || 'png',
                quality: options.quality || 80
            });

            const buffer = fs.readFileSync(filepath);

            return {
                success: true,
                filepath,
                filename,
                buffer: buffer.toString('base64')
            };
        } catch (error) {
            console.error('[Puppeteer] Screenshot error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Scroll page
     * @param {Object} options - Scroll options
     * @returns {Promise<Object>} Scroll result
     */
    async scroll(options = {}) {
        try {
            const page = this.pages.get(this.currentPageId);
            if (!page) {
                throw new Error('No active page');
            }

            const distance = options.distance || 500;
            const direction = options.direction || 'down';

            await page.evaluate((dist, dir) => {
                window.scrollBy({
                    top: dir === 'down' ? dist : dir === 'up' ? -dist : 0,
                    left: dir === 'right' ? dist : dir === 'left' ? -dist : 0
                });
            }, distance, direction);

            // Wait for scroll to complete
            await page.waitForTimeout(options.delay || 500);

            return { success: true };
        } catch (error) {
            console.error('[Puppeteer] Scroll error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Wait for element
     * @param {string} selector - CSS selector
     * @param {Object} options - Wait options
     * @returns {Promise<Object>} Wait result
     */
    async waitFor(selector, options = {}) {
        try {
            const page = this.pages.get(this.currentPageId);
            if (!page) {
                throw new Error('No active page');
            }

            await page.waitForSelector(selector, {
                timeout: options.timeout || 30000,
                visible: options.visible !== false
            });

            return { success: true };
        } catch (error) {
            console.error('[Puppeteer] Wait error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Execute JavaScript in page context
     * @param {string|Function} script - JavaScript to execute
     * @param {Array} args - Arguments to pass to script
     * @returns {Promise<Object>} Execution result
     */
    async execute(script, args = []) {
        try {
            const page = this.pages.get(this.currentPageId);
            if (!page) {
                throw new Error('No active page');
            }

            const result = await page.evaluate(script, ...args);

            return { success: true, result };
        } catch (error) {
            console.error('[Puppeteer] Execute error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get all cookies
     * @returns {Promise<Array>} Array of cookies
     */
    async getCookies() {
        try {
            const page = this.pages.get(this.currentPageId);
            if (!page) {
                throw new Error('No active page');
            }

            const cookies = await page.cookies();
            this.cookies = cookies;

            return cookies;
        } catch (error) {
            console.error('[Puppeteer] Get cookies error:', error);
            return [];
        }
    }

    /**
     * Set cookie
     * @param {Object} cookie - Cookie object
     * @returns {Promise<Object>} Set cookie result
     */
    async setCookie(cookie) {
        try {
            const page = this.pages.get(this.currentPageId);
            if (!page) {
                throw new Error('No active page');
            }

            await page.setCookie(cookie);
            console.log(`[Puppeteer] Cookie set: ${cookie.name}`);

            return { success: true };
        } catch (error) {
            console.error('[Puppeteer] Set cookie error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Delete cookie
     * @param {string} name - Cookie name
     * @returns {Promise<Object>} Delete cookie result
     */
    async deleteCookie(name) {
        try {
            const page = this.pages.get(this.currentPageId);
            if (!page) {
                throw new Error('No active page');
            }

            await page.deleteCookie(name);
            console.log(`[Puppeteer] Cookie deleted: ${name}`);

            return { success: true };
        } catch (error) {
            console.error('[Puppeteer] Delete cookie error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Clear all cookies
     * @returns {Promise<Object>} Clear cookies result
     */
    async clearCookies() {
        try {
            const page = this.pages.get(this.currentPageId);
            if (!page) {
                throw new Error('No active page');
            }

            await page.evaluate(() => {
                document.cookie.split(';').forEach(cookie => {
                    const name = cookie.split('=')[0].trim();
                    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
                });
            });

            console.log('[Puppeteer] All cookies cleared');
            return { success: true };
        } catch (error) {
            console.error('[Puppeteer] Clear cookies error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get all tabs
     * @returns {Promise<Array>} Array of tab info
     */
    async getTabs() {
        try {
            if (!this.browser) {
                return [];
            }

            const pages = await this.browser.pages();
            const tabs = [];

            for (const [id, page] of this.pages.entries()) {
                const index = pages.indexOf(page);
                if (index !== -1) {
                    tabs.push({
                        id,
                        index,
                        url: page.url(),
                        title: await page.title()
                    });
                }
            }

            return tabs;
        } catch (error) {
            console.error('[Puppeteer] Get tabs error:', error);
            return [];
        }
    }

    /**
     * Switch to tab by ID
     * @param {string} pageId - Page ID to switch to
     * @returns {Promise<Object>} Switch result
     */
    async switchTab(pageId) {
        try {
            const page = this.pages.get(pageId);
            if (!page) {
                throw new Error('Page not found');
            }

            await page.bringToFront();
            this.currentPageId = pageId;

            console.log(`[Puppeteer] Switched to tab: ${pageId}`);
            return { success: true };
        } catch (error) {
            console.error('[Puppeteer] Switch tab error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Close tab by ID
     * @param {string} pageId - Page ID to close
     * @returns {Promise<Object>} Close result
     */
    async closeTab(pageId) {
        try {
            const page = this.pages.get(pageId);
            if (!page) {
                throw new Error('Page not found');
            }

            await page.close();
            this.pages.delete(pageId);

            // Switch to another tab if closing current
            if (this.currentPageId === pageId) {
                const remainingPages = Array.from(this.pages.keys());
                this.currentPageId = remainingPages.length > 0 ? remainingPages[0] : null;
            }

            console.log(`[Puppeteer] Closed tab: ${pageId}`);
            return { success: true };
        } catch (error) {
            console.error('[Puppeteer] Close tab error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Open new tab
     * @returns {Promise<Object>} New tab result
     */
    async newTab() {
        try {
            if (!this.browser) {
                await this.launch();
            }

            const page = await this.browser.newPage();
            const pageId = await this.setupPage(page);

            console.log(`[Puppeteer] New tab opened: ${pageId}`);
            return { success: true, pageId };
        } catch (error) {
            console.error('[Puppeteer] New tab error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Go back in history
     * @returns {Promise<Object>} Go back result
     */
    async goBack() {
        try {
            const page = this.pages.get(this.currentPageId);
            if (!page) {
                throw new Error('No active page');
            }

            await page.goBack();
            return { success: true };
        } catch (error) {
            console.error('[Puppeteer] Go back error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Go forward in history
     * @returns {Promise<Object>} Go forward result
     */
    async goForward() {
        try {
            const page = this.pages.get(this.currentPageId);
            if (!page) {
                throw new Error('No active page');
            }

            await page.goForward();
            return { success: true };
        } catch (error) {
            console.error('[Puppeteer] Go forward error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Reload page
     * @returns {Promise<Object>} Reload result
     */
    async reload() {
        try {
            const page = this.pages.get(this.currentPageId);
            if (!page) {
                throw new Error('No active page');
            }

            await page.reload();
            return { success: true };
        } catch (error) {
            console.error('[Puppeteer] Reload error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get page title
     * @returns {Promise<Object>} Title result
     */
    async getTitle() {
        try {
            const page = this.pages.get(this.currentPageId);
            if (!page) {
                throw new Error('No active page');
            }

            const title = await page.title();
            return { success: true, title };
        } catch (error) {
            console.error('[Puppeteer] Get title error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get page URL
     * @returns {Promise<Object>} URL result
     */
    async getURL() {
        try {
            const page = this.pages.get(this.currentPageId);
            if (!page) {
                throw new Error('No active page');
            }

            const url = page.url();
            return { success: true, url };
        } catch (error) {
            console.error('[Puppeteer] Get URL error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Close browser
     * @returns {Promise<void>}
     */
    async close() {
        try {
            if (this.browser) {
                await this.browser.close();
                this.browser = null;
                this.pages.clear();
                this.currentPageId = null;
                console.log('[Puppeteer] Browser closed');
            }
        } catch (error) {
            console.error('[Puppeteer] Close error:', error);
        }
    }

    /**
     * Check if browser is open
     * @returns {boolean} True if browser is open
     */
    isOpen() {
        return this.browser !== null && this.browser.isConnected();
    }
}

// Export singleton instance
const puppeteerService = new PuppeteerService();
module.exports = puppeteerService;
