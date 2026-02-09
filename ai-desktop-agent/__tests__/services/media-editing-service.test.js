/**
 * Media Editing Service Tests
 */

const mediaEditingService = require('../../src/services/media-editing-service');
const fs = require('fs');
const path = require('path');

describe('Media Editing Service', () => {
    beforeEach(async () => {
        await mediaEditingService.initialize();
    });

    afterEach(async () => {
        await mediaEditingService.shutdown();
    });

    describe('Initialization', () => {
        it('should initialize successfully', async () => {
            const status = mediaEditingService.getStatus();
            expect(status.initialized).toBe(true);
        });

        it('should have FFmpeg path', () => {
            const status = mediaEditingService.getStatus();
            expect(status.ffmpegPath).toBeDefined();
        });

        it('should have FFprobe path', () => {
            const status = mediaEditingService.getStatus();
            expect(status.ffprobePath).toBeDefined();
        });
    });

    describe('Video Information', () => {
        it('should get video info', async () => {
            const testVideoPath = path.join(__dirname, '../fixtures/test-video.mp4');

            if (fs.existsSync(testVideoPath)) {
                const result = await mediaEditingService.getVideoInfo(testVideoPath);

                expect(result.success).toBe(true);
                expect(result.info).toBeDefined();
                expect(result.info.duration).toBeGreaterThan(0);
                expect(result.info.width).toBeGreaterThan(0);
                expect(result.info.height).toBeGreaterThan(0);
            } else {
                console.log('Test video not found, skipping test');
            }
        });

        it('should return error for non-existent video', async () => {
            const result = await mediaEditingService.getVideoInfo('/nonexistent/video.mp4');

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('should extract video metadata', async () => {
            const testVideoPath = path.join(__dirname, '../fixtures/test-video.mp4');

            if (fs.existsSync(testVideoPath)) {
                const result = await mediaEditingService.getVideoInfo(testVideoPath);

                expect(result.info.codec).toBeDefined();
                expect(result.info.fps).toBeDefined();
                expect(result.info.bitrate).toBeDefined();
                expect(result.info.format).toBeDefined();
            }
        });
    });

    describe('Video Editing', () => {
        it('should trim video', async () => {
            const testVideoPath = path.join(__dirname, '../fixtures/test-video.mp4');
            const outputPath = path.join(__dirname, '../temp/trimmed-video.mp4');

            if (fs.existsSync(testVideoPath)) {
                const result = await mediaEditingService.trimVideo(
                    testVideoPath,
                    outputPath,
                    0,  // Start time
                    5   // End time
                );

                expect(result.success).toBe(true);
                expect(result.outputPath).toBe(outputPath);

                // Clean up
                if (fs.existsSync(outputPath)) {
                    fs.unlinkSync(outputPath);
                }
            }
        });

        it('should merge videos', async () => {
            const testVideoPath1 = path.join(__dirname, '../fixtures/test-video.mp4');
            const testVideoPath2 = path.join(__dirname, '../fixtures/test-video.mp4');
            const outputPath = path.join(__dirname, '../temp/merged-video.mp4');

            if (fs.existsSync(testVideoPath1)) {
                const result = await mediaEditingService.mergeVideos(
                    [testVideoPath1, testVideoPath2],
                    outputPath
                );

                expect(result.success).toBe(true);
                expect(result.outputPath).toBe(outputPath);

                // Clean up
                if (fs.existsSync(outputPath)) {
                    fs.unlinkSync(outputPath);
                }
            }
        });

        it('should add watermark', async () => {
            const testVideoPath = path.join(__dirname, '../fixtures/test-video.mp4');
            const watermarkPath = path.join(__dirname, '../fixtures/watermark.png');
            const outputPath = path.join(__dirname, '../temp/watermarked-video.mp4');

            if (fs.existsSync(testVideoPath) && fs.existsSync(watermarkPath)) {
                const result = await mediaEditingService.addWatermark(
                    testVideoPath,
                    watermarkPath,
                    outputPath,
                    {
                        position: 'bottom-right',
                        opacity: 0.7
                    }
                );

                expect(result.success).toBe(true);
                expect(result.outputPath).toBe(outputPath);

                // Clean up
                if (fs.existsSync(outputPath)) {
                    fs.unlinkSync(outputPath);
                }
            }
        });

        it('should resize video', async () => {
            const testVideoPath = path.join(__dirname, '../fixtures/test-video.mp4');
            const outputPath = path.join(__dirname, '../temp/resized-video.mp4');

            if (fs.existsSync(testVideoPath)) {
                const result = await mediaEditingService.resizeVideo(
                    testVideoPath,
                    outputPath,
                    640,  // Width
                    480   // Height
                );

                expect(result.success).toBe(true);
                expect(result.outputPath).toBe(outputPath);

                // Clean up
                if (fs.existsSync(outputPath)) {
                    fs.unlinkSync(outputPath);
                }
            }
        });

        it('should change video speed', async () => {
            const testVideoPath = path.join(__dirname, '../fixtures/test-video.mp4');
            const outputPath = path.join(__dirname, '../temp/speed-changed-video.mp4');

            if (fs.existsSync(testVideoPath)) {
                const result = await mediaEditingService.changeVideoSpeed(
                    testVideoPath,
                    outputPath,
                    2.0  // 2x speed
                );

                expect(result.success).toBe(true);
                expect(result.outputPath).toBe(outputPath);

                // Clean up
                if (fs.existsSync(outputPath)) {
                    fs.unlinkSync(outputPath);
                }
            }
        });

        it('should rotate video', async () => {
            const testVideoPath = path.join(__dirname, '../fixtures/test-video.mp4');
            const outputPath = path.join(__dirname, '../temp/rotated-video.mp4');

            if (fs.existsSync(testVideoPath)) {
                const result = await mediaEditingService.rotateVideo(
                    testVideoPath,
                    outputPath,
                    90  // Rotate 90 degrees
                );

                expect(result.success).toBe(true);
                expect(result.outputPath).toBe(outputPath);

                // Clean up
                if (fs.existsSync(outputPath)) {
                    fs.unlinkSync(outputPath);
                }
            }
        });
    });

    describe('Audio Editing', () => {
        it('should extract audio from video', async () => {
            const testVideoPath = path.join(__dirname, '../fixtures/test-video.mp4');
            const outputPath = path.join(__dirname, '../temp/extracted-audio.mp3');

            if (fs.existsSync(testVideoPath)) {
                const result = await mediaEditingService.extractAudio(
                    testVideoPath,
                    outputPath
                );

                expect(result.success).toBe(true);
                expect(result.outputPath).toBe(outputPath);

                // Clean up
                if (fs.existsSync(outputPath)) {
                    fs.unlinkSync(outputPath);
                }
            }
        });

        it('should trim audio', async () => {
            const testAudioPath = path.join(__dirname, '../fixtures/test-audio.mp3');
            const outputPath = path.join(__dirname, '../temp/trimmed-audio.mp3');

            if (fs.existsSync(testAudioPath)) {
                const result = await mediaEditingService.trimAudio(
                    testAudioPath,
                    outputPath,
                    0,  // Start time
                    5   // End time
                );

                expect(result.success).toBe(true);
                expect(result.outputPath).toBe(outputPath);

                // Clean up
                if (fs.existsSync(outputPath)) {
                    fs.unlinkSync(outputPath);
                }
            }
        });

        it('should merge audio files', async () => {
            const testAudioPath1 = path.join(__dirname, '../fixtures/test-audio.mp3');
            const testAudioPath2 = path.join(__dirname, '../fixtures/test-audio.mp3');
            const outputPath = path.join(__dirname, '../temp/merged-audio.mp3');

            if (fs.existsSync(testAudioPath1)) {
                const result = await mediaEditingService.mergeAudio(
                    [testAudioPath1, testAudioPath2],
                    outputPath
                );

                expect(result.success).toBe(true);
                expect(result.outputPath).toBe(outputPath);

                // Clean up
                if (fs.existsSync(outputPath)) {
                    fs.unlinkSync(outputPath);
                }
            }
        });

        it('should add audio effects', async () => {
            const testAudioPath = path.join(__dirname, '../fixtures/test-audio.mp3');
            const outputPath = path.join(__dirname, '../temp/effects-audio.mp3');

            if (fs.existsSync(testAudioPath)) {
                const result = await mediaEditingService.addAudioEffects(
                    testAudioPath,
                    outputPath,
                    {
                        volume: 1.5,
                        fadeIn: 2,
                        fadeOut: 2,
                        fadeOutStart: 8
                    }
                );

                expect(result.success).toBe(true);
                expect(result.outputPath).toBe(outputPath);

                // Clean up
                if (fs.existsSync(outputPath)) {
                    fs.unlinkSync(outputPath);
                }
            }
        });
    });

    describe('Format Conversion', () => {
        it('should convert video format', async () => {
            const testVideoPath = path.join(__dirname, '../fixtures/test-video.mp4');
            const outputPath = path.join(__dirname, '../temp/converted-video.avi');

            if (fs.existsSync(testVideoPath)) {
                const result = await mediaEditingService.convertVideo(
                    testVideoPath,
                    outputPath
                );

                expect(result.success).toBe(true);
                expect(result.outputPath).toBe(outputPath);

                // Clean up
                if (fs.existsSync(outputPath)) {
                    fs.unlinkSync(outputPath);
                }
            }
        });

        it('should convert audio format', async () => {
            const testAudioPath = path.join(__dirname, '../fixtures/test-audio.mp3');
            const outputPath = path.join(__dirname, '../temp/converted-audio.wav');

            if (fs.existsSync(testAudioPath)) {
                const result = await mediaEditingService.convertAudio(
                    testAudioPath,
                    outputPath
                );

                expect(result.success).toBe(true);
                expect(result.outputPath).toBe(outputPath);

                // Clean up
                if (fs.existsSync(outputPath)) {
                    fs.unlinkSync(outputPath);
                }
            }
        });
    });

    describe('Thumbnails and GIFs', () => {
        it('should generate thumbnail', async () => {
            const testVideoPath = path.join(__dirname, '../fixtures/test-video.mp4');
            const outputPath = path.join(__dirname, '../temp/thumbnail.jpg');

            if (fs.existsSync(testVideoPath)) {
                const result = await mediaEditingService.generateThumbnail(
                    testVideoPath,
                    outputPath,
                    {
                        timestamp: '00:00:01',
                        width: 320,
                        height: 240
                    }
                );

                expect(result.success).toBe(true);
                expect(result.outputPath).toBe(outputPath);

                // Clean up
                if (fs.existsSync(outputPath)) {
                    fs.unlinkSync(outputPath);
                }
            }
        });

        it('should create GIF', async () => {
            const testVideoPath = path.join(__dirname, '../fixtures/test-video.mp4');
            const outputPath = path.join(__dirname, '../temp/output.gif');

            if (fs.existsSync(testVideoPath)) {
                const result = await mediaEditingService.createGIF(
                    testVideoPath,
                    outputPath,
                    {
                        startTime: '00:00:00',
                        duration: 3,
                        fps: 10,
                        width: 480
                    }
                );

                expect(result.success).toBe(true);
                expect(result.outputPath).toBe(outputPath);

                // Clean up
                if (fs.existsSync(outputPath)) {
                    fs.unlinkSync(outputPath);
                }
            }
        });
    });

    describe('Process Management', () => {
        it('should get active processes', () => {
            const processes = mediaEditingService.getActiveProcesses();
            expect(Array.isArray(processes)).toBe(true);
        });

        it('should cancel process', async () => {
            const testVideoPath = path.join(__dirname, '../fixtures/test-video.mp4');
            const outputPath = path.join(__dirname, '../temp/test-output.mp4');

            if (fs.existsSync(testVideoPath)) {
                // Start a long-running operation
                const operation = mediaEditingService.trimVideo(
                    testVideoPath,
                    outputPath,
                    0,
                    1000  // Long duration
                );

                // Get active processes
                const processes = mediaEditingService.getActiveProcesses();

                if (processes.length > 0) {
                    const result = mediaEditingService.cancelProcess(processes[0]);
                    expect(result.success).toBe(true);
                }
            }
        });

        it('should return error for invalid process ID', () => {
            const result = mediaEditingService.cancelProcess('invalid-id');
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('Event Emitter', () => {
        it('should emit initialized event', (done) => {
            mediaEditingService.once('initialized', () => {
                done();
            });
        });

        it('should emit progress event', (done) => {
            mediaEditingService.once('progress', (data) => {
                expect(data.processId).toBeDefined();
                expect(data.data).toBeDefined();
                done();
            });

            // Trigger a progress event
            const testVideoPath = path.join(__dirname, '../fixtures/test-video.mp4');
            if (fs.existsSync(testVideoPath)) {
                mediaEditingService.trimVideo(
                    testVideoPath,
                    path.join(__dirname, '../temp/test-output.mp4'),
                    0,
                    5
                );
            } else {
                done();
            }
        });

        it('should emit video-trimmed event', (done) => {
            mediaEditingService.once('video-trimmed', (data) => {
                expect(data.inputPath).toBeDefined();
                expect(data.outputPath).toBeDefined();
                done();
            });

            const testVideoPath = path.join(__dirname, '../fixtures/test-video.mp4');
            if (fs.existsSync(testVideoPath)) {
                mediaEditingService.trimVideo(
                    testVideoPath,
                    path.join(__dirname, '../temp/test-output.mp4'),
                    0,
                    5
                );
            } else {
                done();
            }
        });
    });

    describe('Error Handling', () => {
        it('should handle non-existent input file', async () => {
            const result = await mediaEditingService.trimVideo(
                '/nonexistent/video.mp4',
                '/tmp/output.mp4',
                0,
                5
            );

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('should handle invalid parameters', async () => {
            const result = await mediaEditingService.trimVideo(
                '/tmp/input.mp4',
                '/tmp/output.mp4',
                -1,  // Invalid start time
                5
            );

            expect(result).toBeDefined();
        });

        it('should handle FFmpeg errors gracefully', async () => {
            const result = await mediaEditingService.trimVideo(
                '/tmp/invalid.mp4',
                '/tmp/output.mp4',
                0,
                5
            );

            expect(result).toBeDefined();
        });
    });

    describe('Performance', () => {
        it('should complete operations within reasonable time', async () => {
            const testVideoPath = path.join(__dirname, '../fixtures/test-video.mp4');
            const outputPath = path.join(__dirname, '../temp/perf-test.mp4');

            if (fs.existsSync(testVideoPath)) {
                const startTime = Date.now();

                const result = await mediaEditingService.trimVideo(
                    testVideoPath,
                    outputPath,
                    0,
                    5
                );

                const endTime = Date.now();
                const duration = endTime - startTime;

                expect(result.success).toBe(true);
                expect(duration).toBeLessThan(30000); // 30 seconds max

                // Clean up
                if (fs.existsSync(outputPath)) {
                    fs.unlinkSync(outputPath);
                }
            }
        });
    });
});
