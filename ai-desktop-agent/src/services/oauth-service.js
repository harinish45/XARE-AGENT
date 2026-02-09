/**
 * OAuth Service
 * Full OAuth 2.0 implementation for external service authentication
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const { v4: uuidv4 } = require('crypto');

class OAuthService extends EventEmitter {
    constructor() {
        super();
        this.providers = new Map();
        this.tokens = new Map();
        this.authorizationCodes = new Map();
        this.stateStore = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize OAuth service
     */
    async initialize() {
        console.log('[OAuth Service] Initializing...');

        // Register default providers
        this.registerDefaultProviders();

        // Load stored tokens
        await this.loadTokens();

        this.isInitialized = true;
        this.emit('initialized');
        console.log('[OAuth Service] Initialized successfully');

        return { success: true };
    }

    /**
     * Register default OAuth providers
     */
    registerDefaultProviders() {
        // Google OAuth
        this.registerProvider({
            id: 'google',
            name: 'Google',
            authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
            tokenEndpoint: 'https://oauth2.googleapis.com/token',
            revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
            userInfoEndpoint: 'https://www.googleapis.com/oauth2/v3/userinfo',
            scopes: [
                'https://www.googleapis.com/auth/drive',
                'https://www.googleapis.com/auth/gmail.readonly',
                'https://www.googleapis.com/auth/gmail.send',
                'https://www.googleapis.com/auth/calendar'
            ],
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
            redirectUri: 'http://localhost:3000/oauth/callback',
            pkce: true
        });

        // GitHub OAuth
        this.registerProvider({
            id: 'github',
            name: 'GitHub',
            authorizationEndpoint: 'https://github.com/login/oauth/authorize',
            tokenEndpoint: 'https://github.com/login/oauth/access_token',
            revocationEndpoint: 'https://github.com/settings/connections/applications/{client_id}/tokens',
            userInfoEndpoint: 'https://api.github.com/user',
            scopes: ['repo', 'user', 'read:org'],
            clientId: process.env.GITHUB_CLIENT_ID || '',
            clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
            redirectUri: 'http://localhost:3000/oauth/callback',
            pkce: false
        });

        // Notion OAuth
        this.registerProvider({
            id: 'notion',
            name: 'Notion',
            authorizationEndpoint: 'https://api.notion.com/v1/oauth/authorize',
            tokenEndpoint: 'https://api.notion.com/v1/oauth/token',
            userInfoEndpoint: 'https://api.notion.com/v1/users/me',
            scopes: [],
            clientId: process.env.NOTION_CLIENT_ID || '',
            clientSecret: process.env.NOTION_CLIENT_SECRET || '',
            redirectUri: 'http://localhost:3000/oauth/callback',
            pkce: true
        });

        // Dropbox OAuth
        this.registerProvider({
            id: 'dropbox',
            name: 'Dropbox',
            authorizationEndpoint: 'https://www.dropbox.com/oauth2/authorize',
            tokenEndpoint: 'https://api.dropboxapi.com/oauth2/token',
            revocationEndpoint: 'https://api.dropboxapi.com/2/auth/token/revoke',
            userInfoEndpoint: 'https://api.dropboxapi.com/2/users/get_current_account',
            scopes: ['files.content.read', 'files.content.write'],
            clientId: process.env.DROPBOX_CLIENT_ID || '',
            clientSecret: process.env.DROPBOX_CLIENT_SECRET || '',
            redirectUri: 'http://localhost:3000/oauth/callback',
            pkce: true
        });

        // Slack OAuth
        this.registerProvider({
            id: 'slack',
            name: 'Slack',
            authorizationEndpoint: 'https://slack.com/oauth/v2/authorize',
            tokenEndpoint: 'https://slack.com/api/oauth.v2.access',
            revocationEndpoint: 'https://slack.com/api/auth.revoke',
            userInfoEndpoint: 'https://slack.com/api/users.info',
            scopes: ['chat:write', 'channels:read', 'files:read'],
            clientId: process.env.SLACK_CLIENT_ID || '',
            clientSecret: process.env.SLACK_CLIENT_SECRET || '',
            redirectUri: 'http://localhost:3000/oauth/callback',
            pkce: false
        });
    }

    /**
     * Register OAuth provider
     */
    registerProvider(provider) {
        if (!provider.id) {
            throw new Error('Provider must have an ID');
        }

        this.providers.set(provider.id, provider);
        this.emit('provider-registered', provider);
        console.log(`[OAuth Service] Provider registered: ${provider.name} (${provider.id})`);
    }

    /**
     * Get provider
     */
    getProvider(providerId) {
        return this.providers.get(providerId) || null;
    }

    /**
     * Get all providers
     */
    getProviders() {
        return Array.from(this.providers.values());
    }

    /**
     * Generate authorization URL
     */
    generateAuthorizationUrl(providerId, options = {}) {
        const provider = this.providers.get(providerId);
        if (!provider) {
            throw new Error(`Provider not found: ${providerId}`);
        }

        // Generate state parameter
        const state = uuidv4();
        this.stateStore.set(state, {
            providerId,
            timestamp: Date.now(),
            ...options
        });

        // Build authorization URL
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: provider.clientId,
            redirect_uri: provider.redirectUri,
            state: state,
            ...(provider.scopes && provider.scopes.length > 0 && { scope: provider.scopes.join(' ') }),
            ...(options.accessType && { access_type: options.accessType }),
            ...(options.prompt && { prompt: options.prompt })
        });

        // Add PKCE if enabled
        if (provider.pkce) {
            const codeVerifier = this.generateCodeVerifier();
            const codeChallenge = this.generateCodeChallenge(codeVerifier);

            params.append('code_challenge', codeChallenge);
            params.append('code_challenge_method', 'S256');

            // Store code verifier for later
            this.stateStore.set(state, {
                ...this.stateStore.get(state),
                codeVerifier
            });
        }

        const authorizationUrl = `${provider.authorizationEndpoint}?${params.toString()}`;

        this.emit('authorization-url-generated', { providerId, authorizationUrl, state });

        return {
            success: true,
            authorizationUrl,
            state
        };
    }

    /**
     * Exchange authorization code for tokens
     */
    async exchangeCodeForTokens(providerId, code, state) {
        try {
            const provider = this.providers.get(providerId);
            if (!provider) {
                return { success: false, error: 'Provider not found' };
            }

            // Verify state
            const storedState = this.stateStore.get(state);
            if (!storedState) {
                return { success: false, error: 'Invalid state' };
            }

            if (storedState.providerId !== providerId) {
                return { success: false, error: 'State mismatch' };
            }

            // Build token request
            const params = new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                client_id: provider.clientId,
                client_secret: provider.clientSecret,
                redirect_uri: provider.redirectUri
            });

            // Add PKCE code verifier if enabled
            if (provider.pkce && storedState.codeVerifier) {
                params.append('code_verifier', storedState.codeVerifier);
            }

            // Exchange code for tokens
            const response = await fetch(provider.tokenEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                body: params.toString()
            });

            const tokenData = await response.json();

            if (!response.ok) {
                return { success: false, error: tokenData.error_description || tokenData.error };
            }

            // Store tokens
            const tokenInfo = {
                providerId,
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token,
                tokenType: tokenData.token_type || 'Bearer',
                expiresIn: tokenData.expires_in,
                scope: tokenData.scope,
                obtainedAt: Date.now(),
                ...(tokenData.expires_in && {
                    expiresAt: Date.now() + (tokenData.expires_in * 1000)
                })
            };

            await this.storeToken(providerId, tokenInfo);

            // Clean up state
            this.stateStore.delete(state);

            this.emit('tokens-obtained', tokenInfo);

            return { success: true, tokens: tokenInfo };
        } catch (error) {
            console.error('[OAuth Service] Token exchange error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Refresh access token
     */
    async refreshToken(providerId) {
        try {
            const tokenInfo = this.tokens.get(providerId);
            if (!tokenInfo || !tokenInfo.refreshToken) {
                return { success: false, error: 'No refresh token available' };
            }

            const provider = this.providers.get(providerId);
            if (!provider) {
                return { success: false, error: 'Provider not found' };
            }

            // Build refresh request
            const params = new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: tokenInfo.refreshToken,
                client_id: provider.clientId,
                client_secret: provider.clientSecret
            });

            // Refresh token
            const response = await fetch(provider.tokenEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                body: params.toString()
            });

            const tokenData = await response.json();

            if (!response.ok) {
                return { success: false, error: tokenData.error_description || tokenData.error };
            }

            // Update stored tokens
            const updatedTokenInfo = {
                ...tokenInfo,
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token || tokenInfo.refreshToken,
                tokenType: tokenData.token_type || 'Bearer',
                expiresIn: tokenData.expires_in,
                obtainedAt: Date.now(),
                ...(tokenData.expires_in && {
                    expiresAt: Date.now() + (tokenData.expires_in * 1000)
                })
            };

            await this.storeToken(providerId, updatedTokenInfo);

            this.emit('token-refreshed', updatedTokenInfo);

            return { success: true, tokens: updatedTokenInfo };
        } catch (error) {
            console.error('[OAuth Service] Token refresh error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get access token
     */
    async getAccessToken(providerId) {
        const tokenInfo = this.tokens.get(providerId);

        if (!tokenInfo) {
            return { success: false, error: 'No token found' };
        }

        // Check if token is expired
        if (tokenInfo.expiresAt && Date.now() >= tokenInfo.expiresAt) {
            // Refresh token
            const refreshResult = await this.refreshToken(providerId);
            if (refreshResult.success) {
                return { success: true, accessToken: refreshResult.tokens.accessToken };
            }
            return { success: false, error: 'Token expired and refresh failed' };
        }

        return { success: true, accessToken: tokenInfo.accessToken };
    }

    /**
     * Revoke token
     */
    async revokeToken(providerId) {
        try {
            const tokenInfo = this.tokens.get(providerId);
            if (!tokenInfo) {
                return { success: false, error: 'No token found' };
            }

            const provider = this.providers.get(providerId);
            if (!provider) {
                return { success: false, error: 'Provider not found' };
            }

            // Revoke token if provider supports it
            if (provider.revocationEndpoint) {
                const params = new URLSearchParams({
                    token: tokenInfo.accessToken,
                    client_id: provider.clientId,
                    client_secret: provider.clientSecret
                });

                await fetch(provider.revocationEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: params.toString()
                });
            }

            // Remove stored token
            this.tokens.delete(providerId);
            await this.saveTokens();

            this.emit('token-revoked', { providerId });
            console.log(`[OAuth Service] Token revoked for: ${providerId}`);

            return { success: true };
        } catch (error) {
            console.error('[OAuth Service] Token revocation error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Store token
     */
    async storeToken(providerId, tokenInfo) {
        this.tokens.set(providerId, tokenInfo);
        await this.saveTokens();
    }

    /**
     * Save tokens to storage
     */
    async saveTokens() {
        try {
            const fs = require('fs');
            const path = require('path');
            const dataPath = path.join(__dirname, '../../data/oauth');

            // Ensure data directory exists
            await fs.promises.mkdir(dataPath, { recursive: true });

            const tokensFile = path.join(dataPath, 'tokens.json');
            const tokensData = Object.fromEntries(this.tokens);

            await fs.promises.writeFile(tokensFile, JSON.stringify(tokensData, null, 2));

            console.log('[OAuth Service] Tokens saved');
        } catch (error) {
            console.error('[OAuth Service] Save tokens error:', error);
        }
    }

    /**
     * Load tokens from storage
     */
    async loadTokens() {
        try {
            const fs = require('fs');
            const path = require('path');
            const tokensFile = path.join(__dirname, '../../data/oauth/tokens.json');

            const data = await fs.promises.readFile(tokensFile, 'utf8');
            const tokensData = JSON.parse(data);

            for (const [providerId, tokenInfo] of Object.entries(tokensData)) {
                this.tokens.set(providerId, tokenInfo);
            }

            console.log('[OAuth Service] Tokens loaded');
        } catch (error) {
            console.log('[OAuth Service] No tokens file found, starting fresh');
        }
    }

    /**
     * Get user info
     */
    async getUserInfo(providerId) {
        try {
            const tokenResult = await this.getAccessToken(providerId);
            if (!tokenResult.success) {
                return { success: false, error: tokenResult.error };
            }

            const provider = this.providers.get(providerId);
            if (!provider || !provider.userInfoEndpoint) {
                return { success: false, error: 'User info not supported' };
            }

            const response = await fetch(provider.userInfoEndpoint, {
                headers: {
                    'Authorization': `Bearer ${tokenResult.accessToken}`,
                    'Accept': 'application/json'
                }
            });

            const userInfo = await response.json();

            return { success: true, userInfo };
        } catch (error) {
            console.error('[OAuth Service] Get user info error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Generate code verifier for PKCE
     */
    generateCodeVerifier() {
        const array = new Uint8Array(32);
        crypto.randomFillSync(array);
        return Buffer.from(array)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }

    /**
     * Generate code challenge for PKCE
     */
    generateCodeChallenge(codeVerifier) {
        const hash = crypto.createHash('sha256')
            .update(codeVerifier)
            .digest('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
        return hash;
    }

    /**
     * Get all tokens
     */
    getAllTokens() {
        return Array.from(this.tokens.entries()).map(([providerId, tokenInfo]) => ({
            providerId,
            ...tokenInfo,
            // Don't expose sensitive data
            accessToken: '***REDACTED***',
            refreshToken: '***REDACTED***'
        }));
    }

    /**
     * Get token info
     */
    getTokenInfo(providerId) {
        const tokenInfo = this.tokens.get(providerId);
        if (!tokenInfo) {
            return { success: false, error: 'Token not found' };
        }

        return {
            success: true,
            providerId,
            tokenType: tokenInfo.tokenType,
            scope: tokenInfo.scope,
            obtainedAt: tokenInfo.obtainedAt,
            expiresAt: tokenInfo.expiresAt,
            isExpired: tokenInfo.expiresAt ? Date.now() >= tokenInfo.expiresAt : false
        };
    }

    /**
     * Clear all tokens
     */
    async clearAllTokens() {
        this.tokens.clear();
        await this.saveTokens();

        this.emit('tokens-cleared');
        console.log('[OAuth Service] All tokens cleared');

        return { success: true };
    }

    /**
     * Get status
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            providers: this.providers.size,
            tokens: this.tokens.size,
            pendingStates: this.stateStore.size
        };
    }
}

module.exports = new OAuthService();
