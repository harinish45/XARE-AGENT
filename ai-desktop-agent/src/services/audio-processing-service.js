const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

/**
 * Audio Processing Service - Text-to-speech and speech-to-text
 * Features: TTS, STT, audio editing, voice cloning, audio effects
 */
class AudioProcessingService {
    constructor() {
        this.openaiApiKey = null;
        this.elevenLabsApiKey = null;
        this.googleCloudApiKey = null;
        this.awsCredentials = null;
        this.voiceCache = new Map(); // Voice cache
        this.transcriptionHistory = []; // Transcription history
        this.synthesisHistory = []; // Synthesis history
    }

    /**
     * Initialize audio processing service
     * @param {Object} config - Configuration with API keys
     */
    async initialize(config) {
        try {
            this.openaiApiKey = config.openaiApiKey || null;
            this.elevenLabsApiKey = config.elevenLabsApiKey || null;
            this.googleCloudApiKey = config.googleCloudApiKey || null;
            this.awsCredentials = config.awsCredentials || null;

            console.log('[Audio] Audio Processing Service initialized');
            return { success: true };
        } catch (error) {
            console.error('[Audio] Initialization error:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== TEXT-TO-SPEECH ====================

    /**
     * Convert text to speech using OpenAI
     * @param {Object} options - TTS options
     * @returns {Promise<Object>} TTS result
     */
    async textToSpeechOpenAI(options) {
        try {
            if (!this.openaiApiKey) {
                throw new Error('OpenAI API key not configured');
            }

            console.log(`[Audio] Converting text to speech with OpenAI: ${options.text.substring(0, 50)}...`);

            const response = await axios.post(
                'https://api.openai.com/v1/audio/speech',
                {
                    model: options.model || 'tts-1',
                    input: options.text,
                    voice: options.voice || 'alloy',
                    response_format: options.format || 'mp3',
                    speed: options.speed || 1.0
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.openaiApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    responseType: 'arraybuffer'
                }
            );

            const audioBuffer = Buffer.from(response.data);
            const base64 = audioBuffer.toString('base64');

            // Add to history
            this.synthesisHistory.push({
                provider: 'openai',
                text: options.text,
                voice: options.voice,
                model: options.model,
                timestamp: new Date().toISOString()
            });

            return {
                success: true,
                audio: {
                    base64,
                    format: options.format || 'mp3',
                    duration: this.estimateDuration(options.text, options.speed || 1.0)
                }
            };
        } catch (error) {
            console.error('[Audio] OpenAI TTS error:', error);
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message
            };
        }
    }

    /**
     * Convert text to speech using ElevenLabs
     * @param {Object} options - TTS options
     * @returns {Promise<Object>} TTS result
     */
    async textToSpeechElevenLabs(options) {
        try {
            if (!this.elevenLabsApiKey) {
                throw new Error('ElevenLabs API key not configured');
            }

            console.log(`[Audio] Converting text to speech with ElevenLabs: ${options.text.substring(0, 50)}...`);

            const response = await axios.post(
                `https://api.elevenlabs.io/v1/text-to-speech/${options.voiceId || '21m00Tcm4TlvDq8ikWAM'}`,
                {
                    text: options.text,
                    model_id: options.model || 'eleven_monolingual_v1',
                    voice_settings: {
                        stability: options.stability || 0.5,
                        similarity_boost: options.similarityBoost || 0.75
                    }
                },
                {
                    headers: {
                        'xi-api-key': this.elevenLabsApiKey,
                        'Content-Type': 'application/json'
                    },
                    responseType: 'arraybuffer'
                }
            );

            const audioBuffer = Buffer.from(response.data);
            const base64 = audioBuffer.toString('base64');

            // Add to history
            this.synthesisHistory.push({
                provider: 'elevenlabs',
                text: options.text,
                voiceId: options.voiceId,
                model: options.model,
                timestamp: new Date().toISOString()
            });

            return {
                success: true,
                audio: {
                    base64,
                    format: 'mp3',
                    duration: this.estimateDuration(options.text, 1.0)
                }
            };
        } catch (error) {
            console.error('[Audio] ElevenLabs TTS error:', error);
            return {
                success: false,
                error: error.response?.data?.detail?.message || error.message
            };
        }
    }

    /**
     * Convert text to speech using Google Cloud TTS
     * @param {Object} options - TTS options
     * @returns {Promise<Object>} TTS result
     */
    async textToSpeechGoogle(options) {
        try {
            if (!this.googleCloudApiKey) {
                throw new Error('Google Cloud API key not configured');
            }

            console.log(`[Audio] Converting text to speech with Google Cloud: ${options.text.substring(0, 50)}...`);

            const response = await axios.post(
                `https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.googleCloudApiKey}`,
                {
                    input: { text: options.text },
                    voice: {
                        languageCode: options.language || 'en-US',
                        name: options.voice || 'en-US-Neural2-A'
                    },
                    audioConfig: {
                        audioEncoding: options.encoding || 'MP3',
                        speakingRate: options.speed || 1.0,
                        pitch: options.pitch || 0.0
                    }
                }
            );

            const audioContent = response.data.audioContent;

            // Add to history
            this.synthesisHistory.push({
                provider: 'google',
                text: options.text,
                voice: options.voice,
                language: options.language,
                timestamp: new Date().toISOString()
            });

            return {
                success: true,
                audio: {
                    base64: audioContent,
                    format: options.encoding || 'mp3',
                    duration: this.estimateDuration(options.text, options.speed || 1.0)
                }
            };
        } catch (error) {
            console.error('[Audio] Google TTS error:', error);
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message
            };
        }
    }

    /**
     * Convert text to speech using Amazon Polly
     * @param {Object} options - TTS options
     * @returns {Promise<Object>} TTS result
     */
    async textToSpeechPolly(options) {
        try {
            if (!this.awsCredentials) {
                throw new Error('AWS credentials not configured');
            }

            console.log(`[Audio] Converting text to speech with Amazon Polly: ${options.text.substring(0, 50)}...`);

            // Note: This would require the AWS SDK
            // Placeholder for actual implementation
            return {
                success: false,
                error: 'Amazon Polly integration requires AWS SDK setup'
            };
        } catch (error) {
            console.error('[Audio] Polly TTS error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Estimate audio duration from text
     * @private
     */
    estimateDuration(text, speed = 1.0) {
        // Average reading speed: ~150 words per minute
        const words = text.split(/\s+/).length;
        const baseDuration = (words / 150) * 60; // seconds
        return Math.round(baseDuration / speed);
    }

    /**
     * Get available voices
     * @param {string} provider - TTS provider
     * @returns {Promise<Object>} Voices result
     */
    async getVoices(provider = 'openai') {
        try {
            let voices = [];

            switch (provider) {
                case 'openai':
                    voices = [
                        { id: 'alloy', name: 'Alloy', gender: 'neutral', language: 'en' },
                        { id: 'echo', name: 'Echo', gender: 'male', language: 'en' },
                        { id: 'fable', name: 'Fable', gender: 'male', language: 'en' },
                        { id: 'onyx', name: 'Onyx', gender: 'male', language: 'en' },
                        { id: 'nova', name: 'Nova', gender: 'female', language: 'en' },
                        { id: 'shimmer', name: 'Shimmer', gender: 'female', language: 'en' }
                    ];
                    break;

                case 'elevenlabs':
                    if (!this.elevenLabsApiKey) {
                        throw new Error('ElevenLabs API key not configured');
                    }
                    const response = await axios.get(
                        'https://api.elevenlabs.io/v1/voices',
                        {
                            headers: {
                                'xi-api-key': this.elevenLabsApiKey
                            }
                        }
                    );
                    voices = response.data.voices.map(v => ({
                        id: v.voice_id,
                        name: v.name,
                        gender: v.labels?.gender || 'unknown',
                        language: v.labels?.language || 'en'
                    }));
                    break;

                case 'google':
                    voices = [
                        { id: 'en-US-Neural2-A', name: 'US Neural A', gender: 'female', language: 'en-US' },
                        { id: 'en-US-Neural2-B', name: 'US Neural B', gender: 'male', language: 'en-US' },
                        { id: 'en-US-Neural2-C', name: 'US Neural C', gender: 'female', language: 'en-US' },
                        { id: 'en-US-Neural2-D', name: 'US Neural D', gender: 'male', language: 'en-US' },
                        { id: 'en-GB-Neural2-A', name: 'UK Neural A', gender: 'female', language: 'en-GB' },
                        { id: 'en-GB-Neural2-B', name: 'UK Neural B', gender: 'male', language: 'en-GB' }
                    ];
                    break;

                default:
                    throw new Error(`Unknown provider: ${provider}`);
            }

            return {
                success: true,
                provider,
                voices
            };
        } catch (error) {
            console.error('[Audio] Get voices error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ==================== SPEECH-TO-TEXT ====================

    /**
     * Transcribe audio using OpenAI Whisper
     * @param {Object} options - Transcription options
     * @returns {Promise<Object>} Transcription result
     */
    async transcribeOpenAI(options) {
        try {
            if (!this.openaiApiKey) {
                throw new Error('OpenAI API key not configured');
            }

            console.log('[Audio] Transcribing audio with OpenAI Whisper');

            const formData = new FormData();
            formData.append('file', options.audio);
            formData.append('model', options.model || 'whisper-1');
            formData.append('language', options.language || 'en');
            formData.append('response_format', options.format || 'json');

            if (options.prompt) {
                formData.append('prompt', options.prompt);
            }

            if (options.temperature !== undefined) {
                formData.append('temperature', options.temperature);
            }

            const response = await axios.post(
                'https://api.openai.com/v1/audio/transcriptions',
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${this.openaiApiKey}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            const transcription = response.data;

            // Add to history
            this.transcriptionHistory.push({
                provider: 'openai',
                model: options.model,
                language: options.language,
                text: transcription.text,
                duration: transcription.duration,
                timestamp: new Date().toISOString()
            });

            return {
                success: true,
                transcription: {
                    text: transcription.text,
                    language: transcription.language,
                    duration: transcription.duration,
                    segments: transcription.segments || []
                }
            };
        } catch (error) {
            console.error('[Audio] OpenAI transcription error:', error);
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message
            };
        }
    }

    /**
     * Transcribe audio using Google Cloud Speech-to-Text
     * @param {Object} options - Transcription options
     * @returns {Promise<Object>} Transcription result
     */
    async transcribeGoogle(options) {
        try {
            if (!this.googleCloudApiKey) {
                throw new Error('Google Cloud API key not configured');
            }

            console.log('[Audio] Transcribing audio with Google Cloud');

            const response = await axios.post(
                `https://speech.googleapis.com/v1/speech:recognize?key=${this.googleCloudApiKey}`,
                {
                    config: {
                        encoding: options.encoding || 'MP3',
                        sampleRateHertz: options.sampleRate || 16000,
                        languageCode: options.language || 'en-US',
                        enableAutomaticPunctuation: options.enablePunctuation !== false,
                        enableWordTimeOffsets: options.enableWordTimeOffsets || false
                    },
                    audio: {
                        content: options.audioBase64 || options.uri
                    }
                }
            );

            const results = response.data.results || [];
            const transcript = results.map(r => r.alternatives[0].transcript).join(' ');

            // Add to history
            this.transcriptionHistory.push({
                provider: 'google',
                language: options.language,
                text: transcript,
                timestamp: new Date().toISOString()
            });

            return {
                success: true,
                transcription: {
                    text: transcript,
                    language: options.language,
                    results: results
                }
            };
        } catch (error) {
            console.error('[Audio] Google transcription error:', error);
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message
            };
        }
    }

    /**
     * Transcribe audio using AWS Transcribe
     * @param {Object} options - Transcription options
     * @returns {Promise<Object>} Transcription result
     */
    async transcribeAWS(options) {
        try {
            if (!this.awsCredentials) {
                throw new Error('AWS credentials not configured');
            }

            console.log('[Audio] Transcribing audio with AWS Transcribe');

            // Note: This would require the AWS SDK
            // Placeholder for actual implementation
            return {
                success: false,
                error: 'AWS Transcribe integration requires AWS SDK setup'
            };
        } catch (error) {
            console.error('[Audio] AWS transcription error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Translate audio to English
     * @param {Object} options - Translation options
     * @returns {Promise<Object>} Translation result
     */
    async translateAudio(options) {
        try {
            if (!this.openaiApiKey) {
                throw new Error('OpenAI API key not configured');
            }

            console.log('[Audio] Translating audio to English');

            const formData = new FormData();
            formData.append('file', options.audio);
            formData.append('model', 'whisper-1');
            formData.append('response_format', 'json');

            const response = await axios.post(
                'https://api.openai.com/v1/audio/translations',
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${this.openaiApiKey}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            const translation = response.data;

            // Add to history
            this.transcriptionHistory.push({
                provider: 'openai',
                type: 'translation',
                text: translation.text,
                timestamp: new Date().toISOString()
            });

            return {
                success: true,
                translation: {
                    text: translation.text,
                    duration: translation.duration
                }
            };
        } catch (error) {
            console.error('[Audio] Audio translation error:', error);
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message
            };
        }
    }

    // ==================== AUDIO EDITING ====================

    /**
     * Trim audio
     * @param {Object} options - Trim options
     * @returns {Promise<Object>} Trim result
     */
    async trimAudio(options) {
        try {
            console.log(`[Audio] Trimming audio: ${options.startTime}s to ${options.endTime}s`);

            // Note: This would require an audio processing library like ffmpeg
            // Placeholder for actual implementation
            return {
                success: false,
                error: 'Audio trimming requires FFmpeg integration'
            };
        } catch (error) {
            console.error('[Audio] Trim audio error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Merge audio files
     * @param {Object} options - Merge options
     * @returns {Promise<Object>} Merge result
     */
    async mergeAudio(options) {
        try {
            console.log(`[Audio] Merging ${options.audioFiles.length} audio files`);

            // Note: This would require an audio processing library like ffmpeg
            // Placeholder for actual implementation
            return {
                success: false,
                error: 'Audio merging requires FFmpeg integration'
            };
        } catch (error) {
            console.error('[Audio] Merge audio error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Add background music
     * @param {Object} options - Background music options
     * @returns {Promise<Object>} Result
     */
    async addBackgroundMusic(options) {
        try {
            console.log('[Audio] Adding background music');

            // Note: This would require an audio processing library like ffmpeg
            // Placeholder for actual implementation
            return {
                success: false,
                error: 'Background music addition requires FFmpeg integration'
            };
        } catch (error) {
            console.error('[Audio] Add background music error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Apply audio effects
     * @param {Object} options - Effects options
     * @returns {Promise<Object>} Result
     */
    async applyAudioEffects(options) {
        try {
            console.log(`[Audio] Applying audio effects: ${options.effects.join(', ')}`);

            // Note: This would require an audio processing library like ffmpeg
            // Placeholder for actual implementation
            return {
                success: false,
                error: 'Audio effects require FFmpeg integration'
            };
        } catch (error) {
            console.error('[Audio] Apply audio effects error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Convert audio format
     * @param {Object} options - Conversion options
     * @returns {Promise<Object>} Conversion result
     */
    async convertAudioFormat(options) {
        try {
            console.log(`[Audio] Converting audio from ${options.fromFormat} to ${options.toFormat}`);

            // Note: This would require an audio processing library like ffmpeg
            // Placeholder for actual implementation
            return {
                success: false,
                error: 'Audio format conversion requires FFmpeg integration'
            };
        } catch (error) {
            console.error('[Audio] Convert audio format error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ==================== VOICE CLONING ====================

    /**
     * Clone voice using ElevenLabs
     * @param {Object} options - Voice cloning options
     * @returns {Promise<Object>} Cloning result
     */
    async cloneVoice(options) {
        try {
            if (!this.elevenLabsApiKey) {
                throw new Error('ElevenLabs API key not configured');
            }

            console.log(`[Audio] Cloning voice: ${options.name}`);

            const formData = new FormData();
            formData.append('name', options.name);
            formData.append('description', options.description || '');
            formData.append('files', options.audioSample);

            const response = await axios.post(
                'https://api.elevenlabs.io/v1/voices/add',
                formData,
                {
                    headers: {
                        'xi-api-key': this.elevenLabsApiKey,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            const voice = response.data;

            return {
                success: true,
                voice: {
                    id: voice.voice_id,
                    name: voice.name,
                    description: voice.description
                }
            };
        } catch (error) {
            console.error('[Audio] Voice cloning error:', error);
            return {
                success: false,
                error: error.response?.data?.detail?.message || error.message
            };
        }
    }

    /**
     * Get cloned voices
     * @returns {Promise<Object>} Voices result
     */
    async getClonedVoices() {
        try {
            if (!this.elevenLabsApiKey) {
                throw new Error('ElevenLabs API key not configured');
            }

            const response = await axios.get(
                'https://api.elevenlabs.io/v1/voices',
                {
                    headers: {
                        'xi-api-key': this.elevenLabsApiKey
                    }
                }
            );

            const voices = response.data.voices;

            return {
                success: true,
                voices: voices.map(v => ({
                    id: v.voice_id,
                    name: v.name,
                    description: v.description,
                    labels: v.labels
                }))
            };
        } catch (error) {
            console.error('[Audio] Get cloned voices error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ==================== FILE OPERATIONS ====================

    /**
     * Save audio to file
     * @param {string} base64 - Base64 audio data
     * @param {string} filepath - File path
     * @returns {Promise<Object>} Save result
     */
    async saveAudioToFile(base64, filepath) {
        try {
            const dir = path.dirname(filepath);
            await fs.mkdir(dir, { recursive: true });

            const buffer = Buffer.from(base64, 'base64');
            await fs.writeFile(filepath, buffer);

            console.log(`[Audio] Audio saved to: ${filepath}`);

            return {
                success: true,
                filepath
            };
        } catch (error) {
            console.error('[Audio] Save audio error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Load audio from file
     * @param {string} filepath - File path
     * @returns {Promise<Object>} Load result
     */
    async loadAudioFromFile(filepath) {
        try {
            const buffer = await fs.readFile(filepath);
            const base64 = buffer.toString('base64');

            console.log(`[Audio] Audio loaded from: ${filepath}`);

            return {
                success: true,
                audio: {
                    base64,
                    format: path.extname(filepath).substring(1)
                }
            };
        } catch (error) {
            console.error('[Audio] Load audio error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ==================== HISTORY & CACHE ====================

    /**
     * Get transcription history
     * @param {number} limit - Limit number of results
     * @returns {Array} History array
     */
    getTranscriptionHistory(limit = 50) {
        return this.transcriptionHistory.slice(-limit);
    }

    /**
     * Get synthesis history
     * @param {number} limit - Limit number of results
     * @returns {Array} History array
     */
    getSynthesisHistory(limit = 50) {
        return this.synthesisHistory.slice(-limit);
    }

    /**
     * Clear transcription history
     */
    clearTranscriptionHistory() {
        this.transcriptionHistory = [];
        console.log('[Audio] Transcription history cleared');
    }

    /**
     * Clear synthesis history
     */
    clearSynthesisHistory() {
        this.synthesisHistory = [];
        console.log('[Audio] Synthesis history cleared');
    }

    /**
     * Clear all history
     */
    clearAllHistory() {
        this.clearTranscriptionHistory();
        this.clearSynthesisHistory();
    }

    /**
     * Get cached voices
     * @returns {Array} Cached voices
     */
    getCachedVoices() {
        return Array.from(this.voiceCache.values());
    }

    /**
     * Clear voice cache
     */
    clearVoiceCache() {
        this.voiceCache.clear();
        console.log('[Audio] Voice cache cleared');
    }

    /**
     * Cleanup
     */
    async cleanup() {
        console.log('[Audio] Cleaning up');

        // Clear caches
        this.voiceCache.clear();
        this.transcriptionHistory = [];
        this.synthesisHistory = [];
    }
}

// Export singleton instance
const audioProcessingService = new AudioProcessingService();
module.exports = audioProcessingService;
