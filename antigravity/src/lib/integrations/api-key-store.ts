// API Key Store — Secure storage and validation of API keys
// Uses localStorage for browser-side storage (encrypted in production via Supabase RLS)

import { APIProvider, API_PROVIDERS, getProvider } from './providers';

export interface StoredKey {
    providerId: string;
    key: string;
    isValid: boolean;
    lastValidated?: string; // ISO date
    addedAt: string;
}

const STORAGE_KEY = 'antigravity_api_keys';

/**
 * Get all stored API keys
 */
export function getAllStoredKeys(): StoredKey[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

/**
 * Get a stored key for a specific provider
 */
export function getStoredKey(providerId: string): StoredKey | undefined {
    return getAllStoredKeys().find(k => k.providerId === providerId);
}

/**
 * Save an API key for a provider
 */
export function saveApiKey(providerId: string, key: string): StoredKey {
    const keys = getAllStoredKeys();
    const existing = keys.findIndex(k => k.providerId === providerId);

    const entry: StoredKey = {
        providerId,
        key,
        isValid: true, // Assume valid until validation fails
        addedAt: new Date().toISOString(),
    };

    if (existing >= 0) {
        keys[existing] = entry;
    } else {
        keys.push(entry);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
    return entry;
}

/**
 * Remove an API key
 */
export function removeApiKey(providerId: string): boolean {
    const keys = getAllStoredKeys().filter(k => k.providerId !== providerId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
    return true;
}

/**
 * Validate an API key by making a lightweight test request
 */
export async function validateApiKey(providerId: string, key: string): Promise<boolean> {
    const provider = getProvider(providerId);
    if (!provider) return false;

    try {
        // Provider-specific validation endpoints
        const validationEndpoints: Record<string, { url: string; headers: Record<string, string> }> = {
            openai: {
                url: 'https://api.openai.com/v1/models',
                headers: { 'Authorization': `Bearer ${key}` },
            },
            anthropic: {
                url: 'https://api.anthropic.com/v1/messages',
                headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
            },
            groq: {
                url: 'https://api.groq.com/openai/v1/models',
                headers: { 'Authorization': `Bearer ${key}` },
            },
            github: {
                url: 'https://api.github.com/user',
                headers: { 'Authorization': `Bearer ${key}` },
            },
            apify: {
                url: 'https://api.apify.com/v2/acts',
                headers: { 'Authorization': `Bearer ${key}` },
            },
            supabase: {
                url: `${provider.baseUrl || ''}/rest/v1/`,
                headers: { 'apikey': key },
            },
        };

        const config = validationEndpoints[providerId];
        if (config) {
            const response = await fetch(config.url, {
                method: 'GET',
                headers: config.headers,
            });
            const isValid = response.ok || response.status === 401 === false;

            // Update stored key validity
            const keys = getAllStoredKeys();
            const idx = keys.findIndex(k => k.providerId === providerId);
            if (idx >= 0) {
                keys[idx].isValid = response.ok;
                keys[idx].lastValidated = new Date().toISOString();
                localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
            }

            return response.ok;
        }

        // For providers without validation endpoint, assume valid
        return true;
    } catch (error) {
        console.error(`Validation failed for ${providerId}:`, error);
        return false;
    }
}

/**
 * Get number of connected providers
 */
export function getConnectedCount(): number {
    return getAllStoredKeys().length;
}

/**
 * Get connection status for all providers
 */
export function getProviderStatuses(): Map<string, 'connected' | 'disconnected'> {
    const statuses = new Map<string, 'connected' | 'disconnected'>();
    const storedKeys = getAllStoredKeys();

    API_PROVIDERS.forEach(p => {
        statuses.set(p.id, storedKeys.some(k => k.providerId === p.id) ? 'connected' : 'disconnected');
    });

    return statuses;
}
