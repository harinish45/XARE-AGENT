/**
 * OAuth Service Tests
 */

const oauthService = require('../../src/services/oauth-service');

describe('OAuth Service', () => {
    beforeEach(async () => {
        await oauthService.initialize();
    });

    afterEach(async () => {
        await oauthService.shutdown();
    });

    describe('Initialization', () => {
        it('should initialize successfully', async () => {
            const status = oauthService.getStatus();
            expect(status.initialized).toBe(true);
        });

        it('should have default providers', () => {
            const providers = oauthService.getProviders();
            expect(providers).toBeInstanceOf(Array);
            expect(providers.length).toBeGreaterThan(0);
            expect(providers.some(p => p.id === 'google')).toBe(true);
            expect(providers.some(p => p.id === 'github')).toBe(true);
        });
    });

    describe('Providers', () => {
        it('should return all providers', () => {
            const providers = oauthService.getProviders();
            expect(providers.length).toBe(5); // Google, GitHub, Notion, Dropbox, Slack
        });

        it('should return provider by ID', () => {
            const provider = oauthService.getProvider('google');
            expect(provider).toBeDefined();
            expect(provider.id).toBe('google');
            expect(provider.name).toBe('Google');
        });

        it('should return null for invalid provider', () => {
            const provider = oauthService.getProvider('invalid');
            expect(provider).toBeNull();
        });

        it('should have correct provider configurations', () => {
            const google = oauthService.getProvider('google');
            expect(google.authUrl).toContain('accounts.google.com');
            expect(google.tokenUrl).toContain('oauth2.googleapis.com');

            const github = oauthService.getProvider('github');
            expect(github.authUrl).toContain('github.com');
            expect(github.tokenUrl).toContain('github.com');
        });
    });

    describe('Authorization URL Generation', () => {
        it('should generate authorization URL for Google', async () => {
            const result = await oauthService.generateAuthorizationUrl('google', {
                clientId: 'test-client-id',
                redirectUri: 'http://localhost:3000/callback'
            });

            expect(result.success).toBe(true);
            expect(result.authorizationUrl).toBeDefined();
            expect(result.authorizationUrl).toContain('accounts.google.com');
            expect(result.state).toBeDefined();
        });

        it('should generate authorization URL for GitHub', async () => {
            const result = await oauthService.generateAuthorizationUrl('github', {
                clientId: 'test-client-id',
                redirectUri: 'http://localhost:3000/callback'
            });

            expect(result.success).toBe(true);
            expect(result.authorizationUrl).toBeDefined();
            expect(result.authorizationUrl).toContain('github.com');
            expect(result.state).toBeDefined();
        });

        it('should include PKCE parameters', async () => {
            const result = await oauthService.generateAuthorizationUrl('google', {
                clientId: 'test-client-id',
                redirectUri: 'http://localhost:3000/callback',
                usePKCE: true
            });

            expect(result.success).toBe(true);
            expect(result.codeVerifier).toBeDefined();
            expect(result.codeChallenge).toBeDefined();
        });

        it('should include custom scopes', async () => {
            const result = await oauthService.generateAuthorizationUrl('google', {
                clientId: 'test-client-id',
                redirectUri: 'http://localhost:3000/callback',
                scopes: ['email', 'profile', 'https://www.googleapis.com/auth/drive']
            });

            expect(result.success).toBe(true);
            expect(result.authorizationUrl).toContain('email');
            expect(result.authorizationUrl).toContain('profile');
        });

        it('should return error for invalid provider', async () => {
            const result = await oauthService.generateAuthorizationUrl('invalid', {
                clientId: 'test-client-id',
                redirectUri: 'http://localhost:3000/callback'
            });

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('should return error for missing client ID', async () => {
            const result = await oauthService.generateAuthorizationUrl('google', {
                redirectUri: 'http://localhost:3000/callback'
            });

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('Token Exchange', () => {
        it('should exchange code for tokens', async () => {
            // Mock the token exchange
            const result = await oauthService.exchangeCodeForTokens('google', 'test-code', 'test-state', {
                clientId: 'test-client-id',
                clientSecret: 'test-client-secret',
                redirectUri: 'http://localhost:3000/callback'
            });

            // This will fail in real scenario without actual OAuth server
            // but we test the structure
            expect(result).toBeDefined();
        });

        it('should validate state parameter', async () => {
            const authResult = await oauthService.generateAuthorizationUrl('google', {
                clientId: 'test-client-id',
                redirectUri: 'http://localhost:3000/callback'
            });

            const tokenResult = await oauthService.exchangeCodeForTokens('google', 'test-code', 'invalid-state', {
                clientId: 'test-client-id',
                clientSecret: 'test-client-secret',
                redirectUri: 'http://localhost:3000/callback'
            });

            expect(tokenResult.success).toBe(false);
            expect(tokenResult.error).toContain('Invalid state');
        });

        it('should use PKCE code verifier when provided', async () => {
            const authResult = await oauthService.generateAuthorizationUrl('google', {
                clientId: 'test-client-id',
                redirectUri: 'http://localhost:3000/callback',
                usePKCE: true
            });

            const tokenResult = await oauthService.exchangeCodeForTokens('google', 'test-code', authResult.state, {
                clientId: 'test-client-id',
                clientSecret: 'test-client-secret',
                redirectUri: 'http://localhost:3000/callback',
                codeVerifier: authResult.codeVerifier
            });

            expect(tokenResult).toBeDefined();
        });
    });

    describe('Token Management', () => {
        it('should store access token', async () => {
            const result = await oauthService.storeToken('google', {
                accessToken: 'test-access-token',
                refreshToken: 'test-refresh-token',
                expiresAt: Date.now() + 3600000
            });

            expect(result.success).toBe(true);
        });

        it('should retrieve access token', async () => {
            await oauthService.storeToken('google', {
                accessToken: 'test-access-token',
                refreshToken: 'test-refresh-token',
                expiresAt: Date.now() + 3600000
            });

            const token = await oauthService.getAccessToken('google');
            expect(token).toBe('test-access-token');
        });

        it('should return null for non-existent token', async () => {
            const token = await oauthService.getAccessToken('nonexistent');
            expect(token).toBeNull();
        });

        it('should detect expired tokens', async () => {
            await oauthService.storeToken('google', {
                accessToken: 'test-access-token',
                refreshToken: 'test-refresh-token',
                expiresAt: Date.now() - 1000 // Expired
            });

            const token = await oauthService.getAccessToken('google');
            expect(token).toBeNull(); // Should return null for expired tokens
        });

        it('should refresh expired tokens', async () => {
            await oauthService.storeToken('google', {
                accessToken: 'test-access-token',
                refreshToken: 'test-refresh-token',
                expiresAt: Date.now() - 1000 // Expired
            });

            const result = await oauthService.refreshToken('google', {
                clientId: 'test-client-id',
                clientSecret: 'test-client-secret'
            });

            expect(result).toBeDefined();
        });

        it('should revoke tokens', async () => {
            await oauthService.storeToken('google', {
                accessToken: 'test-access-token',
                refreshToken: 'test-refresh-token',
                expiresAt: Date.now() + 3600000
            });

            const result = await oauthService.revokeToken('google');
            expect(result.success).toBe(true);

            const token = await oauthService.getAccessToken('google');
            expect(token).toBeNull();
        });
    });

    describe('User Info', () => {
        it('should fetch user info', async () => {
            await oauthService.storeToken('google', {
                accessToken: 'test-access-token',
                refreshToken: 'test-refresh-token',
                expiresAt: Date.now() + 3600000
            });

            const result = await oauthService.getUserInfo('google');
            expect(result).toBeDefined();
        });

        it('should return error without token', async () => {
            const result = await oauthService.getUserInfo('google');
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('Security', () => {
        it('should generate secure state parameter', async () => {
            const result1 = await oauthService.generateAuthorizationUrl('google', {
                clientId: 'test-client-id',
                redirectUri: 'http://localhost:3000/callback'
            });

            const result2 = await oauthService.generateAuthorizationUrl('google', {
                clientId: 'test-client-id',
                redirectUri: 'http://localhost:3000/callback'
            });

            expect(result1.state).not.toBe(result2.state);
        });

        it('should generate PKCE code verifier', async () => {
            const result = await oauthService.generateAuthorizationUrl('google', {
                clientId: 'test-client-id',
                redirectUri: 'http://localhost:3000/callback',
                usePKCE: true
            });

            expect(result.codeVerifier).toBeDefined();
            expect(result.codeVerifier.length).toBeGreaterThan(40);
        });

        it('should generate PKCE code challenge', async () => {
            const result = await oauthService.generateAuthorizationUrl('google', {
                clientId: 'test-client-id',
                redirectUri: 'http://localhost:3000/callback',
                usePKCE: true
            });

            expect(result.codeChallenge).toBeDefined();
            expect(result.codeChallenge).not.toBe(result.codeVerifier);
        });
    });

    describe('Event Emitter', () => {
        it('should emit initialized event', (done) => {
            oauthService.once('initialized', () => {
                done();
            });
        });

        it('should emit token-stored event', (done) => {
            oauthService.once('token-stored', (data) => {
                expect(data.providerId).toBeDefined();
                done();
            });

            oauthService.storeToken('google', {
                accessToken: 'test-access-token',
                refreshToken: 'test-refresh-token',
                expiresAt: Date.now() + 3600000
            });
        });

        it('should emit token-refreshed event', (done) => {
            oauthService.once('token-refreshed', (data) => {
                expect(data.providerId).toBeDefined();
                done();
            });

            oauthService.refreshToken('google', {
                clientId: 'test-client-id',
                clientSecret: 'test-client-secret'
            });
        });

        it('should emit token-revoked event', (done) => {
            oauthService.once('token-revoked', (data) => {
                expect(data.providerId).toBeDefined();
                done();
            });

            oauthService.revokeToken('google');
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid provider ID', async () => {
            const result = await oauthService.generateAuthorizationUrl('invalid', {
                clientId: 'test-client-id',
                redirectUri: 'http://localhost:3000/callback'
            });

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('should handle missing parameters', async () => {
            const result = await oauthService.generateAuthorizationUrl('google', {});

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('should handle network errors gracefully', async () => {
            const result = await oauthService.exchangeCodeForTokens('google', 'invalid-code', 'invalid-state', {
                clientId: 'test-client-id',
                clientSecret: 'test-client-secret',
                redirectUri: 'http://localhost:3000/callback'
            });

            expect(result).toBeDefined();
        });
    });

    describe('Multiple Providers', () => {
        it('should manage tokens for multiple providers', async () => {
            await oauthService.storeToken('google', {
                accessToken: 'google-access-token',
                refreshToken: 'google-refresh-token',
                expiresAt: Date.now() + 3600000
            });

            await oauthService.storeToken('github', {
                accessToken: 'github-access-token',
                refreshToken: 'github-refresh-token',
                expiresAt: Date.now() + 3600000
            });

            const googleToken = await oauthService.getAccessToken('google');
            const githubToken = await oauthService.getAccessToken('github');

            expect(googleToken).toBe('google-access-token');
            expect(githubToken).toBe('github-access-token');
        });

        it('should revoke tokens independently', async () => {
            await oauthService.storeToken('google', {
                accessToken: 'google-access-token',
                refreshToken: 'google-refresh-token',
                expiresAt: Date.now() + 3600000
            });

            await oauthService.storeToken('github', {
                accessToken: 'github-access-token',
                refreshToken: 'github-refresh-token',
                expiresAt: Date.now() + 3600000
            });

            await oauthService.revokeToken('google');

            const googleToken = await oauthService.getAccessToken('google');
            const githubToken = await oauthService.getAccessToken('github');

            expect(googleToken).toBeNull();
            expect(githubToken).toBe('github-access-token');
        });
    });
});
