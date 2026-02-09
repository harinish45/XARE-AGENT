const fs = require('fs');
const path = require('path');
const { GoogleSpreadsheet } = require('google-spreadsheet');

/**
 * Spreadsheet Service - Excel and Google Sheets automation
 * Features: Read/write Excel, Google Sheets operations, formulas, charts
 */
class SpreadsheetService {
    constructor() {
        this.googleClient = null;
        this.googleAuth = null;
        this.googleSheets = null;
        this.excelCache = new Map(); // Cache for Excel operations
    }

    /**
     * Initialize Google Sheets client
     * @param {Object} credentials - Google API credentials
     */
    async initializeGoogleSheets(credentials) {
        try {
            const { JWT } = require('google-auth-library');
            const { google } = require('googleapis');

            // Authenticate with JWT
            this.googleAuth = new JWT({
                email: credentials.client_email,
                key: credentials.private_key,
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });

            // Initialize Sheets API
            this.googleSheets = google.sheets({ version: 'v4', auth: this.googleAuth });

            console.log('[Spreadsheet] Google Sheets initialized');
            return { success: true };
        } catch (error) {
            console.error('[Spreadsheet] Google Sheets initialization error:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== EXCEL OPERATIONS ====================

    /**
     * Read Excel file
     * @param {string} filePath - Path to Excel file
     * @param {Object} options - Read options
     * @returns {Promise<Object>} Read result
     */
    async readExcel(filePath, options = {}) {
        try {
            const XLSX = require('xlsx');

            console.log(`[Spreadsheet] Reading Excel file: ${filePath}`);

            const workbook = XLSX.readFile(filePath);
            const sheetName = options.sheet || workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet, {
                header: options.header !== false,
                range: options.range,
                defval: options.defval
            });

            return {
                success: true,
                data,
                sheetName,
                workbook: {
                    sheets: workbook.SheetNames,
                    sheetCount: workbook.SheetNames.length
                }
            };
        } catch (error) {
            console.error('[Spreadsheet] Read Excel error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Write Excel file
     * @param {string} filePath - Path to save Excel file
     * @param {Array} data - Data to write
     * @param {Object} options - Write options
     * @returns {Promise<Object>} Write result
     */
    async writeExcel(filePath, data, options = {}) {
        try {
            const XLSX = require('xlsx');

            console.log(`[Spreadsheet] Writing Excel file: ${filePath}`);

            const worksheet = XLSX.utils.json_to_sheet(data, {
                header: options.header !== false,
                skipHeader: options.skipHeader
            });

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName || 'Sheet1');

            // Ensure directory exists
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            XLSX.writeFile(workbook, filePath);

            return {
                success: true,
                filePath,
                rowCount: data.length,
                columnCount: data.length > 0 ? Object.keys(data[0]).length : 0
            };
        } catch (error) {
            console.error('[Spreadsheet] Write Excel error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Append to Excel file
     * @param {string} filePath - Path to Excel file
     * @param {Array} data - Data to append
     * @param {Object} options - Append options
     * @returns {Promise<Object>} Append result
     */
    async appendToExcel(filePath, data, options = {}) {
        try {
            const XLSX = require('xlsx');

            console.log(`[Spreadsheet] Appending to Excel file: ${filePath}`);

            // Read existing data
            let existingData = [];
            if (fs.existsSync(filePath)) {
                const existing = await this.readExcel(filePath, { ...options, header: false });
                existingData = existing.data || [];
            }

            // Combine data
            const combinedData = [...existingData, ...data];

            // Write combined data
            return await this.writeExcel(filePath, combinedData, options);
        } catch (error) {
            console.error('[Spreadsheet] Append to Excel error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Update Excel cell
     * @param {string} filePath - Path to Excel file
     * @param {string} cell - Cell reference (e.g., 'A1', 'B2')
     * @param {*} value - Value to set
     * @param {Object} options - Update options
     * @returns {Promise<Object>} Update result
     */
    async updateExcelCell(filePath, cell, value, options = {}) {
        try {
            const XLSX = require('xlsx');

            console.log(`[Spreadsheet] Updating cell ${cell} in: ${filePath}`);

            const workbook = XLSX.readFile(filePath);
            const sheetName = options.sheet || workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Parse cell reference
            const cellRef = XLSX.utils.decode_cell(cell);
            worksheet[cellRef] = { v: value };

            XLSX.writeFile(workbook, filePath);

            return {
                success: true,
                cell,
                value
            };
        } catch (error) {
            console.error('[Spreadsheet] Update Excel cell error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Add formula to Excel cell
     * @param {string} filePath - Path to Excel file
     * @param {string} cell - Cell reference
     * @param {string} formula - Formula to add
     * @returns {Promise<Object>} Add formula result
     */
    async addExcelFormula(filePath, cell, formula) {
        try {
            const XLSX = require('xlsx');

            console.log(`[Spreadsheet] Adding formula to cell ${cell} in: ${filePath}`);

            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            const cellRef = XLSX.utils.decode_cell(cell);
            worksheet[cellRef] = { f: formula };

            XLSX.writeFile(workbook, filePath);

            return {
                success: true,
                cell,
                formula
            };
        } catch (error) {
            console.error('[Spreadsheet] Add formula error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Create Excel chart
     * @param {string} filePath - Path to Excel file
     * @param {Object} chartConfig - Chart configuration
     * @returns {Promise<Object>} Create chart result
     */
    async createExcelChart(filePath, chartConfig) {
        try {
            const XLSX = require('xlsx');

            console.log(`[Spreadsheet] Creating chart in: ${filePath}`);

            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Add chart (simplified - would use exceljs for full chart support)
            const chart = {
                type: chartConfig.type || 'line',
                data: chartConfig.data || [],
                title: chartConfig.title || 'Chart',
                position: chartConfig.position || { x: 0, y: 0 }
            };

            // Store chart metadata in workbook
            if (!workbook.Props) {
                workbook.Props = {};
            }
            workbook.Props.charts = workbook.Props.charts || [];
            workbook.Props.charts.push(chart);

            XLSX.writeFile(workbook, filePath);

            return {
                success: true,
                chart
            };
        } catch (error) {
            console.error('[Spreadsheet] Create chart error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Apply conditional formatting to Excel
     * @param {string} filePath - Path to Excel file
     * @param {Object} rules - Formatting rules
     * @returns {Promise<Object>} Apply formatting result
     */
    async applyExcelFormatting(filePath, rules) {
        try {
            const XLSX = require('xlsx');

            console.log(`[Spreadsheet] Applying formatting to: ${filePath}`);

            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Apply conditional formatting
            if (rules.conditions) {
                rules.conditions.forEach(rule => {
                    const range = rule.range || 'A1:Z100';
                    worksheet[range] = {
                        conditionalFormats: [{
                            type: rule.type || 'cellIs',
                            criteria: rule.criteria || '>',
                            format: rule.format || {
                                font: { color: rule.color || 'FF0000' },
                                fill: { fgColor: rule.bgColor || 'FFFF00' }
                            }
                        }]
                    };
                });
            }

            XLSX.writeFile(workbook, filePath);

            return {
                success: true,
                rulesApplied: rules.conditions?.length || 0
            };
        } catch (error) {
            console.error('[Spreadsheet] Apply formatting error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ==================== GOOGLE SHEETS OPERATIONS ====================

    /**
     * Read Google Sheet
     * @param {string} spreadsheetId - Spreadsheet ID
     * @param {string} range - Range to read (e.g., 'Sheet1!A1:Z100')
     * @returns {Promise<Object>} Read result
     */
    async readGoogleSheet(spreadsheetId, range) {
        try {
            if (!this.googleSheets) {
                throw new Error('Google Sheets not initialized');
            }

            console.log(`[Spreadsheet] Reading Google Sheet: ${spreadsheetId}`);

            const response = await this.googleSheets.spreadsheets.values.get({
                spreadsheetId,
                range: range || 'Sheet1!A1:Z100'
            });

            const data = response.data.values || [];

            return {
                success: true,
                data,
                range: response.data.range,
                rowCount: data.length,
                columnCount: data.length > 0 ? data[0].length : 0
            };
        } catch (error) {
            console.error('[Spreadsheet] Read Google Sheet error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Write to Google Sheet
     * @param {string} spreadsheetId - Spreadsheet ID
     * @param {string} range - Range to write
     * @param {Array} values - Values to write
     * @returns {Promise<Object>} Write result
     */
    async writeGoogleSheet(spreadsheetId, range, values) {
        try {
            if (!this.googleSheets) {
                throw new Error('Google Sheets not initialized');
            }

            console.log(`[Spreadsheet] Writing to Google Sheet: ${spreadsheetId}`);

            const response = await this.googleSheets.spreadsheets.values.update({
                spreadsheetId,
                range: range || 'Sheet1!A1',
                values: [values] // Wrap in array for single value
            });

            return {
                success: true,
                updatedCells: response.data.updates.updatedRows,
                updatedRange: response.data.updates.updatedRange
            };
        } catch (error) {
            console.error('[Spreadsheet] Write Google Sheet error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Append to Google Sheet
     * @param {string} spreadsheetId - Spreadsheet ID
     * @param {Array} values - Values to append
     * @returns {Promise<Object>} Append result
     */
    async appendToGoogleSheet(spreadsheetId, values) {
        try {
            if (!this.googleSheets) {
                throw new Error('Google Sheets not initialized');
            }

            console.log(`[Spreadsheet] Appending to Google Sheet: ${spreadsheetId}`);

            const response = await this.googleSheets.spreadsheets.values.append({
                spreadsheetId,
                values: [values] // Wrap in array
            });

            return {
                success: true,
                updatedCells: response.data.updates.updatedRows,
                updatedRange: response.data.updates.updatedRange
            };
        } catch (error) {
            console.error('[Spreadsheet] Append to Google Sheet error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Update Google Sheet cell
     * @param {string} spreadsheetId - Spreadsheet ID
     * @param {string} range - Cell range
     * @param {*} value - Value to set
     * @returns {Promise<Object>} Update result
     */
    async updateGoogleSheetCell(spreadsheetId, range, value) {
        try {
            if (!this.googleSheets) {
                throw new Error('Google Sheets not initialized');
            }

            console.log(`[Spreadsheet] Updating Google Sheet cell: ${spreadsheetId}`);

            const response = await this.googleSheets.spreadsheets.values.update({
                spreadsheetId,
                range: range || 'Sheet1!A1',
                values: [[value]] // Wrap in 2D array
            });

            return {
                success: true,
                updatedCells: response.data.updates.updatedRows,
                updatedRange: response.data.updates.updatedRange
            };
        } catch (error) {
            console.error('[Spreadsheet] Update Google Sheet cell error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Add formula to Google Sheet cell
     * @param {string} spreadsheetId - Spreadsheet ID
     * @param {string} range - Cell range
     * @param {string} formula - Formula to add
     * @returns {Promise<Object>} Add formula result
     */
    async addGoogleSheetFormula(spreadsheetId, range, formula) {
        try {
            if (!this.googleSheets) {
                throw new Error('Google Sheets not initialized');
            }

            console.log(`[Spreadsheet] Adding formula to Google Sheet: ${spreadsheetId}`);

            const response = await this.googleSheets.spreadsheets.values.update({
                spreadsheetId,
                range: range || 'Sheet1!A1',
                values: [[`=${formula}`]] // Formula starts with =
            });

            return {
                success: true,
                updatedCells: response.data.updates.updatedRows,
                updatedRange: response.data.updates.updatedRange
            };
        } catch (error) {
            console.error('[Spreadsheet] Add formula to Google Sheet error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Create new Google Sheet
     * @param {string} title - Sheet title
     * @returns {Promise<Object>} Create result
     */
    async createGoogleSheet(title) {
        try {
            if (!this.googleSheets) {
                throw new Error('Google Sheets not initialized');
            }

            console.log(`[Spreadsheet] Creating Google Sheet: ${title}`);

            const response = await this.googleSheets.spreadsheets.create({
                resource: {
                    properties: {
                        title: title || 'Untitled Spreadsheet'
                    }
                }
            });

            return {
                success: true,
                spreadsheetId: response.data.spreadsheetId,
                url: response.data.spreadsheetUrl
            };
        } catch (error) {
            console.error('[Spreadsheet] Create Google Sheet error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Delete Google Sheet
     * @param {string} spreadsheetId - Spreadsheet ID
     * @returns {Promise<Object>} Delete result
     */
    async deleteGoogleSheet(spreadsheetId) {
        try {
            if (!this.googleSheets) {
                throw new Error('Google Sheets not initialized');
            }

            console.log(`[Spreadsheet] Deleting Google Sheet: ${spreadsheetId}`);

            await this.googleSheets.spreadsheets.delete({
                spreadsheetId
            });

            return {
                success: true,
                spreadsheetId
            };
        } catch (error) {
            console.error('[Spreadsheet] Delete Google Sheet error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get all Google Sheets
     * @returns {Promise<Object>} List result
     */
    async getGoogleSheets() {
        try {
            if (!this.googleSheets) {
                throw new Error('Google Sheets not initialized');
            }

            console.log('[Spreadsheet] Getting all Google Sheets');

            const response = await this.googleSheets.spreadsheets.get();

            return {
                success: true,
                sheets: response.data.files || [],
                count: response.data.files?.length || 0
            };
        } catch (error) {
            console.error('[Spreadsheet] Get Google Sheets error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Clear Google Sheet
     * @param {string} spreadsheetId - Spreadsheet ID
     * @param {string} range - Range to clear
     * @returns {Promise<Object>} Clear result
     */
    async clearGoogleSheet(spreadsheetId, range) {
        try {
            if (!this.googleSheets) {
                throw new Error('Google Sheets not initialized');
            }

            console.log(`[Spreadsheet] Clearing Google Sheet: ${spreadsheetId}`);

            const response = await this.googleSheets.spreadsheets.values.clear({
                spreadsheetId,
                range: range || 'Sheet1!A1:Z100'
            });

            return {
                success: true,
                clearedCells: response.data.updates.clearedRange
            };
        } catch (error) {
            console.error('[Spreadsheet] Clear Google Sheet error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Batch update Google Sheet
     * @param {string} spreadsheetId - Spreadsheet ID
     * @param {Array} updates - Array of update objects
     * @returns {Promise<Object>} Batch update result
     */
    async batchUpdateGoogleSheet(spreadsheetId, updates) {
        try {
            if (!this.googleSheets) {
                throw new Error('Google Sheets not initialized');
            }

            console.log(`[Spreadsheet] Batch updating Google Sheet: ${spreadsheetId}`);

            const response = await this.googleSheets.spreadsheets.values.batchUpdate({
                spreadsheetId,
                data: updates
            });

            return {
                success: true,
                updatedCells: response.data.responses.map(r => r.updatedCells),
                totalUpdated: response.data.totalUpdatedCells
            };
        } catch (error) {
            console.error('[Spreadsheet] Batch update Google Sheet error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Add chart to Google Sheet
     * @param {string} spreadsheetId - Spreadsheet ID
     * @param {Object} chartConfig - Chart configuration
     * @returns {Promise<Object>} Add chart result
     */
    async addGoogleSheetChart(spreadsheetId, chartConfig) {
        try {
            if (!this.googleSheets) {
                throw new Error('Google Sheets not initialized');
            }

            console.log(`[Spreadsheet] Adding chart to Google Sheet: ${spreadsheetId}`);

            const response = await this.googleSheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requests: [{
                    addChart: {
                        chartId: chartConfig.chartId || `chart_${Date.now()}`,
                        spec: {
                            title: chartConfig.title || 'Chart',
                            type: chartConfig.type || 'LINE',
                            position: chartConfig.position || { rowIndex: 0, colIndex: 0 },
                            basicChart: {
                                axis: {
                                    position: chartConfig.axisPosition || 'BOTTOM_AXIS',
                                    title: chartConfig.axisTitle || ''
                                },
                                domains: {
                                    domain: {
                                        source: {
                                            ranges: chartConfig.dataRange || 'Sheet1!A1:B10'
                                        }
                                    }
                                },
                                series: {
                                    series: {
                                        targetAxis: chartConfig.targetAxis || 'LEFT_AXIS',
                                        series: {
                                            source: {
                                                ranges: chartConfig.dataRange || 'Sheet1!A1:B10'
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }]
            });

            return {
                success: true,
                chartId: response.data.replies[0].addChart.chart.chartId
            };
        } catch (error) {
            console.error('[Spreadsheet] Add chart to Google Sheet error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get Google Sheet info
     * @param {string} spreadsheetId - Spreadsheet ID
     * @returns {Promise<Object>} Sheet info
     */
    async getGoogleSheetInfo(spreadsheetId) {
        try {
            if (!this.googleSheets) {
                throw new Error('Google Sheets not initialized');
            }

            console.log(`[Spreadsheet] Getting Google Sheet info: ${spreadsheetId}`);

            const response = await this.googleSheets.spreadsheets.get({
                spreadsheetId,
                includeGridData: false
            });

            return {
                success: true,
                spreadsheetId,
                title: response.data.properties?.title,
                url: response.data.spreadsheetUrl,
                sheets: response.data.sheets?.map(s => ({
                    sheetId: s.properties.sheetId,
                    title: s.properties.title,
                    index: s.index,
                    sheetType: s.properties.sheetType
                })) || []
            };
        } catch (error) {
            console.error('[Spreadsheet] Get Google Sheet info error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Share Google Sheet
     * @param {string} spreadsheetId - Spreadsheet ID
     * @param {string} email - Email to share with
     * @param {string} role - Permission role (reader, writer, owner)
     * @returns {Promise<Object>} Share result
     */
    async shareGoogleSheet(spreadsheetId, email, role = 'reader') {
        try {
            if (!this.googleSheets) {
                throw new Error('Google Sheets not initialized');
            }

            console.log(`[Spreadsheet] Sharing Google Sheet: ${spreadsheetId} with ${email}`);

            const response = await this.googleSheets.permissions.create({
                resource: {
                    id: spreadsheetId
                },
                requestBody: {
                    emailAddress: email,
                    role: role
                }
            });

            return {
                success: true,
                permissionId: response.data.id
            };
        } catch (error) {
            console.error('[Spreadsheet] Share Google Sheet error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Cleanup Google Sheets client
     */
    async cleanup() {
        console.log('[Spreadsheet] Cleaning up');

        // Clear Excel cache
        this.excelCache.clear();

        // Google Sheets cleanup is automatic with auth library
        this.googleSheets = null;
        this.googleAuth = null;
    }
}

// Export singleton instance
const spreadsheetService = new SpreadsheetService();
module.exports = spreadsheetService;
