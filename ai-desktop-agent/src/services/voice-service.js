const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');

/**
 * Voice Service - Voice commands, recording, and recognition
 * Features: Speech-to-text, text-to-speech, voice commands, audio recording
 */
class VoiceService extends EventEmitter {
    constructor() {
        super();
        this.isRecording = false;
        this.isListening = false;
        this.recordingStream = null;
        this.recognition = null;
        this.synthesis = (typeof window !== 'undefined' && window.speechSynthesis) ? window.speechSynthesis : null;
        this.recordings = new Map();
        this.commands = new Map();
        this.outputPath = path.join(__dirname, '../../data/voice-recordings');
        this.language = 'en-US';
        this.continuous = false;
        this.interimResults = false;
    }

    /**
     * Initialize voice service
     * @param {Object} config - Configuration
     */
    async initialize(config = {}) {
        try {
            this.language = config.language || 'en-US';
            this.continuous = config.continuous || false;
            this.interimResults = config.interimResults || false;

            // Create output directory
            await fs.mkdir(this.outputPath, { recursive: true });

            // Load existing recordings
            await this.loadRecordings();

            // Load default commands
            this.loadDefaultCommands();

            console.log('[Voice] Voice Service initialized');
            return { success: true };
        } catch (error) {
            console.error('[Voice] Initialization error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Start voice recognition
     * @param {Object} options - Recognition options
     * @returns {Promise<Object>} Start result
     */
    async startRecognition(options = {}) {
        try {
            if (this.isListening) {
                return {
                    success: false,
                    error: 'Voice recognition already active'
                };
            }

            console.log('[Voice] Starting voice recognition...');

            // Check for Web Speech API support
            if (typeof window === 'undefined' || (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window))) {
                throw new Error('Speech recognition not supported in this browser');
            }

            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();

            this.recognition.lang = options.language || this.language;
            this.recognition.continuous = options.continuous !== undefined ? options.continuous : this.continuous;
            this.recognition.interimResults = options.interimResults !== undefined ? options.interimResults : this.interimResults;

            this.recognition.onstart = () => {
                this.isListening = true;
                this.emit('recognition-started');
                console.log('[Voice] Recognition started');
            };

            this.recognition.onresult = (event) => {
                const results = [];
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const result = event.results[i];
                    results.push({
                        transcript: result[0].transcript,
                        confidence: result[0].confidence,
                        isFinal: result.isFinal
                    });
                }

                this.emit('recognition-result', {
                    results: results,
                    isFinal: event.results[event.results.length - 1].isFinal
                });

                // Check for voice commands
                if (event.results[event.results.length - 1].isFinal) {
                    const transcript = event.results[event.results.length - 1][0].transcript;
                    this.checkCommands(transcript);
                }
            };

            this.recognition.onerror = (event) => {
                console.error('[Voice] Recognition error:', event.error);
                this.emit('recognition-error', { error: event.error });
            };

            this.recognition.onend = () => {
                this.isListening = false;
                this.emit('recognition-ended');
                console.log('[Voice] Recognition ended');
            };

            this.recognition.start();

            return {
                success: true,
                language: this.recognition.lang,
                continuous: this.recognition.continuous
            };
        } catch (error) {
            console.error('[Voice] Start recognition error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Stop voice recognition
     * @returns {Promise<Object>} Stop result
     */
    async stopRecognition() {
        try {
            if (!this.isListening || !this.recognition) {
                return {
                    success: false,
                    error: 'Voice recognition not active'
                };
            }

            this.recognition.stop();
            this.recognition = null;

            return {
                success: true
            };
        } catch (error) {
            console.error('[Voice] Stop recognition error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Start audio recording
     * @param {Object} options - Recording options
     * @returns {Promise<Object>} Start result
     */
    async startRecording(options = {}) {
        try {
            if (this.isRecording) {
                return {
                    success: false,
                    error: 'Audio recording already in progress'
                };
            }

            console.log('[Voice] Starting audio recording...');

            // Check for MediaRecorder support
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('MediaRecorder not supported in this browser');
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: options.echoCancellation !== false,
                    noiseSuppression: options.noiseSuppression !== false,
                    autoGainControl: options.autoGainControl !== false
                }
            });

            const MediaRecorder = (typeof window !== 'undefined') ? (window.MediaRecorder || window.webkitMediaRecorder) : null;
            if (!MediaRecorder) {
                throw new Error('MediaRecorder not available');
            }
            this.recordingStream = new MediaRecorder(stream, {
                mimeType: options.mimeType || 'audio/webm'
            });

            const chunks = [];
            this.recordingStream.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };

            this.recordingStream.onstop = async () => {
                const blob = new Blob(chunks, { type: this.recordingStream.mimeType });
                const recordingId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const fileName = `${recordingId}.webm`;
                const filePath = path.join(this.outputPath, fileName);

                // Save recording
                const buffer = Buffer.from(await blob.arrayBuffer());
                await fs.writeFile(filePath, buffer);

                const recording = {
                    id: recordingId,
                    name: options.name || `Recording ${new Date().toLocaleString()}`,
                    fileName: fileName,
                    filePath: filePath,
                    mimeType: this.recordingStream.mimeType,
                    size: buffer.length,
                    duration: options.duration || 0,
                    startTime: new Date().toISOString(),
                    endTime: null,
                    notes: options.notes || '',
                    tags: options.tags || []
                };

                this.recordings.set(recordingId, recording);
                await this.saveRecordings();

                this.emit('recording-complete', recording);

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            this.recordingStream.start();
            this.isRecording = true;

            this.emit('recording-started');

            return {
                success: true,
                mimeType: this.recordingStream.mimeType
            };
        } catch (error) {
            console.error('[Voice] Start recording error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Stop audio recording
     * @returns {Promise<Object>} Stop result
     */
    async stopRecording() {
        try {
            if (!this.isRecording || !this.recordingStream) {
                return {
                    success: false,
                    error: 'Audio recording not in progress'
                };
            }

            this.recordingStream.stop();
            this.recordingStream = null;
            this.isRecording = false;

            return {
                success: true
            };
        } catch (error) {
            console.error('[Voice] Stop recording error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Convert text to speech
     * @param {string} text - Text to speak
     * @param {Object} options - TTS options
     * @returns {Promise<Object>} TTS result
     */
    async textToSpeech(text, options = {}) {
        try {
            if (!this.synthesis) {
                throw new Error('Speech synthesis not supported in this browser');
            }

            console.log('[Voice] Converting text to speech...');

            // Cancel any ongoing speech
            this.synthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);

            utterance.lang = options.language || this.language;
            utterance.rate = options.rate || 1;
            utterance.pitch = options.pitch || 1;
            utterance.volume = options.volume || 1;

            if (options.voice) {
                utterance.voice = options.voice;
            }

            utterance.onstart = () => {
                this.emit('tts-started', { text });
            };

            utterance.onend = () => {
                this.emit('tts-ended', { text });
            };

            utterance.onerror = (event) => {
                console.error('[Voice] TTS error:', event.error);
                this.emit('tts-error', { error: event.error, text });
            };

            this.synthesis.speak(utterance);

            return {
                success: true,
                text: text,
                language: utterance.lang
            };
        } catch (error) {
            console.error('[Voice] TTS error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Stop text-to-speech
     * @returns {Promise<Object>} Stop result
     */
    async stopSpeech() {
        try {
            if (!this.synthesis) {
                return {
                    success: false,
                    error: 'Speech synthesis not supported'
                };
            }

            this.synthesis.cancel();

            return {
                success: true
            };
        } catch (error) {
            console.error('[Voice] Stop speech error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get available voices
     * @returns {Array} Available voices
     */
    getAvailableVoices() {
        if (!this.synthesis) {
            return [];
        }

        return this.synthesis.getVoices().map(voice => ({
            name: voice.name,
            lang: voice.lang,
            default: voice.default,
            localService: voice.localService
        }));
    }

    /**
     * Add voice command
     * @param {string} phrase - Command phrase
     * @param {Function} callback - Command callback
     * @param {Object} options - Command options
     * @returns {Object} Command info
     */
    addCommand(phrase, callback, options = {}) {
        const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const command = {
            id: commandId,
            phrase: phrase.toLowerCase(),
            callback: callback,
            description: options.description || '',
            enabled: options.enabled !== false,
            priority: options.priority || 0
        };

        this.commands.set(commandId, command);

        console.log(`[Voice] Command added: ${phrase}`);
        return command;
    }

    /**
     * Remove voice command
     * @param {string} commandId - Command ID
     * @returns {boolean} Success
     */
    removeCommand(commandId) {
        const removed = this.commands.delete(commandId);
        if (removed) {
            console.log(`[Voice] Command removed: ${commandId}`);
        }
        return removed;
    }

    /**
     * Check for voice commands in transcript
     * @param {string} transcript - Speech transcript
     */
    checkCommands(transcript) {
        const lowerTranscript = transcript.toLowerCase();

        // Sort commands by priority (higher priority first)
        const sortedCommands = Array.from(this.commands.values())
            .filter(cmd => cmd.enabled)
            .sort((a, b) => b.priority - a.priority);

        for (const command of sortedCommands) {
            if (lowerTranscript.includes(command.phrase)) {
                console.log(`[Voice] Command matched: ${command.phrase}`);
                this.emit('command-triggered', {
                    phrase: command.phrase,
                    transcript: transcript,
                    commandId: command.id
                });

                try {
                    command.callback(transcript);
                } catch (error) {
                    console.error('[Voice] Command callback error:', error);
                }

                return;
            }
        }
    }

    /**
     * Load default voice commands
     */
    loadDefaultCommands() {
        // Stop command
        this.addCommand('stop', () => {
            this.stopRecognition();
            this.stopRecording();
            this.stopSpeech();
        }, { description: 'Stop all voice operations', priority: 10 });

        // Listen command
        this.addCommand('listen', () => {
            this.startRecognition();
        }, { description: 'Start voice recognition', priority: 5 });

        // Record command
        this.addCommand('record', () => {
            this.startRecording();
        }, { description: 'Start audio recording', priority: 5 });

        // Help command
        this.addCommand('help', () => {
            const commands = Array.from(this.commands.values())
                .map(cmd => `- ${cmd.phrase}: ${cmd.description}`)
                .join('\n');
            this.textToSpeech(`Available commands: ${commands}`);
        }, { description: 'List available commands', priority: 3 });
    }

    /**
     * Get recording
     * @param {string} recordingId - Recording ID
     * @returns {Object} Recording
     */
    getRecording(recordingId) {
        return this.recordings.get(recordingId);
    }

    /**
     * Get all recordings
     * @param {Object} filters - Filters
     * @returns {Array} Recordings
     */
    getRecordings(filters = {}) {
        let recordings = Array.from(this.recordings.values());

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

        return recordings;
    }

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

            // Delete file
            await fs.unlink(recording.filePath);

            // Remove from map
            this.recordings.delete(recordingId);
            await this.saveRecordings();

            console.log(`[Voice] Recording deleted: ${recordingId}`);
            return {
                success: true
            };
        } catch (error) {
            console.error('[Voice] Delete recording error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Load recordings from file
     * @returns {Promise<void>}
     */
    async loadRecordings() {
        try {
            const filePath = path.join(this.outputPath, 'recordings.json');
            const data = await fs.readFile(filePath, 'utf8');
            const recordingsData = JSON.parse(data);
            for (const [id, recording] of Object.entries(recordingsData)) {
                this.recordings.set(id, recording);
            }
            console.log('[Voice] Recordings loaded');
        } catch (error) {
            console.log('[Voice] No recordings file found, starting fresh');
        }
    }

    /**
     * Save recordings to file
     * @returns {Promise<void>}
     */
    async saveRecordings() {
        try {
            const filePath = path.join(this.outputPath, 'recordings.json');
            const recordingsData = Object.fromEntries(this.recordings);
            await fs.writeFile(filePath, JSON.stringify(recordingsData, null, 2));
        } catch (error) {
            console.error('[Voice] Save recordings error:', error);
        }
    }

    /**
     * Get all commands
     * @returns {Array} Commands
     */
    getCommands() {
        return Array.from(this.commands.values());
    }

    /**
     * Set language
     * @param {string} language - Language code
     * @returns {Object} Result
     */
    setLanguage(language) {
        this.language = language;
        console.log(`[Voice] Language set to: ${language}`);
        return { success: true, language: language };
    }

    /**
     * Get language
     * @returns {string} Current language
     */
    getLanguage() {
        return this.language;
    }
}

module.exports = new VoiceService();
