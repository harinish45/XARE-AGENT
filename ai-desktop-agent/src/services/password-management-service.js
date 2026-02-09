const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * Password Management Service - Integration with password managers
 * Features: Password manager integration, secure credential storage, auto-fill, password generation
 */
class PasswordManagementService extends EventEmitter {
    constructor() {
        super();
        this.passwordManagers = new Map(); // Password manager configurations
        this.credentials = new Map(); // Encrypted credentials
        this.vault = new Map(); // Encrypted vault
        this.masterPassword = null; // Master password for vault
        this.encryptionKey = null; // Encryption key
        this.passwordHistory = []; // Password change history
        this.isUnlocked = false;
    }

    /**
     * Initialize password management service
     * @param {Object} config - Configuration
     */
    async initialize(config = {}) {
        try {
            // Load default password managers
            await this.loadDefaultPasswordManagers();

            // Load vault
            await this.loadVault();

            console.log('[PasswordManager] Password Management Service initialized');
            return { success: true };
        } catch (error) {
            console.error('[PasswordManager] Initialization error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Unlock vault
     * @param {string} masterPassword - Master password
     * @returns {Promise<Object>} Unlock result
     */
    async unlockVault(masterPassword) {
        try {
            console.log('[PasswordManager] Unlocking vault...');

            // Verify master password
            const isValid = await this.verifyMasterPassword(masterPassword);

            if (!isValid) {
                return {
                    success: false,
                    error: 'Invalid master password'
                };
            }

            // Derive encryption key
            this.encryptionKey = this.deriveEncryptionKey(masterPassword);
            this.masterPassword = masterPassword;
            this.isUnlocked = true;

            // Load credentials
            await this.loadCredentials();

            console.log('[PasswordManager] Vault unlocked');

            // Emit event
            this.emit('vaultUnlocked');

            return { success: true };
        } catch (error) {
            console.error('[PasswordManager] Unlock vault error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Lock vault
     * @returns {Promise<Object>} Lock result
     */
    async lockVault() {
        try {
            console.log('[PasswordManager] Locking vault...');

            // Clear sensitive data
            this.credentials.clear();
            this.encryptionKey = null;
            this.masterPassword = null;
            this.isUnlocked = false;

            console.log('[PasswordManager] Vault locked');

            // Emit event
            this.emit('vaultLocked');

            return { success: true };
        } catch (error) {
            console.error('[PasswordManager] Lock vault error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Verify master password
     * @private
     */
    async verifyMasterPassword(masterPassword) {
        // Load stored hash
        const storedHash = await this.getStoredMasterHash();

        if (!storedHash) {
            // First time setup - store hash
            await this.storeMasterHash(masterPassword);
            return true;
        }

        // Verify hash
        const hash = crypto.createHash('sha256').update(masterPassword).digest('hex');
        return hash === storedHash;
    }

    /**
     * Derive encryption key from master password
     * @private
     */
    deriveEncryptionKey(masterPassword) {
        // Use PBKDF2 for key derivation
        const salt = 'ai-desktop-agent-salt';
        const iterations = 100000;
        const keyLength = 32; // 256 bits

        const derivedKey = crypto.pbkdf2Sync(
            masterPassword,
            salt,
            iterations,
            keyLength,
            'sha256'
        );

        return derivedKey;
    }

    /**
     * Encrypt data
     * @private
     */
    encrypt(data) {
        if (!this.encryptionKey) {
            throw new Error('Vault is locked');
        }

        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);

        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');

        return {
            iv: iv.toString('hex'),
            data: encrypted
        };
    }

    /**
     * Decrypt data
     * @private
     */
    decrypt(encryptedData) {
        if (!this.encryptionKey) {
            throw new Error('Vault is locked');
        }

        const iv = Buffer.from(encryptedData.iv, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);

        let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return JSON.parse(decrypted);
    }

    // ==================== PASSWORD MANAGER INTEGRATION ====================

    /**
     * Load default password managers
     * @private
     */
    async loadDefaultPasswordManagers() {
        const defaultManagers = [
            {
                id: '1password',
                name: '1Password',
                type: 'api',
                description: '1Password CLI integration',
                enabled: false,
                config: {
                    cliPath: '/usr/local/bin/op',
                    vaultPath: '~/.op'
                }
            },
            {
                id: 'bitwarden',
                name: 'Bitwarden',
                type: 'api',
                description: 'Bitwarden CLI integration',
                enabled: false,
                config: {
                    cliPath: '/usr/local/bin/bw',
                    apiUrl: 'https://api.bitwarden.com'
                }
            },
            {
                id: 'lastpass',
                name: 'LastPass',
                type: 'api',
                description: 'LastPass CLI integration',
                enabled: false,
                config: {
                    cliPath: '/usr/local/bin/lpass'
                }
            },
            {
                id: 'keepass',
                name: 'KeePass',
                type: 'file',
                description: 'KeePass database file',
                enabled: false,
                config: {
                    databasePath: '~/.keepass/database.kdbx'
                }
            }
        ];

        for (const manager of defaultManagers) {
            this.passwordManagers.set(manager.id, manager);
        }

        console.log(`[PasswordManager] Loaded ${defaultManagers.length} password managers`);
    }

    /**
     * Configure password manager
     * @param {string} managerId - Manager ID
     * @param {Object} config - Configuration
     * @returns {string} Manager ID
     */
    configurePasswordManager(managerId, config) {
        const manager = this.passwordManagers.get(managerId);
        if (!manager) {
            throw new Error(`Password manager not found: ${managerId}`);
        }

        manager.config = { ...manager.config, ...config };
        manager.enabled = config.enabled !== false;

        console.log(`[PasswordManager] Password manager configured: ${managerId}`);

        // Emit event
        this.emit('passwordManagerConfigured', manager);

        return managerId;
    }

    /**
     * Get password from manager
     * @param {string} managerId - Manager ID
     * @param {string} entryId - Entry ID
     * @returns {Promise<Object>} Password result
     */
    async getPasswordFromManager(managerId, entryId) {
        try {
            const manager = this.passwordManagers.get(managerId);
            if (!manager || !manager.enabled) {
                throw new Error(`Password manager not enabled: ${managerId}`);
            }

            console.log(`[PasswordManager] Getting password from ${managerId}`);

            switch (manager.id) {
                case '1password':
                    return await this.getPasswordFrom1Password(entryId, manager.config);
                case 'bitwarden':
                    return await this.getPasswordFromBitwarden(entryId, manager.config);
                case 'lastpass':
                    return await this.getPasswordFromLastPass(entryId, manager.config);
                case 'keepass':
                    return await this.getPasswordFromKeePass(entryId, manager.config);
                default:
                    throw new Error(`Unknown password manager: ${managerId}`);
            }
        } catch (error) {
            console.error('[PasswordManager] Get password error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get password from 1Password
     * @private
     */
    async getPasswordFrom1Password(entryId, config) {
        // Placeholder for 1Password CLI integration
        return {
            success: false,
            error: '1Password CLI integration requires setup'
        };
    }

    /**
     * Get password from Bitwarden
     * @private
     */
    async getPasswordFromBitwarden(entryId, config) {
        // Placeholder for Bitwarden CLI integration
        return {
            success: false,
            error: 'Bitwarden CLI integration requires setup'
        };
    }

    /**
     * Get password from LastPass
     * @private
     */
    async getPasswordFromLastPass(entryId, config) {
        // Placeholder for LastPass CLI integration
        return {
            success: false,
            error: 'LastPass CLI integration requires setup'
        };
    }

    /**
     * Get password from KeePass
     * @private
     */
    async getPasswordFromKeePass(entryId, config) {
        // Placeholder for KeePass file integration
        return {
            success: false,
            error: 'KeePass file integration requires setup'
        };
    }

    // ==================== CREDENTIAL MANAGEMENT ====================

    /**
     * Store credential
     * @param {Object} credential - Credential data
     * @returns {string} Credential ID
     */
    storeCredential(credential) {
        if (!this.isUnlocked) {
            throw new Error('Vault is locked');
        }

        const credentialId = `cred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const credentialData = {
            id: credentialId,
            service: credential.service || '',
            username: credential.username || '',
            password: credential.password || '',
            url: credential.url || '',
            notes: credential.notes || '',
            category: credential.category || 'general',
            tags: credential.tags || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastUsed: null
        };

        // Encrypt credential
        const encrypted = this.encrypt(credentialData);

        // Store in vault
        this.credentials.set(credentialId, encrypted);

        console.log(`[PasswordManager] Credential stored: ${credentialId}`);

        // Emit event
        this.emit('credentialStored', { id: credentialId, service: credential.service });

        // Save vault
        this.saveVault();

        return credentialId;
    }

    /**
     * Get credential
     * @param {string} credentialId - Credential ID
     * @returns {Object|null} Credential or null
     */
    getCredential(credentialId) {
        if (!this.isUnlocked) {
            throw new Error('Vault is locked');
        }

        const encrypted = this.credentials.get(credentialId);
        if (!encrypted) {
            return null;
        }

        // Decrypt credential
        const credential = this.decrypt(encrypted);

        // Update last used
        credential.lastUsed = new Date().toISOString();

        return credential;
    }

    /**
     * Get all credentials
     * @param {Object} filters - Optional filters
     * @returns {Array} Credentials array
     */
    getCredentials(filters = {}) {
        if (!this.isUnlocked) {
            throw new Error('Vault is locked');
        }

        let credentials = Array.from(this.credentials.entries()).map(([id, encrypted]) => {
            const credential = this.decrypt(encrypted);
            return { id, ...credential };
        });

        if (filters.service) {
            credentials = credentials.filter(c => c.service === filters.service);
        }

        if (filters.category) {
            credentials = credentials.filter(c => c.category === filters.category);
        }

        if (filters.tags && filters.tags.length > 0) {
            credentials = credentials.filter(c =>
                filters.tags.some(tag => c.tags.includes(tag))
            );
        }

        // Sort by last used (descending)
        credentials.sort((a, b) => {
            const aTime = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
            const bTime = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
            return bTime - aTime;
        });

        return credentials;
    }

    /**
     * Update credential
     * @param {string} credentialId - Credential ID
     * @param {Object} updates - Updates to apply
     */
    updateCredential(credentialId, updates) {
        if (!this.isUnlocked) {
            throw new Error('Vault is locked');
        }

        const encrypted = this.credentials.get(credentialId);
        if (!encrypted) {
            throw new Error(`Credential not found: ${credentialId}`);
        }

        // Decrypt, update, re-encrypt
        const credential = this.decrypt(encrypted);
        const updatedCredential = {
            ...credential,
            ...updates,
            updatedAt: new Date().toISOString()
        };

        const newEncrypted = this.encrypt(updatedCredential);
        this.credentials.set(credentialId, newEncrypted);

        console.log(`[PasswordManager] Credential updated: ${credentialId}`);

        // Emit event
        this.emit('credentialUpdated', { id: credentialId, ...updates });

        // Save vault
        this.saveVault();
    }

    /**
     * Delete credential
     * @param {string} credentialId - Credential ID
     */
    deleteCredential(credentialId) {
        if (!this.isUnlocked) {
            throw new Error('Vault is locked');
        }

        this.credentials.delete(credentialId);

        console.log(`[PasswordManager] Credential deleted: ${credentialId}`);

        // Emit event
        this.emit('credentialDeleted', credentialId);

        // Save vault
        this.saveVault();
    }

    // ==================== PASSWORD GENERATION ====================

    /**
     * Generate password
     * @param {Object} options - Generation options
     * @returns {string} Generated password
     */
    generatePassword(options = {}) {
        const length = options.length || 16;
        const includeUppercase = options.includeUppercase !== false;
        const includeLowercase = options.includeLowercase !== false;
        const includeNumbers = options.includeNumbers !== false;
        const includeSymbols = options.includeSymbols !== false;
        const excludeSimilar = options.excludeSimilar !== false;

        let charset = '';
        if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
        if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (includeNumbers) charset += '0123456789';
        if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

        if (excludeSimilar) {
            // Remove similar characters (0, O, l, 1, I)
            charset = charset.replace(/[0Oo1lIi]/g, '');
        }

        let password = '';
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }

        console.log('[PasswordManager] Password generated');

        return password;
    }

    /**
     * Generate passphrase
     * @param {Object} options - Generation options
     * @returns {string} Generated passphrase
     */
    generatePassphrase(options = {}) {
        const wordCount = options.wordCount || 4;
        const separator = options.separator || '-';
        const capitalize = options.capitalize !== false;

        const words = [
            'correct', 'horse', 'battery', 'staple', 'valid',
            'garage', 'laptop', 'monitor', 'mouse', 'keyboard',
            'screen', 'phone', 'tablet', 'camera', 'speaker',
            'network', 'server', 'cloud', 'data', 'code',
            'file', 'folder', 'document', 'image', 'video',
            'music', 'audio', 'game', 'app', 'system'
        ];

        let passphrase = '';
        for (let i = 0; i < wordCount; i++) {
            let word = words[Math.floor(Math.random() * words.length)];
            if (capitalize) {
                word = word.charAt(0).toUpperCase() + word.slice(1);
            }
            passphrase += word;
            if (i < wordCount - 1) {
                passphrase += separator;
            }
        }

        console.log('[PasswordManager] Passphrase generated');

        return passphrase;
    }

    /**
     * Check password strength
     * @param {string} password - Password to check
     * @returns {Object} Strength result
     */
    checkPasswordStrength(password) {
        let score = 0;
        const feedback = [];

        // Length check
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;
        if (password.length >= 16) score += 1;

        // Complexity checks
        if (/[a-z]/.test(password)) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^a-zA-Z0-9]/.test(password)) score += 1;

        // Variety checks
        if (password.length >= 8 && /[a-z].*?[A-Z].*?[0-9]/.test(password)) score += 1;
        if (password.length >= 12 && /[a-z].*?[A-Z].*?[0-9].*?[^a-zA-Z0-9]/.test(password)) score += 1;

        // Determine strength
        let strength = 'weak';
        if (score >= 3) strength = 'fair';
        if (score >= 5) strength = 'good';
        if (score >= 7) strength = 'strong';

        return {
            score,
            strength,
            feedback: this.getPasswordFeedback(score)
        };
    }

    /**
     * Get password feedback
     * @private
     */
    getPasswordFeedback(score) {
        const feedback = [];

        if (score < 3) {
            feedback.push('Password is too weak');
            feedback.push('Use at least 8 characters');
            feedback.push('Mix letters, numbers, and symbols');
        } else if (score < 5) {
            feedback.push('Password could be stronger');
            feedback.push('Consider adding more variety');
        } else if (score < 7) {
            feedback.push('Password is good');
            feedback.push('For better security, add more complexity');
        } else {
            feedback.push('Password is strong');
        }

        return feedback;
    }

    // ==================== VAULT MANAGEMENT ====================

    /**
     * Get vault status
     * @returns {Object} Vault status
     */
    getVaultStatus() {
        return {
            isUnlocked: this.isUnlocked,
            credentialCount: this.credentials.size,
            passwordManagersCount: this.passwordManagers.size,
            enabledPasswordManagers: Array.from(this.passwordManagers.values()).filter(m => m.enabled).length
        };
    }

    /**
     * Change master password
     * @param {string} oldPassword - Old master password
     * @param {string} newPassword - New master password
     * @returns {Promise<Object>} Change result
     */
    async changeMasterPassword(oldPassword, newPassword) {
        try {
            console.log('[PasswordManager] Changing master password...');

            // Verify old password
            const isValid = await this.verifyMasterPassword(oldPassword);
            if (!isValid) {
                return {
                    success: false,
                    error: 'Invalid old master password'
                };
            }

            // Store new hash
            await this.storeMasterHash(newPassword);

            // Re-encrypt all credentials with new key
            const oldKey = this.encryptionKey;
            this.encryptionKey = this.deriveEncryptionKey(newPassword);

            for (const [id, encrypted] of this.credentials) {
                const credential = this.decrypt(encrypted);
                const newEncrypted = this.encrypt(credential);
                this.credentials.set(id, newEncrypted);
            }

            // Add to history
            this.passwordHistory.push({
                timestamp: new Date().toISOString(),
                action: 'change_master_password'
            });

            console.log('[PasswordManager] Master password changed');

            // Emit event
            this.emit('masterPasswordChanged');

            // Save vault
            await this.saveVault();

            return { success: true };
        } catch (error) {
            console.error('[PasswordManager] Change master password error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ==================== PERSISTENCE ====================

    /**
     * Save vault to file
     * @private
     */
    async saveVault() {
        try {
            const data = JSON.stringify(Array.from(this.credentials.entries()), null, 2);
            await fs.writeFile(
                path.join(__dirname, '../../data/password-vault.json'),
                data,
                'utf-8'
            );

            console.log('[PasswordManager] Vault saved');
        } catch (error) {
            console.error('[PasswordManager] Save vault error:', error);
        }
    }

    /**
     * Load vault from file
     * @private
     */
    async loadVault() {
        try {
            const data = await fs.readFile(
                path.join(__dirname, '../../data/password-vault.json'),
                'utf-8'
            );
            const entries = JSON.parse(data);
            this.credentials = new Map(entries);

            console.log(`[PasswordManager] Loaded ${this.credentials.size} credentials`);
        } catch (error) {
            console.log('[PasswordManager] No saved vault found');
        }
    }

    /**
     * Store master hash
     * @private
     */
    async storeMasterHash(masterPassword) {
        try {
            const hash = crypto.createHash('sha256').update(masterPassword).digest('hex');
            await fs.writeFile(
                path.join(__dirname, '../../data/master-hash.txt'),
                hash,
                'utf-8'
            );
        } catch (error) {
            console.error('[PasswordManager] Store master hash error:', error);
        }
    }

    /**
     * Get stored master hash
     * @private
     */
    async getStoredMasterHash() {
        try {
            const hash = await fs.readFile(
                path.join(__dirname, '../../data/master-hash.txt'),
                'utf-8'
            );
            return hash.trim();
        } catch (error) {
            return null;
        }
    }

    /**
     * Export vault
     * @returns {Object} Exported data
     */
    exportVault() {
        if (!this.isUnlocked) {
            throw new Error('Vault is locked');
        }

        const credentials = Array.from(this.credentials.entries()).map(([id, encrypted]) => {
            const credential = this.decrypt(encrypted);
            return { id, ...credential };
        });

        return {
            credentials,
            passwordManagers: Array.from(this.passwordManagers.values()),
            exportedAt: new Date().toISOString()
        };
    }

    /**
     * Import vault
     * @param {Object} data - Data to import
     */
    importVault(data) {
        try {
            // Import credentials
            for (const credential of data.credentials) {
                const encrypted = this.encrypt(credential);
                this.credentials.set(credential.id, encrypted);
            }

            // Import password managers
            for (const manager of data.passwordManagers) {
                this.passwordManagers.set(manager.id, manager);
            }

            console.log('[PasswordManager] Vault imported successfully');

            // Emit event
            this.emit('vaultImported', {
                credentialCount: data.credentials.length,
                managerCount: data.passwordManagers.length
            });

            // Save vault
            this.saveVault();
        } catch (error) {
            console.error('[PasswordManager] Import vault error:', error);
        }
    }

    // ==================== CLEANUP ====================

    /**
     * Cleanup
     */
    async cleanup() {
        console.log('[PasswordManager] Cleaning up');

        // Lock vault
        await this.lockVault();

        // Clear caches
        this.credentials.clear();
        this.passwordManagers.clear();
        this.passwordHistory = [];
    }
}

// Export singleton instance
const passwordManagementService = new PasswordManagementService();
module.exports = passwordManagementService;
