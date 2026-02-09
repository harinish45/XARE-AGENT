/**
 * Media Editing Service
 * Full video and audio editing with FFmpeg
 */

const { spawn } = require('child_process');
const EventEmitter = require('events');
const path = require('path');
const fs = require('fs');

class MediaEditingService extends EventEmitter {
    constructor() {
        super();
        this.isInitialized = false;
        this.ffmpegPath = null;
        this.ffprobePath = null;
        this.activeProcesses = new Map();
        this.defaultOptions = {
            videoCodec: 'libx264',
            audioCodec: 'aac',
            quality: 'medium',
            threads: 4
        };
    }

    /**
     * Initialize FFmpeg service
     */
    async initialize(options = {}) {
        try {
            console.log('[Media Editing] Initializing...');

            // Find FFmpeg executable
            this.ffmpegPath = options.ffmpegPath || await this.findExecutable('ffmpeg');
            this.ffprobePath = options.ffprobePath || await this.findExecutable('ffprobe');

            if (!this.ffmpegPath) {
                throw new Error('FFmpeg not found. Please install FFmpeg.');
            }

            this.isInitialized = true;

            this.emit('initialized');
            console.log('[Media Editing] Initialized successfully');
            console.log(`[Media Editing] FFmpeg: ${this.ffmpegPath}`);
            console.log(`[Media Editing] FFprobe: ${this.ffprobePath}`);

            return { success: true, ffmpegPath: this.ffmpegPath, ffprobePath: this.ffprobePath };
        } catch (error) {
            console.error('[Media Editing] Initialization error:', error);
            this.emit('error', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Find FFmpeg executable
     */
    async findExecutable(name) {
        const { exec } = require('child_process');

        try {
            // Try to find in PATH
            const result = await new Promise((resolve, reject) => {
                exec(`${name} -version`, (error, stdout, stderr) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(stdout.trim());
                    }
                });
            });

            console.log(`[Media Editing] Found ${name}: ${result}`);
            return name;
        } catch (error) {
            console.log(`[Media Editing] ${name} not found in PATH`);
            return null;
        }
    }

    /**
     * Get video info
     */
    async getVideoInfo(filePath) {
        try {
            const result = await this.executeFFprobe([
                '-v', 'error',
                '-show_entries',
                '-of', 'json',
                filePath
            ]);

            const info = JSON.parse(result.stdout);

            return {
                success: true,
                info: {
                    duration: parseFloat(info.format?.duration || 0),
                    width: parseInt(info.streams?.[0]?.width || 0),
                    height: parseInt(info.streams?.[0]?.height || 0),
                    fps: eval(info.streams?.[0]?.r_frame_rate || '0'),
                    codec: info.streams?.[0]?.codec_name || 'unknown',
                    bitrate: parseInt(info.format?.bit_rate || 0),
                    size: parseInt(info.format?.size || 0),
                    format: info.format?.format_name || 'unknown'
                }
            };
        } catch (error) {
            console.error('[Media Editing] Get video info error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Trim video
     */
    async trimVideo(inputPath, outputPath, startTime, endTime, options = {}) {
        try {
            console.log(`[Media Editing] Trimming video: ${inputPath}`);

            const args = [
                '-i', inputPath,
                '-ss', startTime.toString(),
                '-to', endTime.toString(),
                '-c:v', options.videoCodec || this.defaultOptions.videoCodec,
                '-c:a', options.audioCodec || this.defaultOptions.audioCodec,
                '-threads', (options.threads || this.defaultOptions.threads).toString(),
                '-y',
                outputPath
            ];

            const result = await this.executeFFmpeg(args);

            this.emit('video-trimmed', { inputPath, outputPath, startTime, endTime });

            return { success: true, outputPath };
        } catch (error) {
            console.error('[Media Editing] Trim video error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Merge videos
     */
    async mergeVideos(inputPaths, outputPath, options = {}) {
        try {
            console.log(`[Media Editing] Merging ${inputPaths.length} videos`);

            // Create concat list
            const concatListPath = path.join(__dirname, '../../data/temp/concat.txt');
            const concatList = inputPaths.map(p => `file '${p}'`).join('\n');
            await fs.promises.mkdir(path.dirname(concatListPath), { recursive: true });
            await fs.promises.writeFile(concatListPath, concatList);

            const args = [
                '-f', 'concat',
                '-safe', '0',
                '-i', concatListPath,
                '-c:v', options.videoCodec || this.defaultOptions.videoCodec,
                '-c:a', options.audioCodec || this.defaultOptions.audioCodec,
                '-threads', (options.threads || this.defaultOptions.threads).toString(),
                '-y',
                outputPath
            ];

            const result = await this.executeFFmpeg(args);

            // Clean up temp file
            await fs.promises.unlink(concatListPath);

            this.emit('videos-merged', { inputPaths, outputPath });

            return { success: true, outputPath };
        } catch (error) {
            console.error('[Media Editing] Merge videos error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Add watermark to video
     */
    async addWatermark(inputPath, watermarkPath, outputPath, options = {}) {
        try {
            console.log(`[Media Editing] Adding watermark to: ${inputPath}`);

            const args = [
                '-i', inputPath,
                '-i', watermarkPath,
                '-filter_complex', this.buildWatermarkFilter(watermarkPath, options),
                '-c:v', options.videoCodec || this.defaultOptions.videoCodec,
                '-threads', (options.threads || this.defaultOptions.threads).toString(),
                '-y',
                outputPath
            ];

            const result = await this.executeFFmpeg(args);

            this.emit('watermark-added', { inputPath, watermarkPath, outputPath });

            return { success: true, outputPath };
        } catch (error) {
            console.error('[Media Editing] Add watermark error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Build watermark filter
     */
    buildWatermarkFilter(watermarkPath, options) {
        const position = options.position || 'bottom-right';
        const opacity = options.opacity || 0.7;
        const padding = options.padding || 10;

        const positionMap = {
            'top-left': '10:10',
            'top-right': 'W-w-10:10',
            'bottom-left': '10:H-h-10',
            'bottom-right': 'W-w-10:H-h-10'
        };

        return `[1:v]format=yuva420p,colorchannelmixer=aa=${opacity}[wm];[0:v][wm]overlay=${positionMap[position]}`;
    }

    /**
     * Extract audio from video
     */
    async extractAudio(inputPath, outputPath, options = {}) {
        try {
            console.log(`[Media Editing] Extracting audio from: ${inputPath}`);

            const args = [
                '-i', inputPath,
                '-vn',
                '-acodec', options.audioCodec || 'libmp3lame',
                '-ab', options.bitrate || '192k',
                '-y',
                outputPath
            ];

            const result = await this.executeFFmpeg(args);

            this.emit('audio-extracted', { inputPath, outputPath });

            return { success: true, outputPath };
        } catch (error) {
            console.error('[Media Editing] Extract audio error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Merge audio with video
     */
    async mergeAudioWithVideo(videoPath, audioPath, outputPath, options = {}) {
        try {
            console.log(`[Media Editing] Merging audio with video`);

            const args = [
                '-i', videoPath,
                '-i', audioPath,
                '-c:v', 'copy',
                '-c:a', options.audioCodec || 'aac',
                '-shortest',
                '-y',
                outputPath
            ];

            const result = await this.executeFFmpeg(args);

            this.emit('audio-merged', { videoPath, audioPath, outputPath });

            return { success: true, outputPath };
        } catch (error) {
            console.error('[Media Editing] Merge audio error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Trim audio
     */
    async trimAudio(inputPath, outputPath, startTime, endTime, options = {}) {
        try {
            console.log(`[Media Editing] Trimming audio: ${inputPath}`);

            const args = [
                '-i', inputPath,
                '-ss', startTime.toString(),
                '-to', endTime.toString(),
                '-c:a', options.audioCodec || 'libmp3lame',
                '-y',
                outputPath
            ];

            const result = await this.executeFFmpeg(args);

            this.emit('audio-trimmed', { inputPath, outputPath, startTime, endTime });

            return { success: true, outputPath };
        } catch (error) {
            console.error('[Media Editing] Trim audio error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Merge audio files
     */
    async mergeAudio(inputPaths, outputPath, options = {}) {
        try {
            console.log(`[Media Editing] Merging ${inputPaths.length} audio files`);

            // Create concat list
            const concatListPath = path.join(__dirname, '../../data/temp/audio-concat.txt');
            const concatList = inputPaths.map(p => `file '${p}'`).join('\n');
            await fs.promises.mkdir(path.dirname(concatListPath), { recursive: true });
            await fs.promises.writeFile(concatListPath, concatList);

            const args = [
                '-f', 'concat',
                '-safe', '0',
                '-i', concatListPath,
                '-c:a', options.audioCodec || 'libmp3lame',
                '-y',
                outputPath
            ];

            const result = await this.executeFFmpeg(args);

            // Clean up temp file
            await fs.promises.unlink(concatListPath);

            this.emit('audio-merged', { inputPaths, outputPath });

            return { success: true, outputPath };
        } catch (error) {
            console.error('[Media Editing] Merge audio error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Add audio effects
     */
    async addAudioEffects(inputPath, outputPath, effects, options = {}) {
        try {
            console.log(`[Media Editing] Adding audio effects to: ${inputPath}`);

            const filter = this.buildAudioFilter(effects);

            const args = [
                '-i', inputPath,
                '-af', filter,
                '-c:a', options.audioCodec || 'libmp3lame',
                '-y',
                outputPath
            ];

            const result = await this.executeFFmpeg(args);

            this.emit('audio-effects-added', { inputPath, outputPath, effects });

            return { success: true, outputPath };
        } catch (error) {
            console.error('[Media Editing] Add audio effects error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Build audio filter
     */
    buildAudioFilter(effects) {
        const filters = [];

        if (effects.volume) {
            filters.push(`volume=${effects.volume}`);
        }

        if (effects.fadeIn) {
            filters.push(`afade=t=in:st=0:d=${effects.fadeIn}`);
        }

        if (effects.fadeOut) {
            filters.push(`afade=t=out:st=${effects.fadeOutStart || 0}:d=${effects.fadeOut}`);
        }

        if (effects.speed) {
            filters.push(`atempo=${effects.speed}`);
        }

        if (effects.echo) {
            filters.push(`aecho=0.8:0.9:1000:0.3`);
        }

        if (effects.reverb) {
            filters.push(`areverse`);
        }

        return filters.join(',');
    }

    /**
     * Convert video format
     */
    async convertVideo(inputPath, outputPath, options = {}) {
        try {
            console.log(`[Media Editing] Converting video: ${inputPath}`);

            const args = [
                '-i', inputPath,
                '-c:v', options.videoCodec || this.defaultOptions.videoCodec,
                '-c:a', options.audioCodec || this.defaultOptions.audioCodec,
                '-threads', (options.threads || this.defaultOptions.threads).toString(),
                '-y',
                outputPath
            ];

            const result = await this.executeFFmpeg(args);

            this.emit('video-converted', { inputPath, outputPath });

            return { success: true, outputPath };
        } catch (error) {
            console.error('[Media Editing] Convert video error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Convert audio format
     */
    async convertAudio(inputPath, outputPath, options = {}) {
        try {
            console.log(`[Media Editing] Converting audio: ${inputPath}`);

            const args = [
                '-i', inputPath,
                '-c:a', options.audioCodec || 'libmp3lame',
                '-ab', options.bitrate || '192k',
                '-y',
                outputPath
            ];

            const result = await this.executeFFmpeg(args);

            this.emit('audio-converted', { inputPath, outputPath });

            return { success: true, outputPath };
        } catch (error) {
            console.error('[Media Editing] Convert audio error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Generate thumbnail from video
     */
    async generateThumbnail(inputPath, outputPath, options = {}) {
        try {
            console.log(`[Media Editing] Generating thumbnail from: ${inputPath}`);

            const timestamp = options.timestamp || '00:00:01';
            const width = options.width || 320;
            const height = options.height || -1;

            const args = [
                '-i', inputPath,
                '-ss', timestamp,
                '-vframes', '1',
                '-vf', `scale=${width}:${height}`,
                '-y',
                outputPath
            ];

            const result = await this.executeFFmpeg(args);

            this.emit('thumbnail-generated', { inputPath, outputPath });

            return { success: true, outputPath };
        } catch (error) {
            console.error('[Media Editing] Generate thumbnail error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Create GIF from video
     */
    async createGIF(inputPath, outputPath, options = {}) {
        try {
            console.log(`[Media Editing] Creating GIF from: ${inputPath}`);

            const startTime = options.startTime || '00:00:00';
            const duration = options.duration || 5;
            const fps = options.fps || 10;
            const width = options.width || 480;

            const args = [
                '-i', inputPath,
                '-ss', startTime,
                '-t', duration.toString(),
                '-vf', `fps=${fps},scale=${width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`,
                '-y',
                outputPath
            ];

            const result = await this.executeFFmpeg(args);

            this.emit('gif-created', { inputPath, outputPath });

            return { success: true, outputPath };
        } catch (error) {
            console.error('[Media Editing] Create GIF error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Resize video
     */
    async resizeVideo(inputPath, outputPath, width, height, options = {}) {
        try {
            console.log(`[Media Editing] Resizing video: ${inputPath}`);

            const args = [
                '-i', inputPath,
                '-vf', `scale=${width}:${height}`,
                '-c:v', options.videoCodec || this.defaultOptions.videoCodec,
                '-c:a', options.audioCodec || this.defaultOptions.audioCodec,
                '-y',
                outputPath
            ];

            const result = await this.executeFFmpeg(args);

            this.emit('video-resized', { inputPath, outputPath, width, height });

            return { success: true, outputPath };
        } catch (error) {
            console.error('[Media Editing] Resize video error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Change video speed
     */
    async changeVideoSpeed(inputPath, outputPath, speed, options = {}) {
        try {
            console.log(`[Media Editing] Changing video speed: ${inputPath}`);

            const args = [
                '-i', inputPath,
                '-filter_complex', `[0:v]setpts=${1 / speed}*PTS[v];[0:a]atempo=${speed}[a]`,
                '-map', '[v]',
                '-map', '[a]',
                '-c:v', options.videoCodec || this.defaultOptions.videoCodec,
                '-c:a', options.audioCodec || this.defaultOptions.audioCodec,
                '-y',
                outputPath
            ];

            const result = await this.executeFFmpeg(args);

            this.emit('video-speed-changed', { inputPath, outputPath, speed });

            return { success: true, outputPath };
        } catch (error) {
            console.error('[Media Editing] Change video speed error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Rotate video
     */
    async rotateVideo(inputPath, outputPath, angle, options = {}) {
        try {
            console.log(`[Media Editing] Rotating video: ${inputPath}`);

            const transposeMap = {
                90: '1',
                180: '2,transpose=1',
                270: '2'
            };

            const args = [
                '-i', inputPath,
                '-vf', `transpose=${transposeMap[angle] || '1'}`,
                '-c:v', options.videoCodec || this.defaultOptions.videoCodec,
                '-c:a', options.audioCodec || this.defaultOptions.audioCodec,
                '-y',
                outputPath
            ];

            const result = await this.executeFFmpeg(args);

            this.emit('video-rotated', { inputPath, outputPath, angle });

            return { success: true, outputPath };
        } catch (error) {
            console.error('[Media Editing] Rotate video error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Execute FFmpeg command
     */
    executeFFmpeg(args) {
        return new Promise((resolve, reject) => {
            const processId = Date.now();
            const ffmpegProcess = spawn(this.ffmpegPath, args);

            this.activeProcesses.set(processId, ffmpegProcess);

            let stdout = '';
            let stderr = '';

            ffmpegProcess.stdout.on('data', (data) => {
                stdout += data.toString();
                this.emit('progress', { processId, data: data.toString() });
            });

            ffmpegProcess.stderr.on('data', (data) => {
                stderr += data.toString();
                this.emit('progress', { processId, data: data.toString() });
            });

            ffmpegProcess.on('close', (code) => {
                this.activeProcesses.delete(processId);

                if (code === 0) {
                    resolve({ stdout, stderr });
                } else {
                    reject(new Error(`FFmpeg process exited with code ${code}: ${stderr}`));
                }
            });

            ffmpegProcess.on('error', (error) => {
                this.activeProcesses.delete(processId);
                reject(error);
            });
        });
    }

    /**
     * Execute FFprobe command
     */
    executeFFprobe(args) {
        return new Promise((resolve, reject) => {
            const ffprobeProcess = spawn(this.ffprobePath, args);

            let stdout = '';
            let stderr = '';

            ffprobeProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            ffprobeProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            ffprobeProcess.on('close', (code) => {
                if (code === 0) {
                    resolve({ stdout, stderr });
                } else {
                    reject(new Error(`FFprobe process exited with code ${code}: ${stderr}`));
                }
            });

            ffprobeProcess.on('error', (error) => {
                reject(error);
            });
        });
    }

    /**
     * Cancel active process
     */
    cancelProcess(processId) {
        const process = this.activeProcesses.get(processId);
        if (process) {
            process.kill();
            this.activeProcesses.delete(processId);
            this.emit('process-cancelled', { processId });
            return { success: true };
        }
        return { success: false, error: 'Process not found' };
    }

    /**
     * Get active processes
     */
    getActiveProcesses() {
        return Array.from(this.activeProcesses.keys());
    }

    /**
     * Get status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            ffmpegPath: this.ffmpegPath,
            ffprobePath: this.ffprobePath,
            activeProcesses: this.getActiveProcesses().length,
            defaultOptions: this.defaultOptions
        };
    }

    /**
     * Shutdown
     */
    async shutdown() {
        console.log('[Media Editing] Shutting down...');

        // Cancel all active processes
        for (const processId of this.activeProcesses.keys()) {
            this.cancelProcess(processId);
        }

        this.isInitialized = false;
        this.emit('shutdown');

        console.log('[Media Editing] Shutdown complete');
        return { success: true };
    }
}

// Export singleton instance
const mediaEditingService = new MediaEditingService();

module.exports = mediaEditingService;
