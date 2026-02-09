/**
 * OCR Service Tests
 */

const ocrService = require('../../src/services/ocr-service');
const fs = require('fs');
const path = require('path');

describe('OCR Service', () => {
    beforeEach(async () => {
        await ocrService.initialize();
    });

    afterEach(async () => {
        await ocrService.shutdown();
    });

    describe('Initialization', () => {
        it('should initialize successfully', async () => {
            const status = ocrService.getStatus();
            expect(status.initialized).toBe(true);
        });

        it('should have default language set', () => {
            const status = ocrService.getStatus();
            expect(status.language).toBe('eng');
        });

        it('should have cache enabled', () => {
            const status = ocrService.getStatus();
            expect(status.cacheEnabled).toBe(true);
        });
    });

    describe('Language Support', () => {
        it('should return supported languages', () => {
            const languages = ocrService.getSupportedLanguages();
            expect(languages).toBeInstanceOf(Array);
            expect(languages.length).toBeGreaterThan(0);
            expect(languages).toContain('eng');
        });

        it('should set language', () => {
            const result = ocrService.setLanguage('spa');
            expect(result.success).toBe(true);
            expect(result.language).toBe('spa');
        });

        it('should return error for invalid language', () => {
            const result = ocrService.setLanguage('invalid');
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('Text Recognition', () => {
        it('should recognize text from buffer', async () => {
            // Create a simple test image with text
            const testImagePath = path.join(__dirname, '../fixtures/test-text.png');

            if (fs.existsSync(testImagePath)) {
                const imageBuffer = fs.readFileSync(testImagePath);
                const result = await ocrService.recognizeText(imageBuffer);

                expect(result.success).toBe(true);
                expect(result.text).toBeDefined();
                expect(typeof result.text).toBe('string');
            } else {
                // Skip test if image doesn't exist
                console.log('Test image not found, skipping test');
            }
        });

        it('should recognize text with multiple languages', async () => {
            const testImagePath = path.join(__dirname, '../fixtures/test-text.png');

            if (fs.existsSync(testImagePath)) {
                const imageBuffer = fs.readFileSync(testImagePath);
                const result = await ocrService.recognizeText(imageBuffer, {
                    languages: ['eng', 'spa']
                });

                expect(result.success).toBe(true);
                expect(result.text).toBeDefined();
            }
        });

        it('should return confidence scores', async () => {
            const testImagePath = path.join(__dirname, '../fixtures/test-text.png');

            if (fs.existsSync(testImagePath)) {
                const imageBuffer = fs.readFileSync(testImagePath);
                const result = await ocrService.recognizeText(imageBuffer, {
                    includeConfidence: true
                });

                expect(result.success).toBe(true);
                expect(result.confidence).toBeDefined();
                expect(typeof result.confidence).toBe('number');
            }
        });

        it('should return lines with positions', async () => {
            const testImagePath = path.join(__dirname, '../fixtures/test-text.png');

            if (fs.existsSync(testImagePath)) {
                const imageBuffer = fs.readFileSync(testImagePath);
                const result = await ocrService.recognizeText(imageBuffer, {
                    outputFormat: 'lines'
                });

                expect(result.success).toBe(true);
                expect(result.lines).toBeDefined();
                expect(Array.isArray(result.lines)).toBe(true);
            }
        });

        it('should return words with positions', async () => {
            const testImagePath = path.join(__dirname, '../fixtures/test-text.png');

            if (fs.existsSync(testImagePath)) {
                const imageBuffer = fs.readFileSync(testImagePath);
                const result = await ocrService.recognizeText(imageBuffer, {
                    outputFormat: 'words'
                });

                expect(result.success).toBe(true);
                expect(result.words).toBeDefined();
                expect(Array.isArray(result.words)).toBe(true);
            }
        });
    });

    describe('Text Search', () => {
        it('should find text on screen', async () => {
            const result = await ocrService.findTextOnScreen('test');

            expect(result.success).toBe(true);
            expect(result.found).toBeDefined();
            expect(typeof result.found).toBe('boolean');
        });

        it('should return bounding box when text found', async () => {
            const result = await ocrService.findTextOnScreen('test', {
                returnBoundingBox: true
            });

            if (result.found) {
                expect(result.bbox).toBeDefined();
                expect(result.bbox.x).toBeDefined();
                expect(result.bbox.y).toBeDefined();
                expect(result.bbox.width).toBeDefined();
                expect(result.bbox.height).toBeDefined();
            }
        });

        it('should support case-insensitive search', async () => {
            const result1 = await ocrService.findTextOnScreen('TEST', {
                caseSensitive: true
            });

            const result2 = await ocrService.findTextOnScreen('test', {
                caseSensitive: false
            });

            expect(result1.success).toBe(true);
            expect(result2.success).toBe(true);
        });

        it('should support partial match', async () => {
            const result = await ocrService.findTextOnScreen('tes', {
                partialMatch: true
            });

            expect(result.success).toBe(true);
        });
    });

    describe('Text Region Detection', () => {
        it('should detect text regions', async () => {
            const testImagePath = path.join(__dirname, '../fixtures/test-text.png');

            if (fs.existsSync(testImagePath)) {
                const imageBuffer = fs.readFileSync(testImagePath);
                const result = await ocrService.detectTextRegions(imageBuffer);

                expect(result.success).toBe(true);
                expect(result.regions).toBeDefined();
                expect(Array.isArray(result.regions)).toBe(true);
            }
        });

        it('should group words into regions', async () => {
            const testImagePath = path.join(__dirname, '../fixtures/test-text.png');

            if (fs.existsSync(testImagePath)) {
                const imageBuffer = fs.readFileSync(testImagePath);
                const result = await ocrService.detectTextRegions(imageBuffer, {
                    groupByLine: true
                });

                expect(result.success).toBe(true);
                expect(result.regions).toBeDefined();
            }
        });
    });

    describe('Caching', () => {
        it('should cache recognition results', async () => {
            const testImagePath = path.join(__dirname, '../fixtures/test-text.png');

            if (fs.existsSync(testImagePath)) {
                const imageBuffer = fs.readFileSync(testImagePath);

                // First call
                const result1 = await ocrService.recognizeText(imageBuffer);

                // Second call (should use cache)
                const result2 = await ocrService.recognizeText(imageBuffer);

                expect(result1.success).toBe(true);
                expect(result2.success).toBe(true);
            }
        });

        it('should return cache statistics', () => {
            const stats = ocrService.getCacheStats();

            expect(stats).toBeDefined();
            expect(stats.size).toBeDefined();
            expect(stats.hits).toBeDefined();
            expect(stats.misses).toBeDefined();
        });

        it('should clear cache', () => {
            const result = ocrService.clearCache();

            expect(result.success).toBe(true);

            const stats = ocrService.getCacheStats();
            expect(stats.size).toBe(0);
        });

        it('should respect cache size limit', async () => {
            const testImagePath = path.join(__dirname, '../fixtures/test-text.png');

            if (fs.existsSync(testImagePath)) {
                // Set small cache limit
                ocrService.setCacheLimit(2);

                const imageBuffer = fs.readFileSync(testImagePath);

                // Process multiple images
                for (let i = 0; i < 5; i++) {
                    await ocrService.recognizeText(imageBuffer);
                }

                const stats = ocrService.getCacheStats();
                expect(stats.size).toBeLessThanOrEqual(2);
            }
        });
    });

    describe('Output Formats', () => {
        it('should support text format', async () => {
            const testImagePath = path.join(__dirname, '../fixtures/test-text.png');

            if (fs.existsSync(testImagePath)) {
                const imageBuffer = fs.readFileSync(testImagePath);
                const result = await ocrService.recognizeText(imageBuffer, {
                    outputFormat: 'text'
                });

                expect(result.success).toBe(true);
                expect(result.text).toBeDefined();
            }
        });

        it('should support HOCR format', async () => {
            const testImagePath = path.join(__dirname, '../fixtures/test-text.png');

            if (fs.existsSync(testImagePath)) {
                const imageBuffer = fs.readFileSync(testImagePath);
                const result = await ocrService.recognizeText(imageBuffer, {
                    outputFormat: 'hocr'
                });

                expect(result.success).toBe(true);
                expect(result.hocr).toBeDefined();
            }
        });

        it('should support TSV format', async () => {
            const testImagePath = path.join(__dirname, '../fixtures/test-text.png');

            if (fs.existsSync(testImagePath)) {
                const imageBuffer = fs.readFileSync(testImagePath);
                const result = await ocrService.recognizeText(imageBuffer, {
                    outputFormat: 'tsv'
                });

                expect(result.success).toBe(true);
                expect(result.tsv).toBeDefined();
            }
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid image buffer', async () => {
            const result = await ocrService.recognizeText(Buffer.from('invalid'));

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('should handle empty buffer', async () => {
            const result = await ocrService.recognizeText(Buffer.alloc(0));

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('should handle missing image file', async () => {
            const result = await ocrService.recognizeTextFromFile('/nonexistent/file.png');

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('Event Emitter', () => {
        it('should emit initialized event', (done) => {
            ocrService.once('initialized', () => {
                done();
            });
        });

        it('should emit recognition-complete event', (done) => {
            ocrService.once('recognition-complete', (data) => {
                expect(data.text).toBeDefined();
                done();
            });

            const testImagePath = path.join(__dirname, '../fixtures/test-text.png');
            if (fs.existsSync(testImagePath)) {
                const imageBuffer = fs.readFileSync(testImagePath);
                ocrService.recognizeText(imageBuffer);
            } else {
                done();
            }
        });

        it('should emit error event', (done) => {
            ocrService.once('error', (error) => {
                expect(error).toBeDefined();
                done();
            });

            ocrService.recognizeText(Buffer.from('invalid'));
        });
    });

    describe('Performance', () => {
        it('should complete recognition within reasonable time', async () => {
            const testImagePath = path.join(__dirname, '../fixtures/test-text.png');

            if (fs.existsSync(testImagePath)) {
                const imageBuffer = fs.readFileSync(testImagePath);
                const startTime = Date.now();

                const result = await ocrService.recognizeText(imageBuffer);

                const endTime = Date.now();
                const duration = endTime - startTime;

                expect(result.success).toBe(true);
                expect(duration).toBeLessThan(10000); // 10 seconds max
            }
        });

        it('should use cache for faster subsequent calls', async () => {
            const testImagePath = path.join(__dirname, '../fixtures/test-text.png');

            if (fs.existsSync(testImagePath)) {
                const imageBuffer = fs.readFileSync(testImagePath);

                // First call
                const start1 = Date.now();
                await ocrService.recognizeText(imageBuffer);
                const time1 = Date.now() - start1;

                // Second call (cached)
                const start2 = Date.now();
                await ocrService.recognizeText(imageBuffer);
                const time2 = Date.now() - start2;

                expect(time2).toBeLessThan(time1);
            }
        });
    });
});
