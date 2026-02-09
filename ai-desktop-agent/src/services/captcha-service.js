/**
 * CAPTCHA Service - Solve CAPTCHAs using third-party services
 * Supports: 2Captcha, Anti-Captcha, DeathByCaptcha
 */
class CaptchaService {
    constructor() {
        this.services = {
            '2captcha': {
                apiKey: process.env.TWOCAPTCHA_API_KEY || '',
                baseUrl: 'http://2captcha.com/in.php'
            },
            'anticaptcha': {
                apiKey: process.env.ANTICAPTCHA_API_KEY || '',
                baseUrl: 'https://api.anti-captcha.com'
            },
            'deathbycaptcha': {
                apiKey: process.env.DEATHBYCAPTCHA_API_KEY || '',
                baseUrl: 'http://api.dbcapi.me'
            }
        };
        this.defaultService = process.env.DEFAULT_CAPTCHA_SERVICE || '2captcha';
        this.timeout = 120000; // 2 minutes default timeout
    }

    /**
     * Solve image CAPTCHA
     * @param {string} imageBase64 - Base64 encoded image
     * @param {Object} options - CAPTCHA options
     * @returns {Promise<Object>} Solve result
     */
    async solveImageCaptcha(imageBase64, options = {}) {
        const service = options.service || this.defaultService;
        const config = this.services[service];

        if (!config.apiKey) {
            throw new Error(`No API key configured for ${service}`);
        }

        console.log(`[CAPTCHA] Solving image CAPTCHA with ${service}`);

        try {
            let result;

            switch (service) {
                case '2captcha':
                    result = await this.solveWith2Captcha(imageBase64, config, options);
                    break;
                case 'anticaptcha':
                    result = await this.solveWithAntiCaptcha(imageBase64, config, options);
                    break;
                case 'deathbycaptcha':
                    result = await this.solveWithDeathByCaptcha(imageBase64, config, options);
                    break;
                default:
                    throw new Error(`Unknown CAPTCHA service: ${service}`);
            }

            return {
                success: true,
                text: result.text,
                captchaId: result.captchaId,
                service
            };
        } catch (error) {
            console.error('[CAPTCHA] Solve error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Solve reCAPTCHA v2
     * @param {string} siteKey - reCAPTCHA site key
     * @param {string} pageUrl - Page URL
     * @param {Object} options - CAPTCHA options
     * @returns {Promise<Object>} Solve result
     */
    async solveRecaptchaV2(siteKey, pageUrl, options = {}) {
        const service = options.service || this.defaultService;
        const config = this.services[service];

        if (!config.apiKey) {
            throw new Error(`No API key configured for ${service}`);
        }

        console.log(`[CAPTCHA] Solving reCAPTCHA v2 with ${service}`);

        try {
            let result;

            switch (service) {
                case '2captcha':
                    result = await this.solveRecaptchaV2With2Captcha(siteKey, pageUrl, config, options);
                    break;
                case 'anticaptcha':
                    result = await this.solveRecaptchaV2WithAntiCaptcha(siteKey, pageUrl, config, options);
                    break;
                case 'deathbycaptcha':
                    result = await this.solveRecaptchaV2WithDeathByCaptcha(siteKey, pageUrl, config, options);
                    break;
                default:
                    throw new Error(`Unknown CAPTCHA service: ${service}`);
            }

            return {
                success: true,
                text: result.text,
                captchaId: result.captchaId,
                service
            };
        } catch (error) {
            console.error('[CAPTCHA] Solve reCAPTCHA error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Solve hCaptcha
     * @param {string} siteKey - hCaptcha site key
     * @param {string} pageUrl - Page URL
     * @param {Object} options - CAPTCHA options
     * @returns {Promise<Object>} Solve result
     */
    async solveHCaptcha(siteKey, pageUrl, options = {}) {
        const service = options.service || this.defaultService;
        const config = this.services[service];

        if (!config.apiKey) {
            throw new Error(`No API key configured for ${service}`);
        }

        console.log(`[CAPTCHA] Solving hCaptcha with ${service}`);

        try {
            let result;

            switch (service) {
                case '2captcha':
                    result = await this.solveHCaptchaWith2Captcha(siteKey, pageUrl, config, options);
                    break;
                case 'anticaptcha':
                    result = await this.solveHCaptchaWithAntiCaptcha(siteKey, pageUrl, config, options);
                    break;
                default:
                    throw new Error(`Unknown CAPTCHA service: ${service}`);
            }

            return {
                success: true,
                text: result.text,
                captchaId: result.captchaId,
                service
            };
        } catch (error) {
            console.error('[CAPTCHA] Solve hCaptcha error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Solve with 2Captcha
     * @private
     */
    async solveWith2Captcha(imageBase64, config, options) {
        const formData = new URLSearchParams();
        formData.append('key', config.apiKey);
        formData.append('method', 'base64');
        formData.append('body', imageBase64);
        formData.append('json', 1);

        if (options.minLength) formData.append('min_len', options.minLength);
        if (options.maxLength) formData.append('max_len', options.maxLength);
        if (options.phrase) formData.append('phrase', 1);
        if (options.numeric) formData.append('numeric', 1);
        if (options.caseSensitive) formData.append('regsense', 1);
        if (options.calc) formData.append('calc', 1);

        const response = await this.makeRequest(`${config.baseUrl}`, {
            method: 'POST',
            body: formData.toString(),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (response.status === 0) {
            throw new Error('CAPTCHA not recognized');
        }

        return {
            text: response.request,
            captchaId: response.request
        };
    }

    /**
     * Solve reCAPTCHA v2 with 2Captcha
     * @private
     */
    async solveRecaptchaV2With2Captcha(siteKey, pageUrl, config, options) {
        const formData = new URLSearchParams();
        formData.append('key', config.apiKey);
        formData.append('method', 'userrecaptcha');
        formData.append('googlekey', siteKey);
        formData.append('pageurl', pageUrl);
        formData.append('json', 1);

        if (options.invisible) formData.append('invisible', 1);
        if (options.version === 'v3') formData.append('version', 'v3');

        const response = await this.makeRequest(`${config.baseUrl}`, {
            method: 'POST',
            body: formData.toString(),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (response.status === 0) {
            throw new Error('CAPTCHA not recognized');
        }

        return {
            text: response.request,
            captchaId: response.request
        };
    }

    /**
     * Solve hCaptcha with 2Captcha
     * @private
     */
    async solveHCaptchaWith2Captcha(siteKey, pageUrl, config, options) {
        const formData = new URLSearchParams();
        formData.append('key', config.apiKey);
        formData.append('method', 'hcaptcha');
        formData.append('sitekey', siteKey);
        formData.append('pageurl', pageUrl);
        formData.append('json', 1);

        const response = await this.makeRequest(`${config.baseUrl}`, {
            method: 'POST',
            body: formData.toString(),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (response.status === 0) {
            throw new Error('CAPTCHA not recognized');
        }

        return {
            text: response.request,
            captchaId: response.request
        };
    }

    /**
     * Solve with Anti-Captcha
     * @private
     */
    async solveWithAntiCaptcha(imageBase64, config, options) {
        const formData = new URLSearchParams();
        formData.append('client_key', config.apiKey);
        formData.append('task', JSON.stringify({
            type: 'ImageToTextTask',
            body: imageBase64,
            phrase: options.phrase || false,
            case: options.caseSensitive || false,
            numeric: options.numeric || false,
            math: options.calc || false,
            minLength: options.minLength || 0,
            maxLength: options.maxLength || 0
        }));

        const response = await this.makeRequest(`${config.baseUrl}/createTask`, {
            method: 'POST',
            body: formData.toString(),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const taskId = response.taskId;

        // Poll for result
        return await this.pollForResult(taskId, config);
    }

    /**
     * Solve reCAPTCHA v2 with Anti-Captcha
     * @private
     */
    async solveRecaptchaV2WithAntiCaptcha(siteKey, pageUrl, config, options) {
        const formData = new URLSearchParams();
        formData.append('client_key', config.apiKey);
        formData.append('task', JSON.stringify({
            type: 'RecaptchaV2TaskProxyless',
            websiteURL: pageUrl,
            websiteKey: siteKey,
            isInvisible: options.invisible || false
        }));

        const response = await this.makeRequest(`${config.baseUrl}/createTask`, {
            method: 'POST',
            body: formData.toString(),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const taskId = response.taskId;

        // Poll for result
        return await this.pollForResult(taskId, config);
    }

    /**
     * Solve hCaptcha with Anti-Captcha
     * @private
     */
    async solveHCaptchaWithAntiCaptcha(siteKey, pageUrl, config, options) {
        const formData = new URLSearchParams();
        formData.append('client_key', config.apiKey);
        formData.append('task', JSON.stringify({
            type: 'HCaptchaTaskProxyless',
            websiteURL: pageUrl,
            websiteKey: siteKey
        }));

        const response = await this.makeRequest(`${config.baseUrl}/createTask`, {
            method: 'POST',
            body: formData.toString(),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const taskId = response.taskId;

        // Poll for result
        return await this.pollForResult(taskId, config);
    }

    /**
     * Solve with DeathByCaptcha
     * @private
     */
    async solveWithDeathByCaptcha(imageBase64, config, options) {
        const formData = new URLSearchParams();
        formData.append('username', config.apiKey);
        formData.append('password', config.apiKey);
        formData.append('captchafile', imageBase64);
        formData.append('json', 1);

        const response = await this.makeRequest(`${config.baseUrl}/api/captcha`, {
            method: 'POST',
            body: formData.toString(),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (response.status === 0) {
            throw new Error('CAPTCHA not recognized');
        }

        return {
            text: response.text,
            captchaId: response.captcha
        };
    }

    /**
     * Solve reCAPTCHA v2 with DeathByCaptcha
     * @private
     */
    async solveRecaptchaV2WithDeathByCaptcha(siteKey, pageUrl, config, options) {
        const formData = new URLSearchParams();
        formData.append('username', config.apiKey);
        formData.append('password', config.apiKey);
        formData.append('type', 4); // reCAPTCHA v2
        formData.append('token_params', JSON.stringify({
            googlekey: siteKey,
            pageurl: pageUrl
        }));
        formData.append('json', 1);

        const response = await this.makeRequest(`${config.baseUrl}/api/captcha`, {
            method: 'POST',
            body: formData.toString(),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (response.status === 0) {
            throw new Error('CAPTCHA not recognized');
        }

        return {
            text: response.text,
            captchaId: response.captcha
        };
    }

    /**
     * Poll for CAPTCHA result
     * @private
     */
    async pollForResult(taskId, config) {
        const maxAttempts = 60; // 2 minutes with 2 second intervals
        let attempts = 0;

        while (attempts < maxAttempts) {
            const formData = new URLSearchParams();
            formData.append('client_key', config.apiKey);
            formData.append('task', taskId);

            const response = await this.makeRequest(`${config.baseUrl}/getTaskResult`, {
                method: 'POST',
                body: formData.toString(),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            if (response.status === 'ready') {
                return {
                    text: response.solution.gRecaptchaResponse,
                    captchaId: taskId
                };
            }

            if (response.status === 'failed') {
                throw new Error('CAPTCHA solving failed');
            }

            // Wait 2 seconds before next poll
            await new Promise(resolve => setTimeout(resolve, 2000));
            attempts++;
        }

        throw new Error('CAPTCHA solving timeout');
    }

    /**
     * Make HTTP request
     * @private
     */
    async makeRequest(url, options) {
        const fetch = require('node-fetch');

        const response = await fetch(url, {
            method: options.method || 'GET',
            headers: options.headers || {},
            body: options.body
        });

        const data = await response.json();
        return data;
    }

    /**
     * Report bad CAPTCHA
     * @param {string} captchaId - CAPTCHA ID to report
     * @param {string} service - Service name
     * @returns {Promise<Object>} Report result
     */
    async reportBad(captchaId, service) {
        const config = this.services[service];

        if (!config.apiKey) {
            throw new Error(`No API key configured for ${service}`);
        }

        console.log(`[CAPTCHA] Reporting bad CAPTCHA: ${captchaId}`);

        try {
            let result;

            switch (service) {
                case '2captcha':
                    result = await this.reportBadTo2Captcha(captchaId, config);
                    break;
                case 'anticaptcha':
                    result = await this.reportBadToAntiCaptcha(captchaId, config);
                    break;
                case 'deathbycaptcha':
                    result = await this.reportBadToDeathByCaptcha(captchaId, config);
                    break;
            }

            return { success: true };
        } catch (error) {
            console.error('[CAPTCHA] Report bad error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Report bad CAPTCHA to 2Captcha
     * @private
     */
    async reportBadTo2Captcha(captchaId, config) {
        const formData = new URLSearchParams();
        formData.append('key', config.apiKey);
        formData.append('action', 'reportbad');
        formData.append('id', captchaId);

        await this.makeRequest(`${config.baseUrl}`, {
            method: 'POST',
            body: formData.toString(),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
    }

    /**
     * Report bad CAPTCHA to Anti-Captcha
     * @private
     */
    async reportBadToAntiCaptcha(captchaId, config) {
        const formData = new URLSearchParams();
        formData.append('client_key', config.apiKey);
        formData.append('taskId', captchaId);

        await this.makeRequest(`${config.baseUrl}/reportIncorrectRecaptcha`, {
            method: 'POST',
            body: formData.toString(),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
    }

    /**
     * Report bad CAPTCHA to DeathByCaptcha
     * @private
     */
    async reportBadToDeathByCaptcha(captchaId, config) {
        const formData = new URLSearchParams();
        formData.append('username', config.apiKey);
        formData.append('password', config.apiKey);
        formData.append('id', captchaId);

        await this.makeRequest(`${config.baseUrl}/api/captcha`, {
            method: 'POST',
            body: formData.toString(),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
    }

    /**
     * Get balance for service
     * @param {string} service - Service name
     * @returns {Promise<Object>} Balance result
     */
    async getBalance(service) {
        const config = this.services[service];

        if (!config.apiKey) {
            throw new Error(`No API key configured for ${service}`);
        }

        console.log(`[CAPTCHA] Getting balance for ${service}`);

        try {
            let balance;

            switch (service) {
                case '2captcha':
                    balance = await this.getBalance2Captcha(config);
                    break;
                case 'anticaptcha':
                    balance = await this.getBalanceAntiCaptcha(config);
                    break;
                case 'deathbycaptcha':
                    balance = await this.getBalanceDeathByCaptcha(config);
                    break;
            }

            return {
                success: true,
                balance,
                service
            };
        } catch (error) {
            console.error('[CAPTCHA] Get balance error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get balance from 2Captcha
     * @private
     */
    async getBalance2Captcha(config) {
        const formData = new URLSearchParams();
        formData.append('key', config.apiKey);
        formData.append('action', 'getbalance');
        formData.append('json', 1);

        const response = await this.makeRequest(`${config.baseUrl}`, {
            method: 'POST',
            body: formData.toString(),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        return response;
    }

    /**
     * Get balance from Anti-Captcha
     * @private
     */
    async getBalanceAntiCaptcha(config) {
        const formData = new URLSearchParams();
        formData.append('client_key', config.apiKey);

        const response = await this.makeRequest(`${config.baseUrl}/getBalance`, {
            method: 'POST',
            body: formData.toString(),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        return response.balance;
    }

    /**
     * Get balance from DeathByCaptcha
     * @private
     */
    async getBalanceDeathByCaptcha(config) {
        const formData = new URLSearchParams();
        formData.append('username', config.apiKey);
        formData.append('password', config.apiKey);

        const response = await this.makeRequest(`${config.baseUrl}/api/captcha`, {
            method: 'POST',
            body: formData.toString(),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        return response.balance;
    }

    /**
     * Set default CAPTCHA service
     * @param {string} service - Service name
     */
    setDefaultService(service) {
        if (this.services[service]) {
            this.defaultService = service;
            console.log(`[CAPTCHA] Default service set to: ${service}`);
        } else {
            throw new Error(`Unknown CAPTCHA service: ${service}`);
        }
    }

    /**
     * Set API key for service
     * @param {string} service - Service name
     * @param {string} apiKey - API key
     */
    setApiKey(service, apiKey) {
        if (this.services[service]) {
            this.services[service].apiKey = apiKey;
            console.log(`[CAPTCHA] API key set for: ${service}`);
        } else {
            throw new Error(`Unknown CAPTCHA service: ${service}`);
        }
    }

    /**
     * Get available services
     * @returns {Array<string>} List of service names
     */
    getAvailableServices() {
        return Object.keys(this.services);
    }
}

// Export singleton instance
const captchaService = new CaptchaService();
module.exports = captchaService;
