/**
 * OCR Service
 * Full OCR integration with Tesseract.js
 */

const Tesseract = require('tesseract.js');
const EventEmitter = require('events');
const path = require('path');
const fs = require('fs');

class OCRService extends EventEmitter {
    constructor() {
        super();
        this.worker = null;
        this.isInitialized = false;
        this.supportedLanguages = [
            'eng', 'spa', 'fra', 'deu', 'ita', 'por', 'rus', 'chi_sim', 'chi_tra',
            'jpn', 'kor', 'ara', 'hin', 'tha', 'vie', 'nld', 'tur', 'pol',
            'swe', 'nor', 'dan', 'fin', 'ell', 'heb', 'ukr', 'ces', 'ron',
            'bul', 'hrv', 'srp', 'slv', 'lav', 'lit', 'est', 'hun'
        ];
        this.defaultLanguage = 'eng';
        this.cache = new Map();
        this.maxCacheSize = 100;
    }

    /**
     * Initialize OCR service
     */
    async initialize(options = {}) {
        try {
            console.log('[OCR Service] Initializing...');

            const language = options.language || this.defaultLanguage;

            // Create worker with v5 syntax: createWorker(languages, oem, options)
            this.worker = await Tesseract.createWorker(language, 1, {
                logger: m => {
                    if (options.debug) {
                        console.log('[OCR]', m);
                    }
                }
            });

            // v5 createWorker already loads language and initializes
            // We don't need explicit loadLanguage/initialize calls here unless changing languages later

            this.isInitialized = true;

            this.emit('initialized');
            console.log('[OCR Service] Initialized successfully');

            return { success: true, language };
        } catch (error) {
            console.error('[OCR Service] Initialization error:', error);
            this.emit('error', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Recognize text from image buffer
     */
    async recognizeText(imageBuffer, options = {}) {
        try {
            if (!this.isInitialized) {
                await this.initialize(options);
            }

            // Check cache
            const cacheKey = this.generateCacheKey(imageBuffer, options);
            if (this.cache.has(cacheKey)) {
                console.log('[OCR Service] Cache hit');
                return this.cache.get(cacheKey);
            }

            console.log('[OCR Service] Recognizing text...');

            // Preprocess image if needed
            let processedImage = imageBuffer;
            if (options.preprocess) {
                processedImage = await this.preprocessImage(imageBuffer, options);
            }

            // Recognize text
            const result = await this.worker.recognize(processedImage);

            const response = {
                success: true,
                text: result.data.text,
                confidence: result.data.confidence,
                lines: result.data.lines,
                words: result.data.words,
                symbols: result.data.symbols,
                language: options.language || this.defaultLanguage,
                hocr: result.data.hocr,
                tsv: result.data.tsv,
                boxes: result.data.words.map(w => ({
                    text: w.text,
                    confidence: w.confidence,
                    bbox: w.bbox
                }))
            };

            // Cache result
            this.addToCache(cacheKey, response);

            this.emit('text-recognized', response);

            return response;
        } catch (error) {
            console.error('[OCR Service] Recognition error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Recognize text from image file
     */
    async recognizeTextFromFile(filePath, options = {}) {
        try {
            const imageBuffer = await fs.promises.readFile(filePath);
            return await this.recognizeText(imageBuffer, options);
        } catch (error) {
            console.error('[OCR Service] File recognition error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Recognize text from base64 image
     */
    async recognizeTextFromBase64(base64Image, options = {}) {
        try {
            const imageBuffer = Buffer.from(base64Image, 'base64');
            return await this.recognizeText(imageBuffer, options);
        } catch (error) {
            console.error('[OCR Service] Base64 recognition error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Recognize text with multiple languages
     */
    async recognizeTextMultiLanguage(imageBuffer, languages, options = {}) {
        try {
            const results = [];

            for (const language of languages) {
                const result = await this.recognizeText(imageBuffer, {
                    ...options,
                    language
                });
                results.push({ language, ...result });
            }

            // Find best result by confidence
            const bestResult = results.reduce((best, current) =>
                current.confidence > best.confidence ? current : best
            );

            return {
                success: true,
                ...bestResult,
                allResults: results
            };
        } catch (error) {
            console.error('[OCR Service] Multi-language recognition error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Detect text regions
     */
    async detectTextRegions(imageBuffer, options = {}) {
        try {
            const result = await this.recognizeText(imageBuffer, options);

            if (!result.success) {
                return result;
            }

            // Group words into regions
            const regions = this.groupWordsIntoRegions(result.words, options);

            return {
                success: true,
                regions,
                text: result.text,
                confidence: result.confidence
            };
        } catch (error) {
            console.error('[OCR Service] Region detection error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Group words into text regions
     */
    groupWordsIntoRegions(words, options = {}) {
        const maxDistance = options.maxDistance || 50;
        const regions = [];
        let currentRegion = null;

        // Sort words by Y position, then X position
        const sortedWords = [...words].sort((a, b) => {
            if (Math.abs(a.bbox.y0 - b.bbox.y0) < maxDistance) {
                return a.bbox.x0 - b.bbox.x0;
            }
            return a.bbox.y0 - b.bbox.y0;
        });

        for (const word of sortedWords) {
            if (!currentRegion) {
                currentRegion = {
                    text: word.text,
                    words: [word],
                    bbox: { ...word.bbox },
                    confidence: word.confidence
                };
            } else {
                // Check if word is close to current region
                const distance = Math.abs(word.bbox.y0 - currentRegion.bbox.y0);

                if (distance < maxDistance) {
                    // Add to current region
                    currentRegion.text += ' ' + word.text;
                    currentRegion.words.push(word);
                    currentRegion.bbox.x0 = Math.min(currentRegion.bbox.x0, word.bbox.x0);
                    currentRegion.bbox.y0 = Math.min(currentRegion.bbox.y0, word.bbox.y0);
                    currentRegion.bbox.x1 = Math.max(currentRegion.bbox.x1, word.bbox.x1);
                    currentRegion.bbox.y1 = Math.max(currentRegion.bbox.y1, word.bbox.y1);
                    currentRegion.confidence = (currentRegion.confidence + word.confidence) / 2;
                } else {
                    // Start new region
                    regions.push(currentRegion);
                    currentRegion = {
                        text: word.text,
                        words: [word],
                        bbox: { ...word.bbox },
                        confidence: word.confidence
                    };
                }
            }
        }

        if (currentRegion) {
            regions.push(currentRegion);
        }

        return regions;
    }

    /**
     * Preprocess image for better OCR
     */
    async preprocessImage(imageBuffer, options = {}) {
        try {
            // For now, return original image
            // In production, use sharp or jimp for:
            // - Grayscale conversion
            // - Thresholding
            // - Noise reduction
            // - Contrast enhancement
            // - Resizing

            return imageBuffer;
        } catch (error) {
            console.error('[OCR Service] Preprocessing error:', error);
            return imageBuffer;
        }
    }

    /**
     * Find text on screen
     */
    async findTextOnScreen(searchText, options = {}) {
        try {
            const screenController = require('../controllers/screen-controller');
            const screenshot = await screenController.captureScreen();

            const result = await this.recognizeText(screenshot, options);

            if (!result.success) {
                return { success: false, error: result.error };
            }

            // Search for text
            const found = result.text.toLowerCase().includes(searchText.toLowerCase());

            if (found) {
                // Find bounding box of matching text
                const match = this.findTextBoundingBox(result.words, searchText);

                return {
                    success: true,
                    found: true,
                    text: searchText,
                    bbox: match?.bbox || null,
                    confidence: match?.confidence || result.confidence
                };
            }

            return {
                success: true,
                found: false,
                text: searchText
            };
        } catch (error) {
            console.error('[OCR Service] Find text error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Find bounding box of text
     */
    findTextBoundingBox(words, searchText) {
        const searchLower = searchText.toLowerCase();

        for (let i = 0; i < words.length; i++) {
            if (words[i].text.toLowerCase().includes(searchLower)) {
                return {
                    text: words[i].text,
                    confidence: words[i].confidence,
                    bbox: words[i].bbox
                };
            }
        }

        return null;
    }

    /**
     * Get supported languages
     */
    getSupportedLanguages() {
        return this.supportedLanguages;
    }

    /**
     * Set language
     */
    async setLanguage(language) {
        try {
            if (!this.supportedLanguages.includes(language)) {
                return { success: false, error: 'Language not supported' };
            }

            if (this.worker) {
                await this.worker.loadLanguage(language);
                await this.worker.initialize(language);
            }

            this.defaultLanguage = language;

            this.emit('language-changed', language);
            console.log(`[OCR Service] Language changed to: ${language}`);

            return { success: true, language };
        } catch (error) {
            console.error('[OCR Service] Set language error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Generate cache key
     */
    generateCacheKey(imageBuffer, options) {
        const crypto = require('crypto');
        const hash = crypto.createHash('md5')
            .update(imageBuffer)
            .update(JSON.stringify(options))
            .digest('hex');
        return hash;
    }

    /**
     * Add to cache
     */
    addToCache(key, value) {
        if (this.cache.size >= this.maxCacheSize) {
            // Remove oldest entry
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        this.emit('cache-cleared');
        console.log('[OCR Service] Cache cleared');
    }

    /**
     * Get cache stats
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxCacheSize,
            entries: Array.from(this.cache.entries()).map(([key, value]) => ({
                key,
                timestamp: value.timestamp
            }))
        };
    }

    /**
     * Terminate worker
     */
    async terminate() {
        try {
            if (this.worker) {
                await this.worker.terminate();
                this.worker = null;
                this.isInitialized = false;

                this.emit('terminated');
                console.log('[OCR Service] Worker terminated');
            }

            return { success: true };
        } catch (error) {
            console.error('[OCR Service] Terminate error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get status
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            language: this.defaultLanguage,
            cacheSize: this.cache.size,
            supportedLanguages: this.supportedLanguages.length
        };
    }
}

module.exports = new OCRService();
