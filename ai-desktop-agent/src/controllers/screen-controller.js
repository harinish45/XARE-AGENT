const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const os = require('os');

const execAsync = promisify(exec);

// Tesseract.js for OCR
const Tesseract = require('tesseract.js');

class ScreenController {
    constructor() {
        this.initialized = false;
        this.tempDir = path.join(os.tmpdir(), 'ai-desktop-agent');
        this.ensureTempDir();
        this.ocrWorker = null;
        this.ocrCache = new Map();
        this.cacheMaxSize = 50;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            // Initialize Tesseract worker
            console.log('[OCR] Initializing Tesseract worker...');
            this.ocrWorker = await Tesseract.createWorker('eng', 1, {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        console.log(`[OCR] Progress: ${Math.round(m.progress * 100)}%`);
                    }
                }
            });
            console.log('[OCR] Tesseract worker initialized successfully');

            this.initialized = true;
            console.log('ScreenController initialized');
        } catch (error) {
            console.error('ScreenController initialization error:', error);
            this.initialized = true; // Continue without OCR
        }
    }

    ensureTempDir() {
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    async captureScreen(displayIndex = 0) {
        try {
            const platform = process.platform;
            const screenshotPath = path.join(this.tempDir, `screenshot_${Date.now()}.png`);

            if (platform === 'win32') {
                // Windows: Use PowerShell with .NET - support multi-monitor
                const psScript = `
                    Add-Type -AssemblyName System.Windows.Forms;
                    Add-Type -AssemblyName System.Drawing;
                    $screens = [System.Windows.Forms.Screen]::AllScreens;
                    if ($screens.Count -gt ${displayIndex}) {
                        $bounds = $screens[${displayIndex}].Bounds;
                    } else {
                        $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds;
                    }
                    $bitmap = New-Object System.Drawing.Bitmap $bounds.width, $bounds.height;
                    $graphics = [System.Drawing.Graphics]::FromImage($bitmap);
                    $graphics.CopyFromScreen($bounds.X, $bounds.Y, 0, 0, $bounds.size);
                    $bitmap.Save('${screenshotPath.replace(/\\/g, '\\\\')}', [System.Drawing.Imaging.ImageFormat]::Png);
                    $graphics.Dispose();
                    $bitmap.Dispose();
                `;
                await execAsync(`powershell -Command "${psScript}"`);
            } else if (platform === 'darwin') {
                // macOS: Use screencapture with display parameter
                const displayParam = displayIndex > 0 ? `-D${displayIndex}` : '';
                await execAsync(`screencapture ${displayParam} -x "${screenshotPath}"`);
            } else if (platform === 'linux') {
                // Linux: Try multiple methods
                try {
                    // Try gnome-screenshot first with display
                    const displayParam = displayIndex > 0 ? `--display=:0.${displayIndex}` : '';
                    await execAsync(`gnome-screenshot ${displayParam} -f "${screenshotPath}"`);
                } catch {
                    // Try scrot with display
                    const displayParam = displayIndex > 0 ? `-d :0.${displayIndex}` : '';
                    await execAsync(`scrot ${displayParam} "${screenshotPath}"`);
                }
            }

            if (fs.existsSync(screenshotPath)) {
                return fs.readFileSync(screenshotPath);
            }
            throw new Error('Failed to capture screenshot');
        } catch (error) {
            console.error('Screenshot capture error:', error);
            throw new Error(`Failed to capture screen: ${error.message}`);
        }
    }

    async captureRegion(x, y, width, height) {
        try {
            const platform = process.platform;
            const screenshotPath = path.join(this.tempDir, `region_${Date.now()}.png`);

            if (platform === 'win32') {
                const psScript = `
                    Add-Type -AssemblyName System.Windows.Forms;
                    Add-Type -AssemblyName System.Drawing;
                    $bitmap = New-Object System.Drawing.Bitmap ${width}, ${height};
                    $graphics = [System.Drawing.Graphics]::FromImage($bitmap);
                    $graphics.CopyFromScreen(${x}, ${y}, 0, 0, [System.Drawing.Size]::new(${width}, ${height}));
                    $bitmap.Save('${screenshotPath.replace(/\\/g, '\\\\')}', [System.Drawing.Imaging.ImageFormat]::Png);
                    $graphics.Dispose();
                    $bitmap.Dispose();
                `;
                await execAsync(`powershell -Command "${psScript}"`);
            } else if (platform === 'darwin') {
                await execAsync(`screencapture -R${x},${y},${width},${height} -x "${screenshotPath}"`);
            } else if (platform === 'linux') {
                await execAsync(`import -window root -crop ${width}x${height}+${x}+${y} "${screenshotPath}"`);
            }

            if (fs.existsSync(screenshotPath)) {
                return fs.readFileSync(screenshotPath);
            }
            throw new Error('Failed to capture region');
        } catch (error) {
            console.error('Region capture error:', error);
            throw new Error(`Failed to capture region: ${error.message}`);
        }
    }

    /**
     * Extract text from an image buffer using OCR
     * @param {Buffer} imageBuffer - Image data as buffer
     * @param {Object} options - OCR options
     * @returns {Promise<Object>} OCR result with text and confidence
     */
    async extractText(imageBuffer, options = {}) {
        await this.initialize();

        try {
            // Check cache
            const cacheKey = this.hashBuffer(imageBuffer);
            if (this.ocrCache.has(cacheKey)) {
                console.log('[OCR] Cache hit');
                return this.ocrCache.get(cacheKey);
            }

            // Save buffer to temp file for Tesseract
            const tempPath = path.join(this.tempDir, `ocr_${Date.now()}.png`);
            fs.writeFileSync(tempPath, imageBuffer);

            console.log('[OCR] Starting text extraction...');

            // Perform OCR with Tesseract
            const result = await this.ocrWorker.recognize(tempPath, {
                lang: options.lang || 'eng',
                ...options
            });

            const ocrResult = {
                text: result.data.text,
                confidence: result.data.confidence,
                words: result.data.words.map(w => ({
                    text: w.text,
                    confidence: w.confidence,
                    bbox: w.bbox
                })),
                lines: result.data.lines.map(l => ({
                    text: l.text,
                    confidence: l.confidence,
                    bbox: l.bbox
                })),
                paragraphs: result.data.paragraphs.map(p => ({
                    text: p.text,
                    confidence: p.confidence,
                    bbox: p.bbox
                }))
            };

            // Cache result
            this.addToOCRCache(cacheKey, ocrResult);

            // Cleanup temp file
            try {
                fs.unlinkSync(tempPath);
            } catch (e) {
                // Ignore cleanup errors
            }

            console.log(`[OCR] Extracted ${ocrResult.text.length} characters (confidence: ${ocrResult.confidence}%)`);
            return ocrResult;
        } catch (error) {
            console.error('OCR extraction error:', error);
            return {
                text: '',
                confidence: 0,
                words: [],
                lines: [],
                paragraphs: [],
                error: error.message
            };
        }
    }

    /**
     * Extract text from a specific region
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate  
     * @param {number} width - Region width
     * @param {number} height - Region height
     * @param {Object} options - OCR options
     * @returns {Promise<Object>} OCR result
     */
    async extractTextFromRegion(x, y, width, height, options = {}) {
        try {
            const regionBuffer = await this.captureRegion(x, y, width, height);
            return await this.extractText(regionBuffer, options);
        } catch (error) {
            console.error('Region OCR error:', error);
            throw new Error(`Failed to extract text from region: ${error.message}`);
        }
    }

    /**
     * Find text on screen and return its location
     * @param {string} searchText - Text to search for
     * @param {Object} options - OCR options
     * @returns {Promise<Array>} Array of matches with bounding boxes
     */
    async findTextOnScreen(searchText, options = {}) {
        try {
            const screenshot = await this.captureScreen();
            const ocrResult = await this.extractText(screenshot, options);

            if (!ocrResult.words || ocrResult.words.length === 0) {
                return [];
            }

            // Find matching words
            const matches = ocrResult.words.filter(word =>
                word.text.toLowerCase().includes(searchText.toLowerCase())
            );

            console.log(`[OCR] Found ${matches.length} matches for "${searchText}"`);
            return matches.map(match => ({
                text: match.text,
                confidence: match.confidence,
                x: match.bbox.x0,
                y: match.bbox.y0,
                width: match.bbox.x1 - match.bbox.x0,
                height: match.bbox.y1 - match.bbox.y0
            }));
        } catch (error) {
            console.error('Find text error:', error);
            return [];
        }
    }

    /**
     * Hash buffer for caching
     * @param {Buffer} buffer - Buffer to hash
     * @returns {string} Hash string
     */
    hashBuffer(buffer) {
        // Simple hash using first and last 1000 bytes
        const sample = buffer.slice(0, 1000).toString('hex') +
            buffer.slice(-1000).toString('hex');
        let hash = 0;
        for (let i = 0; i < sample.length; i++) {
            const char = sample.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }

    /**
     * Add result to OCR cache
     * @param {string} key - Cache key
     * @param {Object} result - OCR result
     */
    addToOCRCache(key, result) {
        // Enforce cache size limit
        if (this.ocrCache.size >= this.cacheMaxSize) {
            const firstKey = this.ocrCache.keys().next().value;
            this.ocrCache.delete(firstKey);
        }
        this.ocrCache.set(key, result);
    }

    /**
     * Clear OCR cache
     */
    clearOCRCache() {
        this.ocrCache.clear();
        console.log('[OCR] Cache cleared');
    }

    async getActiveWindow() {
        try {
            const platform = process.platform;

            if (platform === 'win32') {
                const psScript = `
                    Add-Type -AssemblyName System.Windows.Forms;
                    $activeWindow = [System.Windows.Forms.Application]::OpenForms[0];
                    if ($activeWindow) {
                        @{
                            title = $activeWindow.Text;
                            bounds = @{
                                x = $activeWindow.Location.X;
                                y = $activeWindow.Location.Y;
                                width = $activeWindow.Width;
                                height = $activeWindow.Height;
                            };
                        } | ConvertTo-Json;
                    } else {
                        @{
                            title = 'Unknown Window';
                            owner = @{ name = 'Unknown App' };
                            bounds = @{ x = 0; y = 0; width = 1920; height = 1080 };
                            id = 0;
                        } | ConvertTo-Json;
                    }
                `;
                const { stdout } = await execAsync(`powershell -Command "${psScript}"`);
                return JSON.parse(stdout);
            } else if (platform === 'darwin') {
                const { stdout } = await execAsync(`osascript -e 'tell application "System Events" to get name of first application process whose frontmost is true'`);
                return {
                    title: stdout.trim(),
                    owner: { name: stdout.trim() },
                    bounds: { x: 0, y: 0, width: 1920, height: 1080 },
                    id: 0
                };
            } else {
                return {
                    title: 'Unknown Window',
                    owner: { name: 'Unknown App' },
                    bounds: { x: 0, y: 0, width: 1920, height: 1080 },
                    id: 0
                };
            }
        } catch (error) {
            console.error('Get active window error:', error);
            return {
                title: 'Unknown Window',
                owner: { name: 'Unknown App' },
                bounds: { x: 0, y: 0, width: 1920, height: 1080 },
                id: 0
            };
        }
    }

    async captureToBase64() {
        try {
            const buffer = await this.captureScreen();
            return buffer.toString('base64');
        } catch (error) {
            console.error('Capture to base64 error:', error);
            throw new Error(`Failed to capture to base64: ${error.message}`);
        }
    }

    /**
     * Get information about all connected displays
     * @returns {Promise<Array>} Array of display information
     */
    async getDisplays() {
        try {
            const platform = process.platform;

            if (platform === 'win32') {
                const psScript = `
                    Add-Type -AssemblyName System.Windows.Forms;
                    $screens = [System.Windows.Forms.Screen]::AllScreens;
                    $result = @();
                    for ($i = 0; $i -lt $screens.Count; $i++) {
                        $result += @{
                            index = $i;
                            isPrimary = $screens[$i].Primary;
                            bounds = @{
                                x = $screens[$i].Bounds.X;
                                y = $screens[$i].Bounds.Y;
                                width = $screens[$i].Bounds.Width;
                                height = $screens[$i].Bounds.Height;
                            };
                            workingArea = @{
                                x = $screens[$i].WorkingArea.X;
                                y = $screens[$i].WorkingArea.Y;
                                width = $screens[$i].WorkingArea.Width;
                                height = $screens[$i].WorkingArea.Height;
                            };
                            deviceName = $screens[$i].DeviceName;
                        }
                    }
                    $result | ConvertTo-Json;
                `;
                const { stdout } = await execAsync(`powershell -Command "${psScript}"`);
                return JSON.parse(stdout);
            } else if (platform === 'darwin') {
                const { stdout } = await execAsync(`
                    system_profiler SPDisplaysDataType | grep -A 3 "Resolution"
                `);
                // Parse macOS display info (simplified)
                const lines = stdout.trim().split('\n');
                const displays = [];
                let currentDisplay = { index: 0, isPrimary: true };

                for (const line of lines) {
                    if (line.includes('Resolution')) {
                        const match = line.match(/(\d+)\s*x\s*(\d+)/);
                        if (match) {
                            currentDisplay.bounds = {
                                x: 0,
                                y: 0,
                                width: parseInt(match[1]),
                                height: parseInt(match[2])
                            };
                            currentDisplay.workingArea = { ...currentDisplay.bounds };
                            displays.push({ ...currentDisplay });
                            currentDisplay = { index: displays.length, isPrimary: false };
                        }
                    }
                }

                return displays.length > 0 ? displays : [{
                    index: 0,
                    isPrimary: true,
                    bounds: { x: 0, y: 0, width: 1920, height: 1080 },
                    workingArea: { x: 0, y: 0, width: 1920, height: 1080 },
                    deviceName: 'Primary Display'
                }];
            } else if (platform === 'linux') {
                // Linux: Use xrandr
                try {
                    const { stdout } = await execAsync('xrandr --query');
                    const lines = stdout.trim().split('\n');
                    const displays = [];
                    let index = 0;

                    for (const line of lines) {
                        if (line.includes(' connected')) {
                            const parts = line.split(/\s+/);
                            const name = parts[0];
                            const resolutionMatch = line.match(/(\d+)x(\d+)\+/);
                            if (resolutionMatch) {
                                displays.push({
                                    index: index++,
                                    isPrimary: line.includes('primary'),
                                    bounds: {
                                        x: parseInt(resolutionMatch[3]) || 0,
                                        y: parseInt(resolutionMatch[4]) || 0,
                                        width: parseInt(resolutionMatch[1]),
                                        height: parseInt(resolutionMatch[2])
                                    },
                                    workingArea: {
                                        x: parseInt(resolutionMatch[3]) || 0,
                                        y: parseInt(resolutionMatch[4]) || 0,
                                        width: parseInt(resolutionMatch[1]),
                                        height: parseInt(resolutionMatch[2])
                                    },
                                    deviceName: name
                                });
                            }
                        }
                    }

                    return displays.length > 0 ? displays : [{
                        index: 0,
                        isPrimary: true,
                        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
                        workingArea: { x: 0, y: 0, width: 1920, height: 1080 },
                        deviceName: 'Primary Display'
                    }];
                } catch {
                    return [{
                        index: 0,
                        isPrimary: true,
                        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
                        workingArea: { x: 0, y: 0, width: 1920, height: 1080 },
                        deviceName: 'Primary Display'
                    }];
                }
            }

            return [{
                index: 0,
                isPrimary: true,
                bounds: { x: 0, y: 0, width: 1920, height: 1080 },
                workingArea: { x: 0, y: 0, width: 1920, height: 1080 },
                deviceName: 'Primary Display'
            }];
        } catch (error) {
            console.error('Get displays error:', error);
            return [{
                index: 0,
                isPrimary: true,
                bounds: { x: 0, y: 0, width: 1920, height: 1080 },
                workingArea: { x: 0, y: 0, width: 1920, height: 1080 },
                deviceName: 'Primary Display'
            }];
        }
    }

    /**
     * Get primary display index
     * @returns {Promise<number>} Index of primary display
     */
    async getPrimaryDisplayIndex() {
        try {
            const displays = await this.getDisplays();
            const primary = displays.find(d => d.isPrimary);
            return primary ? primary.index : 0;
        } catch (error) {
            console.error('Get primary display error:', error);
            return 0;
        }
    }

    async cleanup() {
        // Clean up temp files older than 1 hour
        try {
            const files = fs.readdirSync(this.tempDir);
            const now = Date.now();
            const oneHour = 60 * 60 * 1000;

            for (const file of files) {
                const filePath = path.join(this.tempDir, file);
                const stats = fs.statSync(filePath);
                if (now - stats.mtimeMs > oneHour) {
                    fs.unlinkSync(filePath);
                }
            }

            // Cleanup OCR resources
            if (this.ocrWorker) {
                console.log('[OCR] Terminating worker...');
                await this.ocrWorker.terminate();
                this.ocrWorker = null;
            }
            this.clearOCRCache();
        } catch (error) {
            console.error('Cleanup error:', error);
        }
    }
}

module.exports = ScreenController;
