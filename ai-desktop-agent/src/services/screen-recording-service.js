const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');

/**
 * Screen Recording Service - Time-lapse and session replay
 * Features: Screen recording, time-lapse capture, session replay, video export
 */
class ScreenRecordingService extends EventEmitter {
    constructor() {
        super();
        this.isRecording = false;
        this.isTimeLapse = false;
        this.recordings = new Map(); // Recording sessions
        this.currentRecording = null; // Current recording session
        this.frames = []; // Captured frames
        this.recordingInterval = null;
        this.timeLapseInterval = null;
        this.frameRate = 30; // Frames per second
        this.timeLapseInterval = 5000; // Time-lapse capture interval (ms)
        this.maxRecordingDuration = 3600000; // Max 1 hour (ms)
        this.recordingStartTime = null;
        this.outputPath = path.join(__dirname, '../../data/recordings');
    }

    /**
     * Initialize screen recording service
     * @param {Object} config - Configuration
     */
    async initialize(config = {}) {
        try {
            this.frameRate = config.frameRate || 30;
            this.timeLapseInterval = config.timeLapseInterval || 5000;
            this.maxRecordingDuration = config.maxRecordingDuration || 3600000;
            this.outputPath = config.outputPath || path.join(__dirname, '../../data/recordings');

            // Create output directory
            await fs.mkdir(this.outputPath, { recursive: true });

            // Load existing recordings
            await this.loadRecordings();

            console.log('[ScreenRecording] Screen Recording Service initialized');
            return { success: true };
        } catch (error) {
            console.error('[ScreenRecording] Initialization error:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== RECORDING ====================

    /**
     * Start screen recording
     * @param {Object} options - Recording options
     * @returns {Promise<Object>} Start result
     */
    async startRecording(options = {}) {
        try {
            if (this.isRecording) {
                return {
                    success: false,
                    error: 'Recording already in progress'
                };
            }

            console.log('[ScreenRecording] Starting screen recording...');

            const recordingId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            this.currentRecording = {
                id: recordingId,
                name: options.name || `Recording ${new Date().toLocaleString()}`,
                type: options.type || 'normal', // 'normal' or 'timelapse'
                frameRate: options.frameRate || this.frameRate,
                quality: options.quality || 'high', // 'low', 'medium', 'high'
                startTime: new Date().toISOString(),
                endTime: null,
                duration: 0,
                frameCount: 0,
                frames: [],
                notes: options.notes || '',
                tags: options.tags || [],
                size: { width: 0, height: 0 }
            };

            this.isRecording = true;
            this.isTimeLapse = options.type === 'timelapse';
            this.recordingStartTime = Date.now();
            this.frames = [];

            // Start capturing frames
            if (this.isTimeLapse) {
                this.startTimeLapseCapture();
            } else {
                this.startNormalCapture();
            }

            console.log(`[ScreenRecording] Recording started: ${recordingId}`);

            // Emit event
            this.emit('recordingStarted', this.currentRecording);

            return { success: true, recordingId };
        } catch (error) {
            console.error('[ScreenRecording] Start recording error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Stop screen recording
     * @returns {Promise<Object>} Stop result
     */
    async stopRecording() {
        try {
            if (!this.isRecording) {
                return {
                    success: false,
                    error: 'No recording in progress'
                };
            }

            console.log('[ScreenRecording] Stopping screen recording...');

            // Stop capturing
            if (this.recordingInterval) {
                clearInterval(this.recordingInterval);
                this.recordingInterval = null;
            }

            if (this.timeLapseInterval) {
                clearInterval(this.timeLapseInterval);
                this.timeLapseInterval = null;
            }

            // Finalize recording
            const endTime = new Date().toISOString();
            const duration = Date.now() - this.recordingStartTime;

            this.currentRecording.endTime = endTime;
            this.currentRecording.duration = duration;
            this.currentRecording.frameCount = this.frames.length;
            this.currentRecording.frames = [...this.frames];

            // Save recording
            await this.saveRecording(this.currentRecording);

            // Store in recordings map
            this.recordings.set(this.currentRecording.id, this.currentRecording);

            console.log(`[ScreenRecording] Recording stopped: ${this.currentRecording.id}`);

            // Emit event
            this.emit('recordingStopped', this.currentRecording);

            // Reset state
            this.isRecording = false;
            this.isTimeLapse = false;
            this.currentRecording = null;
            this.frames = [];
            this.recordingStartTime = null;

            return { success: true, recording: this.currentRecording };
        } catch (error) {
            console.error('[ScreenRecording] Stop recording error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Start normal capture
     * @private
     */
    startNormalCapture() {
        const interval = 1000 / this.frameRate;

        this.recordingInterval = setInterval(() => {
            this.captureFrame();
        }, interval);
    }

    /**
     * Start time-lapse capture
     * @private
     */
    startTimeLapseCapture() {
        this.timeLapseInterval = setInterval(() => {
            this.captureFrame();
        }, this.timeLapseInterval);
    }

    /**
     * Capture frame
     * @private
     */
    async captureFrame() {
        try {
            // Import screen controller dynamically to avoid circular dependency
            const ScreenController = require('../controllers/screen-controller');
            const screenController = new ScreenController();

            // Capture screenshot
            const base64 = await screenController.captureToBase64();

            // Add frame
            const frame = {
                timestamp: Date.now(),
                data: base64,
                index: this.frames.length
            };

            this.frames.push(frame);

            // Check max duration
            if (this.recordingStartTime && (Date.now() - this.recordingStartTime) >= this.maxRecordingDuration) {
                console.log('[ScreenRecording] Max recording duration reached, stopping...');
                this.stopRecording();
            }
        } catch (error) {
            console.error('[ScreenRecording] Capture frame error:', error);
        }
    }

    /**
     * Pause recording
     * @returns {Object} Pause result
     */
    pauseRecording() {
        if (!this.isRecording) {
            return {
                success: false,
                error: 'No recording in progress'
            };
        }

        console.log('[ScreenRecording] Pausing recording...');

        // Stop capturing
        if (this.recordingInterval) {
            clearInterval(this.recordingInterval);
            this.recordingInterval = null;
        }

        if (this.timeLapseInterval) {
            clearInterval(this.timeLapseInterval);
            this.timeLapseInterval = null;
        }

        // Emit event
        this.emit('recordingPaused', this.currentRecording);

        return { success: true };
    }

    /**
     * Resume recording
     * @returns {Object} Resume result
     */
    resumeRecording() {
        if (!this.currentRecording) {
            return {
                success: false,
                error: 'No recording to resume'
            };
        }

        console.log('[ScreenRecording] Resuming recording...');

        // Resume capturing
        if (this.isTimeLapse) {
            this.startTimeLapseCapture();
        } else {
            this.startNormalCapture();
        }

        // Emit event
        this.emit('recordingResumed', this.currentRecording);

        return { success: true };
    }

    // ==================== SESSION REPLAY ====================

    /**
     * Get recording
     * @param {string} recordingId - Recording ID
     * @returns {Object|null} Recording or null
     */
    getRecording(recordingId) {
        return this.recordings.get(recordingId) || null;
    }

    /**
     * Get all recordings
     * @param {Object} filters - Optional filters
     * @returns {Array} Recordings array
     */
    getRecordings(filters = {}) {
        let recordings = Array.from(this.recordings.values());

        if (filters.type) {
            recordings = recordings.filter(r => r.type === filters.type);
        }

        if (filters.quality) {
            recordings = recordings.filter(r => r.quality === filters.quality);
        }

        if (filters.startDate) {
            recordings = recordings.filter(r => new Date(r.startTime) >= new Date(filters.startDate));
        }

        if (filters.endDate) {
            recordings = recordings.filter(r => new Date(r.startTime) <= new Date(filters.endDate));
        }

        if (filters.tags && filters.tags.length > 0) {
            recordings = recordings.filter(r =>
                filters.tags.some(tag => r.tags.includes(tag))
            );
        }

        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            recordings = recordings.filter(r =>
                r.name.toLowerCase().includes(searchLower) ||
                r.notes.toLowerCase().includes(searchLower)
            );
        }

        // Sort by start time (descending)
        recordings.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

        return recordings;
    }

    /**
     * Get recording frames
     * @param {string} recordingId - Recording ID
     * @returns {Array} Frames array
     */
    getRecordingFrames(recordingId) {
        const recording = this.recordings.get(recordingId);
        if (!recording) {
            return [];
        }

        return recording.frames || [];
    }

    /**
     * Get recording statistics
     * @param {string} recordingId - Recording ID
     * @returns {Object} Statistics
     */
    getRecordingStatistics(recordingId) {
        const recording = this.recordings.get(recordingId);
        if (!recording) {
            return null;
        }

        const durationMinutes = recording.duration / 60000;
        const durationHours = durationMinutes / 60;

        return {
            id: recording.id,
            name: recording.name,
            type: recording.type,
            duration: recording.duration,
            durationMinutes: Math.round(durationMinutes * 100) / 100,
            durationHours: Math.round(durationHours * 100) / 100,
            frameCount: recording.frameCount,
            frameRate: recording.frameRate,
            quality: recording.quality,
            startTime: recording.startTime,
            endTime: recording.endTime,
            tags: recording.tags,
            notes: recording.notes
        };
    }

    // ==================== EXPORT ====================

    /**
     * Export recording to video
     * @param {string} recordingId - Recording ID
     * @param {string} format - Export format ('mp4', 'webm', 'gif')
     * @returns {Promise<Object>} Export result
     */
    async exportRecording(recordingId, format = 'mp4') {
        try {
            const recording = this.recordings.get(recordingId);
            if (!recording) {
                return {
                    success: false,
                    error: 'Recording not found'
                };
            }

            console.log(`[ScreenRecording] Exporting recording: ${recordingId}`);

            // Generate output filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `${recording.name.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.${format}`;
            const outputPath = path.join(this.outputPath, filename);

            // Export based on format
            // Note: Actual video encoding would require ffmpeg or similar library
            // This is a placeholder implementation
            const exportData = {
                recording,
                format,
                outputPath,
                exportedAt: new Date().toISOString()
            };

            // Save export metadata
            await fs.writeFile(
                outputPath.replace(`.${format}`, '.json'),
                JSON.stringify(exportData, null, 2),
                'utf-8'
            );

            console.log(`[ScreenRecording] Recording exported: ${outputPath}`);

            // Emit event
            this.emit('recordingExported', { recordingId, outputPath, format });

            return { success: true, outputPath };
        } catch (error) {
            console.error('[ScreenRecording] Export recording error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Export all recordings
     * @param {string} format - Export format
     * @returns {Promise<Object>} Export result
     */
    async exportAllRecordings(format = 'mp4') {
        try {
            console.log('[ScreenRecording] Exporting all recordings...');

            const recordings = Array.from(this.recordings.values());
            let exportedCount = 0;

            for (const recording of recordings) {
                const result = await this.exportRecording(recording.id, format);
                if (result.success) {
                    exportedCount++;
                }
            }

            console.log(`[ScreenRecording] Exported ${exportedCount} recordings`);

            return { success: true, exportedCount };
        } catch (error) {
            console.error('[ScreenRecording] Export all recordings error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ==================== MANAGEMENT ====================

    /**
     * Delete recording
     * @param {string} recordingId - Recording ID
     * @returns {Promise<Object>} Delete result
     */
    async deleteRecording(recordingId) {
        try {
            const recording = this.recordings.get(recordingId);
            if (!recording) {
                return {
                    success: false,
                    error: 'Recording not found'
                };
            }

            // Remove from map
            this.recordings.delete(recordingId);

            // Delete files
            const files = await fs.readdir(this.outputPath);
            for (const file of files) {
                if (file.includes(recordingId)) {
                    await fs.unlink(path.join(this.outputPath, file));
                }
            }

            console.log(`[ScreenRecording] Recording deleted: ${recordingId}`);

            // Emit event
            this.emit('recordingDeleted', recording);

            // Save recordings
            await this.saveRecordings();

            return { success: true };
        } catch (error) {
            console.error('[ScreenRecording] Delete recording error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Update recording metadata
     * @param {string} recordingId - Recording ID
     * @param {Object} updates - Updates to apply
     * @returns {Promise<Object>} Update result
     */
    async updateRecording(recordingId, updates) {
        try {
            const recording = this.recordings.get(recordingId);
            if (!recording) {
                return {
                    success: false,
                    error: 'Recording not found'
                };
            }

            // Apply updates
            const updatedRecording = {
                ...recording,
                ...updates
            };

            this.recordings.set(recordingId, updatedRecording);

            console.log(`[ScreenRecording] Recording updated: ${recordingId}`);

            // Emit event
            this.emit('recordingUpdated', updatedRecording);

            // Save recordings
            await this.saveRecordings();

            return { success: true };
        } catch (error) {
            console.error('[ScreenRecording] Update recording error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ==================== PERSISTENCE ====================

    /**
     * Save recordings to file
     * @private
     */
    async saveRecording(recording) {
        try {
            const filename = `${recording.id}.json`;
            const filepath = path.join(this.outputPath, filename);

            const data = JSON.stringify(recording, null, 2);
            await fs.writeFile(filepath, data, 'utf-8');

            console.log(`[ScreenRecording] Recording saved: ${filename}`);
        } catch (error) {
            console.error('[ScreenRecording] Save recording error:', error);
        }
    }

    /**
     * Save all recordings to file
     * @private
     */
    async saveRecordings() {
        try {
            const data = JSON.stringify(Array.from(this.recordings.entries()), null, 2);
            await fs.writeFile(
                path.join(this.outputPath, 'recordings.json'),
                data,
                'utf-8'
            );

            console.log('[ScreenRecording] Recordings saved');
        } catch (error) {
            console.error('[ScreenRecording] Save recordings error:', error);
        }
    }

    /**
     * Load recordings from file
     * @private
     */
    async loadRecordings() {
        try {
            const data = await fs.readFile(
                path.join(this.outputPath, 'recordings.json'),
                'utf-8'
            );
            const entries = JSON.parse(data);
            this.recordings = new Map(entries);

            console.log(`[ScreenRecording] Loaded ${this.recordings.size} recordings`);
        } catch (error) {
            console.log('[ScreenRecording] No saved recordings found');
        }
    }

    // ==================== CLEANUP ====================

    /**
     * Cleanup
     */
    async cleanup() {
        console.log('[ScreenRecording] Cleaning up');

        // Stop recording
        if (this.isRecording) {
            await this.stopRecording();
        }

        // Clear caches
        this.recordings.clear();
        this.frames = [];
    }
}

// Export singleton instance
const screenRecordingService = new ScreenRecordingService();
module.exports = screenRecordingService;
