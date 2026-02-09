/**
 * Browser Controller Module
 * Manages browser automation with Puppeteer integration
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const puppeteerService = require('../services/puppeteer-service');
const captchaService = require('../services/captcha-service');

const execAsync = promisify(exec);

class BrowserController {
    constructor() {
        this.browser = null;
        this.page = null;
        this.platform = process.platform;
        this.usePuppeteer = true; // Use Puppeteer for full automation
    }

    async initialize() {
        console.log('Browser controller initialized');
        return true;
    }

    async navigate(url) {
        try {
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = `https://${url}`;
            }

            if (this.usePuppeteer) {
                // Use Puppeteer for full automation
                return await puppeteerService.navigate(url);
            } else {
                // Fallback to system browser
                if (this.platform === 'win32') {
                    await execAsync(`start "" "${url}"`);
                } else if (this.platform === 'darwin') {
                    await execAsync(`open "${url}"`);
                } else if (this.platform === 'linux') {
                    await execAsync(`xdg-open "${url}"`);
                }

                console.log(`Navigated to: ${url}`);
                return { success: true };
            }
        } catch (error) {
            throw new Error(`Failed to navigate: ${error.message}`);
        }
    }

    async clickElement(selector, options = {}) {
        try {
            if (this.usePuppeteer) {
                return await puppeteerService.click(selector, options);
            } else {
                console.log(`Clicking element: ${selector}`);
                return { success: true, message: `Would click element: ${selector}` };
            }
        } catch (error) {
            throw new Error(`Failed to click element: ${error.message}`);
        }
    }

    async typeInElement(selector, text, options = {}) {
        try {
            if (this.usePuppeteer) {
                return await puppeteerService.type(selector, text, options);
            } else {
                console.log(`Typing "${text}" into element: ${selector}`);
                return { success: true, message: `Would type into element: ${selector}` };
            }
        } catch (error) {
            throw new Error(`Failed to type in element: ${error.message}`);
        }
    }

    async extractData(selector) {
        try {
            if (this.usePuppeteer) {
                return await puppeteerService.extractText(selector);
            } else {
                console.log(`Extracting data from: ${selector}`);
                return { success: true, data: null, message: `Would extract data from: ${selector}` };
            }
        } catch (error) {
            throw new Error(`Failed to extract data: ${error.message}`);
        }
    }

    async takeScreenshot(options = {}) {
        try {
            if (this.usePuppeteer) {
                return await puppeteerService.screenshot(options);
            } else {
                console.log('Taking browser screenshot');
                return { success: true, message: 'Would take browser screenshot' };
            }
        } catch (error) {
            throw new Error(`Failed to take screenshot: ${error.message}`);
        }
    }

    async close() {
        try {
            if (this.usePuppeteer) {
                await puppeteerService.close();
            } else {
                console.log('Closing browser');
            }
            return { success: true };
        } catch (error) {
            throw new Error(`Failed to close browser: ${error.message}`);
        }
    }

    async search(query, searchEngine = 'google') {
        try {
            const searchUrls = {
                google: 'https://www.google.com/search?q=',
                bing: 'https://www.bing.com/search?q=',
                duckduckgo: 'https://duckduckgo.com/?q='
            };

            const baseUrl = searchUrls[searchEngine.toLowerCase()] || searchUrls.google;
            const encodedQuery = encodeURIComponent(query);
            const url = `${baseUrl}${encodedQuery}`;

            return await this.navigate(url);
        } catch (error) {
            throw new Error(`Failed to search: ${error.message}`);
        }
    }

    async openInBrowser(url, browser = 'default') {
        try {
            const browserCommands = {
                chrome: {
                    win32: 'start chrome',
                    darwin: 'open -a "Google Chrome"',
                    linux: 'google-chrome'
                },
                firefox: {
                    win32: 'start firefox',
                    darwin: 'open -a Firefox',
                    linux: 'firefox'
                },
                edge: {
                    win32: 'start msedge',
                    darwin: 'open -a "Microsoft Edge"',
                    linux: 'microsoft-edge'
                },
                default: {
                    win32: 'start',
                    darwin: 'open',
                    linux: 'xdg-open'
                }
            };

            const command = browserCommands[browser.toLowerCase()] || browserCommands.default;
            const platformCommand = command[this.platform] || command.default;

            await execAsync(`${platformCommand} "${url}"`);
            console.log(`Opened ${url} in ${browser}`);
            return { success: true };
        } catch (error) {
            throw new Error(`Failed to open in browser: ${error.message}`);
        }
    }

    // New Puppeteer-enhanced methods

    async select(selector, value) {
        try {
            if (this.usePuppeteer) {
                return await puppeteerService.select(selector, value);
            } else {
                console.log(`Selecting ${value} from: ${selector}`);
                return { success: true, message: `Would select from: ${selector}` };
            }
        } catch (error) {
            throw new Error(`Failed to select: ${error.message}`);
        }
    }

    async extractLinks() {
        try {
            if (this.usePuppeteer) {
                return await puppeteerService.extractLinks();
            } else {
                return { success: true, links: [], message: 'Would extract links' };
            }
        } catch (error) {
            throw new Error(`Failed to extract links: ${error.message}`);
        }
    }

    async extractImages() {
        try {
            if (this.usePuppeteer) {
                return await puppeteerService.extractImages();
            } else {
                return { success: true, images: [], message: 'Would extract images' };
            }
        } catch (error) {
            throw new Error(`Failed to extract images: ${error.message}`);
        }
    }

    async extractTable(selector = 'table') {
        try {
            if (this.usePuppeteer) {
                return await puppeteerService.extractTable(selector);
            } else {
                return { success: true, table: [], message: 'Would extract table' };
            }
        } catch (error) {
            throw new Error(`Failed to extract table: ${error.message}`);
        }
    }

    async scroll(options = {}) {
        try {
            if (this.usePuppeteer) {
                return await puppeteerService.scroll(options);
            } else {
                return { success: true, message: 'Would scroll page' };
            }
        } catch (error) {
            throw new Error(`Failed to scroll: ${error.message}`);
        }
    }

    async waitFor(selector, options = {}) {
        try {
            if (this.usePuppeteer) {
                return await puppeteerService.waitFor(selector, options);
            } else {
                return { success: true, message: 'Would wait for element' };
            }
        } catch (error) {
            throw new Error(`Failed to wait: ${error.message}`);
        }
    }

    async execute(script, args = []) {
        try {
            if (this.usePuppeteer) {
                return await puppeteerService.execute(script, args);
            } else {
                return { success: true, result: null, message: 'Would execute script' };
            }
        } catch (error) {
            throw new Error(`Failed to execute: ${error.message}`);
        }
    }

    // Cookie management

    async getCookies() {
        try {
            if (this.usePuppeteer) {
                return await puppeteerService.getCookies();
            } else {
                return [];
            }
        } catch (error) {
            throw new Error(`Failed to get cookies: ${error.message}`);
        }
    }

    async setCookie(cookie) {
        try {
            if (this.usePuppeteer) {
                return await puppeteerService.setCookie(cookie);
            } else {
                return { success: true, message: 'Would set cookie' };
            }
        } catch (error) {
            throw new Error(`Failed to set cookie: ${error.message}`);
        }
    }

    async deleteCookie(name) {
        try {
            if (this.usePuppeteer) {
                return await puppeteerService.deleteCookie(name);
            } else {
                return { success: true, message: 'Would delete cookie' };
            }
        } catch (error) {
            throw new Error(`Failed to delete cookie: ${error.message}`);
        }
    }

    async clearCookies() {
        try {
            if (this.usePuppeteer) {
                return await puppeteerService.clearCookies();
            } else {
                return { success: true, message: 'Would clear cookies' };
            }
        } catch (error) {
            throw new Error(`Failed to clear cookies: ${error.message}`);
        }
    }

    // Tab management

    async getTabs() {
        try {
            if (this.usePuppeteer) {
                return await puppeteerService.getTabs();
            } else {
                return [];
            }
        } catch (error) {
            throw new Error(`Failed to get tabs: ${error.message}`);
        }
    }

    async switchTab(pageId) {
        try {
            if (this.usePuppeteer) {
                return await puppeteerService.switchTab(pageId);
            } else {
                return { success: true, message: 'Would switch tab' };
            }
        } catch (error) {
            throw new Error(`Failed to switch tab: ${error.message}`);
        }
    }

    async closeTab(pageId) {
        try {
            if (this.usePuppeteer) {
                return await puppeteerService.closeTab(pageId);
            } else {
                return { success: true, message: 'Would close tab' };
            }
        } catch (error) {
            throw new Error(`Failed to close tab: ${error.message}`);
        }
    }

    async newTab() {
        try {
            if (this.usePuppeteer) {
                return await puppeteerService.newTab();
            } else {
                return { success: true, message: 'Would open new tab' };
            }
        } catch (error) {
            throw new Error(`Failed to open new tab: ${error.message}`);
        }
    }

    // Navigation

    async goBack() {
        try {
            if (this.usePuppeteer) {
                return await puppeteerService.goBack();
            } else {
                return { success: true, message: 'Would go back' };
            }
        } catch (error) {
            throw new Error(`Failed to go back: ${error.message}`);
        }
    }

    async goForward() {
        try {
            if (this.usePuppeteer) {
                return await puppeteerService.goForward();
            } else {
                return { success: true, message: 'Would go forward' };
            }
        } catch (error) {
            throw new Error(`Failed to go forward: ${error.message}`);
        }
    }

    async reload() {
        try {
            if (this.usePuppeteer) {
                return await puppeteerService.reload();
            } else {
                return { success: true, message: 'Would reload page' };
            }
        } catch (error) {
            throw new Error(`Failed to reload: ${error.message}`);
        }
    }

    async getTitle() {
        try {
            if (this.usePuppeteer) {
                return await puppeteerService.getTitle();
            } else {
                return { success: true, title: '', message: 'Would get title' };
            }
        } catch (error) {
            throw new Error(`Failed to get title: ${error.message}`);
        }
    }

    async getURL() {
        try {
            if (this.usePuppeteer) {
                return await puppeteerService.getURL();
            } else {
                return { success: true, url: '', message: 'Would get URL' };
            }
        } catch (error) {
            throw new Error(`Failed to get URL: ${error.message}`);
        }
    }

    // CAPTCHA solving

    async solveCaptcha(imageBase64, options = {}) {
        try {
            return await captchaService.solveImageCaptcha(imageBase64, options);
        } catch (error) {
            throw new Error(`Failed to solve CAPTCHA: ${error.message}`);
        }
    }

    async solveRecaptcha(siteKey, pageUrl, options = {}) {
        try {
            return await captchaService.solveRecaptchaV2(siteKey, pageUrl, options);
        } catch (error) {
            throw new Error(`Failed to solve reCAPTCHA: ${error.message}`);
        }
    }

    async reportBadCaptcha(captchaId, service) {
        try {
            return await captchaService.reportBad(captchaId, service);
        } catch (error) {
            throw new Error(`Failed to report bad CAPTCHA: ${error.message}`);
        }
    }

    async getCaptchaBalance(service) {
        try {
            return await captchaService.getBalance(service);
        } catch (error) {
            throw new Error(`Failed to get CAPTCHA balance: ${error.message}`);
        }
    }

    // Toggle Puppeteer mode

    setUsePuppeteer(use) {
        this.usePuppeteer = use;
        console.log(`[BrowserController] Puppeteer mode ${use ? 'ENABLED' : 'DISABLED'}`);
    }

    isUsingPuppeteer() {
        return this.usePuppeteer;
    }
}

module.exports = BrowserController;
