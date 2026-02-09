const fs = require('fs').promises;
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const XLSX = require('xlsx');
const { EventEmitter } = require('events');

/**
 * Document Parser Service - Parse PDF, Word, Excel documents
 * Features: Text extraction, table extraction, metadata extraction, document summarization
 */
class DocumentParserService extends EventEmitter {
    constructor() {
        super();
        this.cache = new Map(); // Document cache
        this.cachePath = path.join(__dirname, '../../data/document-cache.json');
        this.supportedFormats = ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.csv', '.txt', '.md'];
    }

    /**
     * Initialize document parser service
     * @param {Object} config - Configuration
     */
    async initialize(config = {}) {
        try {
            // Load cache
            await this.loadCache();

            console.log('[DocumentParser] Document Parser Service initialized');
            return { success: true };
        } catch (error) {
            console.error('[DocumentParser] Initialization error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Parse document from file path
     * @param {string} filePath - Path to document
     * @param {Object} options - Parse options
     * @returns {Promise<Object>} Parsed document
     */
    async parseDocument(filePath, options = {}) {
        try {
            const ext = path.extname(filePath).toLowerCase();

            if (!this.supportedFormats.includes(ext)) {
                throw new Error(`Unsupported file format: ${ext}`);
            }

            console.log(`[DocumentParser] Parsing document: ${filePath}`);

            // Check cache
            const cacheKey = this.getCacheKey(filePath, options);
            if (this.cache.has(cacheKey) && !options.bypassCache) {
                console.log('[DocumentParser] Using cached result');
                return this.cache.get(cacheKey);
            }

            let result;

            switch (ext) {
                case '.pdf':
                    result = await this.parsePDF(filePath, options);
                    break;
                case '.docx':
                case '.doc':
                    result = await this.parseWord(filePath, options);
                    break;
                case '.xlsx':
                case '.xls':
                case '.csv':
                    result = await this.parseExcel(filePath, options);
                    break;
                case '.txt':
                case '.md':
                    result = await this.parseText(filePath, options);
                    break;
                default:
                    throw new Error(`Unsupported file format: ${ext}`);
            }

            // Add metadata
            result.metadata = await this.getMetadata(filePath);
            result.filePath = filePath;
            result.format = ext;
            result.timestamp = new Date().toISOString();

            // Cache result
            this.cache.set(cacheKey, result);
            await this.saveCache();

            this.emit('complete', result);

            return result;
        } catch (error) {
            console.error('[DocumentParser] Parse error:', error);
            return {
                success: false,
                error: error.message,
                filePath: filePath
            };
        }
    }

    /**
     * Parse PDF document
     * @param {string} filePath - Path to PDF
     * @param {Object} options - Parse options
     * @returns {Promise<Object>} Parsed PDF
     */
    async parsePDF(filePath, options = {}) {
        try {
            const dataBuffer = await fs.readFile(filePath);
            const data = await pdf(dataBuffer);

            const result = {
                success: true,
                type: 'pdf',
                text: data.text,
                pages: data.numpages,
                info: data.info,
                metadata: data.metadata,
                tables: options.extractTables ? await this.extractPDFTables(dataBuffer) : [],
                images: options.extractImages ? await this.extractPDFImages(dataBuffer) : [],
                version: data.pdfjsVersion || null
            };

            return result;
        } catch (error) {
            console.error('[DocumentParser] PDF parse error:', error);
            throw error;
        }
    }

    /**
     * Parse Word document
     * @param {string} filePath - Path to Word document
     * @param {Object} options - Parse options
     * @returns {Promise<Object>} Parsed Word document
     */
    async parseWord(filePath, options = {}) {
        try {
            const dataBuffer = await fs.readFile(filePath);
            const result = await mammoth.extractRawText({ path: filePath });

            const htmlResult = options.extractHTML ? await mammoth.convertToHtml({ path: filePath }) : null;

            const parsedResult = {
                success: true,
                type: 'word',
                text: result.value,
                html: htmlResult ? htmlResult.value : null,
                messages: result.messages,
                tables: options.extractTables ? await this.extractWordTables(filePath) : [],
                images: options.extractImages ? await this.extractWordImages(filePath) : []
            };

            return parsedResult;
        } catch (error) {
            console.error('[DocumentParser] Word parse error:', error);
            throw error;
        }
    }

    /**
     * Parse Excel document
     * @param {string} filePath - Path to Excel document
     * @param {Object} options - Parse options
     * @returns {Promise<Object>} Parsed Excel document
     */
    async parseExcel(filePath, options = {}) {
        try {
            const workbook = XLSX.readFile(filePath);
            const sheetNames = workbook.SheetNames;

            const sheets = {};
            const tables = [];

            for (const sheetName of sheetNames) {
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                    header: options.header || 1,
                    defval: options.defval || null,
                    blankrows: options.blankrows !== false
                });

                sheets[sheetName] = {
                    name: sheetName,
                    data: jsonData,
                    range: worksheet['!ref'] || null,
                    rowCount: jsonData.length,
                    columnCount: jsonData.length > 0 ? Object.keys(jsonData[0]).length : 0
                };

                tables.push({
                    name: sheetName,
                    data: jsonData,
                    headers: jsonData.length > 0 ? Object.keys(jsonData[0]) : []
                });
            }

            const result = {
                success: true,
                type: 'excel',
                sheets: sheets,
                tables: tables,
                sheetNames: sheetNames,
                sheetCount: sheetNames.length
            };

            return result;
        } catch (error) {
            console.error('[DocumentParser] Excel parse error:', error);
            throw error;
        }
    }

    /**
     * Parse text document
     * @param {string} filePath - Path to text document
     * @param {Object} options - Parse options
     * @returns {Promise<Object>} Parsed text document
     */
    async parseText(filePath, options = {}) {
        try {
            const text = await fs.readFile(filePath, 'utf8');
            const lines = text.split('\n');

            const result = {
                success: true,
                type: 'text',
                text: text,
                lines: lines,
                lineCount: lines.length,
                wordCount: text.split(/\s+/).filter(w => w.length > 0).length,
                characterCount: text.length,
                paragraphs: text.split(/\n\n+/).filter(p => p.trim().length > 0)
            };

            return result;
        } catch (error) {
            console.error('[DocumentParser] Text parse error:', error);
            throw error;
        }
    }

    /**
     * Extract tables from PDF
     * @param {Buffer} dataBuffer - PDF buffer
     * @returns {Promise<Array>} Extracted tables
     */
    async extractPDFTables(dataBuffer) {
        // Placeholder for PDF table extraction
        // In production, use pdf-table-extractor or similar library
        return [];
    }

    /**
     * Extract images from PDF
     * @param {Buffer} dataBuffer - PDF buffer
     * @returns {Promise<Array>} Extracted images
     */
    async extractPDFImages(dataBuffer) {
        // Placeholder for PDF image extraction
        // In production, use pdfjs-dist or similar library
        return [];
    }

    /**
     * Extract tables from Word document
     * @param {string} filePath - Path to Word document
     * @returns {Promise<Array>} Extracted tables
     */
    async extractWordTables(filePath) {
        // Placeholder for Word table extraction
        // In production, use mammoth with table extraction options
        return [];
    }

    /**
     * Extract images from Word document
     * @param {string} filePath - Path to Word document
     * @returns {Promise<Array>} Extracted images
     */
    async extractWordImages(filePath) {
        // Placeholder for Word image extraction
        // In production, use mammoth with image extraction options
        return [];
    }

    /**
     * Get document metadata
     * @param {string} filePath - Path to document
     * @returns {Promise<Object>} Document metadata
     */
    async getMetadata(filePath) {
        try {
            const stats = await fs.stat(filePath);
            return {
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
                accessed: stats.atime,
                extension: path.extname(filePath),
                filename: path.basename(filePath),
                directory: path.dirname(filePath)
            };
        } catch (error) {
            console.error('[DocumentParser] Metadata error:', error);
            return {};
        }
    }

    /**
     * Summarize document
     * @param {Object} parsedDocument - Parsed document
     * @param {Object} options - Summary options
     * @returns {Promise<Object>} Document summary
     */
    async summarizeDocument(parsedDocument, options = {}) {
        try {
            const text = parsedDocument.text || '';
            const maxLength = options.maxLength || 500;

            // Simple extractive summarization
            const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
            const summary = sentences.slice(0, Math.ceil(sentences.length * 0.3)).join('. ');

            const result = {
                success: true,
                summary: summary.substring(0, maxLength),
                originalLength: text.length,
                summaryLength: summary.length,
                reductionRatio: (1 - summary.length / text.length).toFixed(2),
                keyPoints: this.extractKeyPoints(text),
                topics: this.extractTopics(text)
            };

            return result;
        } catch (error) {
            console.error('[DocumentParser] Summarization error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Extract key points from text
     * @param {string} text - Text to analyze
     * @returns {Array} Key points
     */
    extractKeyPoints(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
        const keyPoints = [];

        // Simple heuristic: sentences with numbers, lists, or important keywords
        const importantKeywords = ['important', 'key', 'main', 'critical', 'essential', 'must', 'should', 'note', 'remember'];

        for (const sentence of sentences) {
            const hasNumber = /\d+/.test(sentence);
            const hasList = /^\s*[-*•]\s/.test(sentence);
            const hasKeyword = importantKeywords.some(kw => sentence.toLowerCase().includes(kw));

            if (hasNumber || hasList || hasKeyword) {
                keyPoints.push(sentence.trim());
            }

            if (keyPoints.length >= 5) break;
        }

        return keyPoints;
    }

    /**
     * Extract topics from text
     * @param {string} text - Text to analyze
     * @returns {Array} Topics
     */
    extractTopics(text) {
        const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
        const wordFreq = {};

        for (const word of words) {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
        }

        // Sort by frequency and return top 10
        const sortedWords = Object.entries(wordFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([word, freq]) => ({ word, frequency: freq }));

        return sortedWords;
    }

    /**
     * Search in document
     * @param {Object} parsedDocument - Parsed document
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {Promise<Object>} Search results
     */
    async searchDocument(parsedDocument, query, options = {}) {
        try {
            const text = parsedDocument.text || '';
            const caseSensitive = options.caseSensitive || false;
            const regex = new RegExp(query, caseSensitive ? 'g' : 'gi');

            const matches = [];
            let match;

            while ((match = regex.exec(text)) !== null) {
                const start = Math.max(0, match.index - 50);
                const end = Math.min(text.length, match.index + query.length + 50);
                const context = text.substring(start, end);

                matches.push({
                    index: match.index,
                    text: match[0],
                    context: context,
                    line: text.substring(0, match.index).split('\n').length
                });

                if (matches.length >= (options.maxResults || 100)) break;
            }

            const result = {
                success: true,
                query: query,
                matchCount: matches.length,
                matches: matches
            };

            return result;
        } catch (error) {
            console.error('[DocumentParser] Search error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get supported formats
     * @returns {Array} Supported formats
     */
    getSupportedFormats() {
        return this.supportedFormats;
    }

    /**
     * Clear cache
     * @returns {Promise<Object>} Result
     */
    async clearCache() {
        try {
            this.cache.clear();
            await this.saveCache();
            console.log('[DocumentParser] Cache cleared');
            return { success: true };
        } catch (error) {
            console.error('[DocumentParser] Cache clear error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get cache key
     * @param {string} filePath - File path
     * @param {Object} options - Options
     * @returns {string} Cache key
     */
    getCacheKey(filePath, options) {
        return `${filePath}_${JSON.stringify(options)}`;
    }

    /**
     * Load cache from file
     * @returns {Promise<void>}
     */
    async loadCache() {
        try {
            const data = await fs.readFile(this.cachePath, 'utf8');
            const cacheData = JSON.parse(data);
            for (const [key, value] of Object.entries(cacheData)) {
                this.cache.set(key, value);
            }
            console.log('[DocumentParser] Cache loaded');
        } catch (error) {
            console.log('[DocumentParser] No cache file found, starting fresh');
        }
    }

    /**
     * Save cache to file
     * @returns {Promise<void>}
     */
    async saveCache() {
        try {
            const cacheData = Object.fromEntries(this.cache);
            await fs.writeFile(this.cachePath, JSON.stringify(cacheData, null, 2));
        } catch (error) {
            console.error('[DocumentParser] Cache save error:', error);
        }
    }
}

module.exports = new DocumentParserService();
