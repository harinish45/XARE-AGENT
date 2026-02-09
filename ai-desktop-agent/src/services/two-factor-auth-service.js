const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

/**
 * 2FA Automation Service - Two-factor authentication
 * Features: TOTP generation, 2FA code management, backup codes, provider integration
 */
class TwoFactorAuthService extends EventEmitter {
    constructor() {
        super();
        this.twoFactorAccounts = new Map(); // 2FA accounts
        this.backupCodes = new Map(); // Backup codes
        this.codeHistory = []; // Code history
        this.isUnlocked = false;
        this.masterPassword = null;
    }

    /**
     * Initialize 2FA service
     * @param {Object} config - Configuration
     */
    async initialize(config = {}) {
        try {
            // Load saved accounts
            await this.loadAccounts();

            console.log('[2FA] 2FA Automation Service initialized');
            return { success: true };
        } catch (error) {
            console.error('[2FA] Initialization error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Unlock service
     * @param {string} masterPassword - Master password
     * @returns {Promise<Object>} Unlock result
     */
    async unlock(masterPassword) {
        try {
            console.log('[2FA] Unlocking service...');

            // Verify master password
            const isValid = await this.verifyMasterPassword(masterPassword);

            if (!isValid) {
                return {
                    success: false,
                    error: 'Invalid master password'
                };
            }

            this.masterPassword = masterPassword;
            this.isUnlocked = true;

            console.log('[2FA] Service unlocked');

            // Emit event
            this.emit('serviceUnlocked');

            return { success: true };
        } catch (error) {
            console.error('[2FA] Unlock error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Lock service
     * @returns {Promise<Object>} Lock result
     */
    async lock() {
        try {
            console.log('[2FA] Locking service...');

            this.masterPassword = null;
            this.isUnlocked = false;

            console.log('[2FA] Service locked');

            // Emit event
            this.emit('serviceLocked');

            return { success: true };
        } catch (error) {
            console.error('[2FA] Lock error:', error);
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
        const crypto = require('crypto');
        const hash = crypto.createHash('sha256').update(masterPassword).digest('hex');
        return hash === storedHash;
    }

    /**
     * Store master hash
     * @private
     */
    async storeMasterHash(masterPassword) {
        const crypto = require('crypto');
        const hash = crypto.createHash('sha256').update(masterPassword).digest('hex');
        await fs.writeFile(
            path.join(__dirname, '../../data/2fa-master-hash.txt'),
            hash,
            'utf-8'
        );
    }

    /**
     * Get stored master hash
     * @private
     */
    async getStoredMasterHash() {
        try {
            const hash = await fs.readFile(
                path.join(__dirname, '../../data/2fa-master-hash.txt'),
                'utf-8'
            );
            return hash.trim();
        } catch (error) {
            return null;
        }
    }

    // ==================== TOTP GENERATION ====================

    /**
     * Generate TOTP code
     * @param {string} accountId - Account ID
     * @returns {string} TOTP code
     */
    generateTOTP(accountId) {
        if (!this.isUnlocked) {
            throw new Error('Service is locked');
        }

        const account = this.twoFactorAccounts.get(accountId);
        if (!account) {
            throw new Error(`Account not found: ${accountId}`);
        }

        if (account.type !== 'totp') {
            throw new Error('Account is not TOTP type');
        }

        // Generate TOTP code
        const code = this.generateTOTPCode(account.secret);

        console.log(`[2FA] Generated TOTP code for ${accountId}`);

        // Add to history
        this.codeHistory.push({
            accountId,
            code,
            timestamp: new Date().toISOString()
        });

        // Trim history
        if (this.codeHistory.length > 100) {
            this.codeHistory.shift();
        }

        // Emit event
        this.emit('codeGenerated', { accountId, code });

        return code;
    }

    /**
     * Generate TOTP code from secret
     * @private
     */
    generateTOTPCode(secret) {
        const crypto = require('crypto');
        const speakeasy = require('speakeasy');

        // Generate TOTP code
        const token = speakeasy.totp({
            secret: secret,
            encoding: 'base32',
            algorithm: 'sha1',
            digits: 6,
            period: 30
        });

        return token;
    }

    /**
     * Get time remaining for TOTP
     * @param {string} accountId - Account ID
     * @returns {number} Seconds remaining
     */
    getTOTPTimeRemaining(accountId) {
        const account = this.twoFactorAccounts.get(accountId);
        if (!account || account.type !== 'totp') {
            return 0;
        }

        const speakeasy = require('speakeasy');
        const timeRemaining = speakeasy.totp({
            secret: account.secret,
            encoding: 'base32',
            algorithm: 'sha1',
            digits: 6,
            period: 30
        }).delta;

        return timeRemaining;
    }

    // ==================== ACCOUNT MANAGEMENT ====================

    /**
     * Add TOTP account
     * @param {Object} account - Account configuration
     * @returns {string} Account ID
     */
    addTOTPAccount(account) {
        if (!this.isUnlocked) {
            throw new Error('Service is locked');
        }

        const accountId = `totp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const accountData = {
            id: accountId,
            type: 'totp',
            name: account.name || 'Unnamed Account',
            service: account.service || '',
            username: account.username || '',
            secret: account.secret || '',
            issuer: account.issuer || 'AI Desktop Agent',
            digits: account.digits || 6,
            period: account.period || 30,
            algorithm: account.algorithm || 'sha1',
            createdAt: new Date().toISOString(),
            lastUsed: null
        };

        this.twoFactorAccounts.set(accountId, accountData);

        console.log(`[2FA] TOTP account added: ${accountId}`);

        // Emit event
        this.emit('accountAdded', accountData);

        // Save accounts
        this.saveAccounts();

        return accountId;
    }

    /**
     * Add backup codes
     * @param {string} accountId - Account ID
     * @param {Array} codes - Backup codes
     * @returns {string} Backup ID
     */
    addBackupCodes(accountId, codes) {
        if (!this.isUnlocked) {
            throw new Error('Service is locked');
        }

        const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const backupData = {
            id: backupId,
            accountId,
            codes,
            createdAt: new Date().toISOString(),
            used: []
        };

        this.backupCodes.set(backupId, backupData);

        console.log(`[2FA] Backup codes added: ${backupId}`);

        // Emit event
        this.emit('backupCodesAdded', backupData);

        // Save accounts
        this.saveAccounts();

        return backupId;
    }

    /**
     * Use backup code
     * @param {string} backupId - Backup ID
     * @param {number} codeIndex - Code index
     * @returns {string} Code
     */
    useBackupCode(backupId, codeIndex) {
        if (!this.isUnlocked) {
            throw new Error('Service is locked');
        }

        const backup = this.backupCodes.get(backupId);
        if (!backup) {
            throw new Error(`Backup not found: ${backupId}`);
        }

        if (codeIndex < 0 || codeIndex >= backup.codes.length) {
            throw new Error(`Invalid code index: ${codeIndex}`);
        }

        const code = backup.codes[codeIndex];

        // Mark as used
        backup.used.push({
            codeIndex,
            usedAt: new Date().toISOString()
        });

        console.log(`[2FA] Backup code used: ${code}`);

        // Emit event
        this.emit('backupCodeUsed', { backupId, codeIndex, code });

        // Save accounts
        this.saveAccounts();

        return code;
    }

    /**
     * Get account
     * @param {string} accountId - Account ID
     * @returns {Object|null} Account or null
     */
    getAccount(accountId) {
        return this.twoFactorAccounts.get(accountId) || null;
    }

    /**
     * Get all accounts
     * @param {Object} filters - Optional filters
     * @returns {Array} Accounts array
     */
    getAccounts(filters = {}) {
        let accounts = Array.from(this.twoFactorAccounts.values());

        if (filters.type) {
            accounts = accounts.filter(a => a.type === filters.type);
        }

        if (filters.service) {
            accounts = accounts.filter(a => a.service === filters.service);
        }

        // Sort by last used (descending)
        accounts.sort((a, b) => {
            const aTime = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
            const bTime = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
            return bTime - aTime;
        });

        return accounts;
    }

    /**
     * Update account
     * @param {string} accountId - Account ID
     * @param {Object} updates - Updates to apply
     */
    updateAccount(accountId, updates) {
        if (!this.isUnlocked) {
            throw new Error('Service is locked');
        }

        const account = this.twoFactorAccounts.get(accountId);
        if (!account) {
            throw new Error(`Account not found: ${accountId}`);
        }

        const updatedAccount = {
            ...account,
            ...updates
        };

        this.twoFactorAccounts.set(accountId, updatedAccount);

        console.log(`[2FA] Account updated: ${accountId}`);

        // Emit event
        this.emit('accountUpdated', updatedAccount);

        // Save accounts
        this.saveAccounts();
    }

    /**
     * Delete account
     * @param {string} accountId - Account ID
     */
    deleteAccount(accountId) {
        if (!this.isUnlocked) {
            throw new Error('Service is locked');
        }

        const account = this.twoFactorAccounts.get(accountId);
        if (!account) {
            throw new Error(`Account not found: ${accountId}`);
        }

        this.twoFactorAccounts.delete(accountId);

        console.log(`[2FA] Account deleted: ${accountId}`);

        // Emit event
        this.emit('accountDeleted', account);

        // Save accounts
        this.saveAccounts();
    }

    // ==================== PROVIDER INTEGRATION ====================

    /**
     * Get QR code for TOTP setup
     * @param {string} accountId - Account ID
     * @returns {string} QR code URL
     */
    getTOTPQRCodeURL(accountId) {
        const account = this.twoFactorAccounts.get(accountId);
        if (!account || account.type !== 'totp') {
            throw new Error('Invalid account');
        }

        // Generate otpauth URL
        const url = `otpauth://totp/${account.issuer}:${account.username}?secret=${account.secret}&issuer=${account.issuer}&algorithm=${account.algorithm}&digits=${account.digits}&period=${account.period}`;

        return url;
    }

    /**
     * Validate TOTP code
     * @param {string} accountId - Account ID
     * @param {string} code - Code to validate
     * @returns {boolean} Valid status
     */
    validateTOTPCode(accountId, code) {
        const account = this.twoFactorAccounts.get(accountId);
        if (!account || account.type !== 'totp') {
            return false;
        }

        // Generate current code
        const currentCode = this.generateTOTPCode(account.secret);

        // Compare
        const isValid = currentCode === code;

        if (isValid) {
            // Update last used
            account.lastUsed = new Date().toISOString();
            this.twoFactorAccounts.set(accountId, account);
            this.saveAccounts();
        }

        return isValid;
    }

    // ==================== ANALYTICS ====================

    /**
     * Get code history
     * @param {number} limit - Limit number of results
     * @returns {Array} History array
     */
    getCodeHistory(limit = 50) {
        return this.codeHistory.slice(-limit);
    }

    /**
     * Get backup codes
     * @param {string} accountId - Account ID
     * @returns {Array} Backup codes
     */
    getBackupCodes(accountId) {
        const backups = Array.from(this.backupCodes.values())
            .filter(b => b.accountId === accountId);

        return backups;
    }

    /**
     * Get statistics
     * @returns {Object} Statistics
     */
    getStatistics() {
        const accounts = Array.from(this.twoFactorAccounts.values());
        const backups = Array.from(this.backupCodes.values());

        return {
            isUnlocked: this.isUnlocked,
            totalAccounts: accounts.length,
            totpAccounts: accounts.filter(a => a.type === 'totp').length,
            totalBackups: backups.length,
            codeHistorySize: this.codeHistory.length
        };
    }

    // ==================== PERSISTENCE ====================

    /**
     * Save accounts to file
     * @private
     */
    async saveAccounts() {
        try {
            const data = JSON.stringify({
                accounts: Array.from(this.twoFactorAccounts.entries()),
                backups: Array.from(this.backupCodes.entries())
            }, null, 2);

            await fs.writeFile(
                path.join(__dirname, '../../data/2fa-accounts.json'),
                data,
                'utf-8'
            );

            console.log('[2FA] Accounts saved');
        } catch (error) {
            console.error('[2FA] Save accounts error:', error);
        }
    }

    /**
     * Load accounts from file
     * @private
     */
    async loadAccounts() {
        try {
            const data = await fs.readFile(
                path.join(__dirname, '../../data/2fa-accounts.json'),
                'utf-8'
            );
            const parsed = JSON.parse(data);

            // Load accounts
            this.twoFactorAccounts = new Map(parsed.accounts);

            // Load backups
            this.backupCodes = new Map(parsed.backups);

            console.log(`[2FA] Loaded ${this.twoFactorAccounts.size} accounts`);
        } catch (error) {
            console.log('[2FA] No saved accounts found');
        }
    }

    /**
     * Export accounts
     * @returns {Object} Exported data
     */
    exportAccounts() {
        return {
            accounts: Array.from(this.twoFactorAccounts.values()),
            backups: Array.from(this.backupCodes.values()),
            codeHistory: this.codeHistory,
            exportedAt: new Date().toISOString()
        };
    }

    /**
     * Import accounts
     * @param {Object} data - Data to import
     */
    importAccounts(data) {
        try {
            // Import accounts
            this.twoFactorAccounts = new Map(data.accounts);

            // Import backups
            this.backupCodes = new Map(data.backups);

            // Import code history
            this.codeHistory = data.codeHistory || [];

            console.log('[2FA] Accounts imported successfully');

            // Emit event
            this.emit('accountsImported', {
                accountCount: this.twoFactorAccounts.size,
                backupCount: this.backupCodes.size
            });

            // Save accounts
            this.saveAccounts();
        } catch (error) {
            console.error('[2FA] Import accounts error:', error);
        }
    }

    // ==================== CLEANUP ====================

    /**
     * Cleanup
     */
    async cleanup() {
        console.log('[2FA] Cleaning up');

        // Lock service
        await this.lock();

        // Clear caches
        this.twoFactorAccounts.clear();
        this.backupCodes.clear();
        this.codeHistory = [];
    }
}

// Export singleton instance
const twoFactorAuthService = new TwoFactorAuthService();
module.exports = twoFactorAuthService;
