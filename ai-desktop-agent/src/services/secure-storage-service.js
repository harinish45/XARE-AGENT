const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * Secure Storage Service - Encrypted credential storage
 * Features: AES-256 encryption, secure vault, key management, data integrity
 */
class SecureStorageService extends EventEmitter {
    constructor() {
        super();
        this.vault = new Map(); // Encrypted vault
        this.encryptionKey = null; // Current encryption key
        this.keyDerivation = 'pbkdf2'; // Key derivation function
        this.encryptionAlgorithm = 'aes-256-gcm'; // Encryption algorithm
        this.integrityHashes = new Map(); // Data integrity hashes
        this.isUnlocked = false;
        this.vaultPath = path.join(__dirname, '../../data/secure-vault.json');
    }

    /**
     * Initialize secure storage service
     * @param {Object} config - Configuration
     */
    async initialize(config = {}) {
        try {
            this.encryptionAlgorithm = config.encryptionAlgorithm || 'aes-256-gcm';
            this.keyDerivation = config.keyDerivation || 'pbkdf2';

            // Load vault
            await this.loadVault();

            console.log('[SecureStorage] Secure Storage Service initialized');
            return { success: true };
        } catch (error) {
            console.error('[SecureStorage] Initialization error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Create vault with master password
     * @param {string} masterPassword - Master password
     * @returns {Promise<Object>} Creation result
     */
    async createVault(masterPassword) {
        try {
            console.log('[SecureStorage] Creating new vault...');

            // Check if vault already exists
            const vaultExists = await this.vaultExists();
            if (vaultExists) {
                return {
                    success: false,
                    error: 'Vault already exists'
                };
            }

            // Derive encryption key
            this.encryptionKey = await this.deriveKey(masterPassword);

            // Create empty vault
            const vaultData = {
                version: '1.0',
                createdAt: new Date().toISOString(),
                keyHash: this.hashKey(masterPassword),
                items: []
            };

            // Encrypt vault
            const encrypted = await this.encryptVault(vaultData);

            // Save vault
            await this.saveVault(encrypted);

            this.isUnlocked = true;

            console.log('[SecureStorage] Vault created');

            // Emit event
            this.emit('vaultCreated');

            return { success: true };
        } catch (error) {
            console.error('[SecureStorage] Create vault error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Unlock vault
     * @param {string} masterPassword - Master password
     * @returns {Promise<Object>} Unlock result
     */
    async unlockVault(masterPassword) {
        try {
            console.log('[SecureStorage] Unlocking vault...');

            // Load encrypted vault
            const encrypted = await this.loadVault();

            // Derive key
            this.encryptionKey = await this.deriveKey(masterPassword);

            // Decrypt vault
            const vaultData = await this.decryptVault(encrypted);

            // Verify key hash
            const keyHash = this.hashKey(masterPassword);
            if (keyHash !== vaultData.keyHash) {
                return {
                    success: false,
                    error: 'Invalid master password'
                };
            }

            // Load items into memory
            for (const item of vaultData.items) {
                this.vault.set(item.id, item);
            }

            // Load integrity hashes
            for (const [id, hash] of Object.entries(vaultData.integrity || {})) {
                this.integrityHashes.set(id, hash);
            }

            this.isUnlocked = true;

            console.log('[SecureStorage] Vault unlocked');

            // Emit event
            this.emit('vaultUnlocked');

            return { success: true };
        } catch (error) {
            console.error('[SecureStorage] Unlock vault error:', error);
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
            console.log('[SecureStorage] Locking vault...');

            // Clear sensitive data
            this.vault.clear();
            this.integrityHashes.clear();
            this.encryptionKey = null;
            this.isUnlocked = false;

            console.log('[SecureStorage] Vault locked');

            // Emit event
            this.emit('vaultLocked');

            return { success: true };
        } catch (error) {
            console.error('[SecureStorage] Lock vault error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Change master password
     * @param {string} oldPassword - Old master password
     * @param {string} newPassword - New master password
     * @returns {Promise<Object>} Change result
     */
    async changeMasterPassword(oldPassword, newPassword) {
        try {
            console.log('[SecureStorage] Changing master password...');

            // Verify old password
            const oldKey = await this.deriveKey(oldPassword);
            const encrypted = await this.loadVault();
            const vaultData = await this.decryptVault(encrypted);

            const oldKeyHash = this.hashKey(oldPassword);
            if (oldKeyHash !== vaultData.keyHash) {
                return {
                    success: false,
                    error: 'Invalid old master password'
                };
            }

            // Derive new key
            this.encryptionKey = await this.deriveKey(newPassword);

            // Re-encrypt vault with new key
            const newEncrypted = await this.encryptVault(vaultData);

            // Update key hash
            vaultData.keyHash = this.hashKey(newPassword);
            vaultData.passwordChangedAt = new Date().toISOString();

            // Save vault
            await this.saveVault(newEncrypted);

            console.log('[SecureStorage] Master password changed');

            // Emit event
            this.emit('masterPasswordChanged');

            return { success: true };
        } catch (error) {
            console.error('[SecureStorage] Change master password error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ==================== ITEM MANAGEMENT ====================

    /**
     * Add item to vault
     * @param {Object} item - Item data
     * @returns {string} Item ID
     */
    async addItem(item) {
        if (!this.isUnlocked) {
            throw new Error('Vault is locked');
        }

        const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const itemData = {
            id: itemId,
            type: item.type || 'credential',
            title: item.title || 'Untitled',
            data: item.data || {},
            metadata: item.metadata || {},
            tags: item.tags || [],
            category: item.category || 'general',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastAccessed: null
        };

        // Add to vault
        this.vault.set(itemId, itemData);

        // Calculate integrity hash
        const integrityHash = this.calculateIntegrityHash(itemData);
        this.integrityHashes.set(itemId, integrityHash);

        console.log(`[SecureStorage] Item added: ${itemId}`);

        // Emit event
        this.emit('itemAdded', itemData);

        // Save vault
        await this.saveVault();

        return itemId;
    }

    /**
     * Get item from vault
     * @param {string} itemId - Item ID
     * @returns {Object|null} Item or null
     */
    getItem(itemId) {
        if (!this.isUnlocked) {
            throw new Error('Vault is locked');
        }

        const item = this.vault.get(itemId);
        if (!item) {
            return null;
        }

        // Update last accessed
        item.lastAccessed = new Date().toISOString();

        return item;
    }

    /**
     * Get all items
     * @param {Object} filters - Optional filters
     * @returns {Array} Items array
     */
    getItems(filters = {}) {
        if (!this.isUnlocked) {
            throw new Error('Vault is locked');
        }

        let items = Array.from(this.vault.values());

        if (filters.type) {
            items = items.filter(i => i.type === filters.type);
        }

        if (filters.category) {
            items = items.filter(i => i.category === filters.category);
        }

        if (filters.tags && filters.tags.length > 0) {
            items = items.filter(i =>
                filters.tags.some(tag => i.tags.includes(tag))
            );
        }

        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            items = items.filter(i =>
                i.title.toLowerCase().includes(searchLower) ||
                i.metadata.description?.toLowerCase().includes(searchLower)
            );
        }

        // Sort by last accessed (descending)
        items.sort((a, b) => {
            const aTime = a.lastAccessed ? new Date(a.lastAccessed).getTime() : 0;
            const bTime = b.lastAccessed ? new Date(b.lastAccessed).getTime() : 0;
            return bTime - aTime;
        });

        return items;
    }

    /**
     * Update item
     * @param {string} itemId - Item ID
     * @param {Object} updates - Updates to apply
     */
    async updateItem(itemId, updates) {
        if (!this.isUnlocked) {
            throw new Error('Vault is locked');
        }

        const item = this.vault.get(itemId);
        if (!item) {
            throw new Error(`Item not found: ${itemId}`);
        }

        // Apply updates
        const updatedItem = {
            ...item,
            ...updates,
            updatedAt: new Date().toISOString()
        };

        // Update vault
        this.vault.set(itemId, updatedItem);

        // Recalculate integrity hash
        const integrityHash = this.calculateIntegrityHash(updatedItem);
        this.integrityHashes.set(itemId, integrityHash);

        console.log(`[SecureStorage] Item updated: ${itemId}`);

        // Emit event
        this.emit('itemUpdated', updatedItem);

        // Save vault
        await this.saveVault();
    }

    /**
     * Delete item
     * @param {string} itemId - Item ID
     */
    async deleteItem(itemId) {
        if (!this.isUnlocked) {
            throw new Error('Vault is locked');
        }

        const item = this.vault.get(itemId);
        if (!item) {
            throw new Error(`Item not found: ${itemId}`);
        }

        // Remove from vault
        this.vault.delete(itemId);
        this.integrityHashes.delete(itemId);

        console.log(`[SecureStorage] Item deleted: ${itemId}`);

        // Emit event
        this.emit('itemDeleted', item);

        // Save vault
        await this.saveVault();
    }

    /**
     * Verify item integrity
     * @param {string} itemId - Item ID
     * @returns {boolean} Integrity status
     */
    verifyItemIntegrity(itemId) {
        if (!this.isUnlocked) {
            throw new Error('Vault is locked');
        }

        const item = this.vault.get(itemId);
        if (!item) {
            return false;
        }

        const storedHash = this.integrityHashes.get(itemId);
        const currentHash = this.calculateIntegrityHash(item);

        return storedHash === currentHash;
    }

    // ==================== ENCRYPTION ====================

    /**
     * Derive key from password
     * @private
     */
    async deriveKey(password) {
        const salt = 'ai-desktop-agent-salt';
        const iterations = 100000;
        const keyLength = 32; // 256 bits

        return new Promise((resolve, reject) => {
            crypto.pbkdf2(
                password,
                salt,
                iterations,
                keyLength,
                this.keyDerivation,
                (err, key) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(key);
                    }
                }
            );
        });
    }

    /**
     * Hash key
     * @private
     */
    hashKey(password) {
        return crypto.createHash('sha256').update(password).digest('hex');
    }

    /**
     * Encrypt vault
     * @private
     */
    async encryptVault(vaultData) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.encryptionAlgorithm, this.encryptionKey, iv);

        let encrypted = cipher.update(JSON.stringify(vaultData), 'utf8', 'hex');
        encrypted += cipher.final('hex');

        // Get auth tag for GCM
        const authTag = cipher.getAuthTag();

        return {
            iv: iv.toString('hex'),
            data: encrypted,
            authTag: authTag.toString('hex')
        };
    }

    /**
     * Decrypt vault
     * @private
     */
    async decryptVault(encrypted) {
        const iv = Buffer.from(encrypted.iv, 'hex');
        const authTag = Buffer.from(encrypted.authTag, 'hex');
        const decipher = crypto.createDecipheriv(this.encryptionAlgorithm, this.encryptionKey, iv);

        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted.data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return JSON.parse(decrypted);
    }

    /**
     * Calculate integrity hash
     * @private
     */
    calculateIntegrityHash(item) {
        const data = JSON.stringify(item);
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    // ==================== VAULT MANAGEMENT ====================

    /**
     * Check if vault exists
     * @private
     */
    async vaultExists() {
        try {
            await fs.access(this.vaultPath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Save vault to file
     * @private
     */
    async saveVault() {
        try {
            // Prepare vault data
            const items = Array.from(this.vault.values());
            const integrity = Object.fromEntries(this.integrityHashes);

            const vaultData = {
                version: '1.0',
                items,
                integrity,
                updatedAt: new Date().toISOString()
            };

            // Encrypt vault
            const encrypted = await this.encryptVault(vaultData);

            // Save to file
            const data = JSON.stringify(encrypted, null, 2);
            await fs.writeFile(this.vaultPath, data, 'utf-8');

            console.log('[SecureStorage] Vault saved');
        } catch (error) {
            console.error('[SecureStorage] Save vault error:', error);
            throw error;
        }
    }

    /**
     * Load vault from file
     * @private
     */
    async loadVault() {
        try {
            const data = await fs.readFile(this.vaultPath, 'utf-8');
            const encrypted = JSON.parse(data);

            console.log('[SecureStorage] Vault loaded');

            return encrypted;
        } catch (error) {
            console.log('[SecureStorage] No vault found, creating new one');
            return null;
        }
    }

    /**
     * Delete vault
     * @returns {Promise<Object>} Delete result
     */
    async deleteVault() {
        try {
            console.log('[SecureStorage] Deleting vault...');

            // Lock vault first
            await this.lockVault();

            // Delete vault file
            await fs.unlink(this.vaultPath);

            console.log('[SecureStorage] Vault deleted');

            // Emit event
            this.emit('vaultDeleted');

            return { success: true };
        } catch (error) {
            console.error('[SecureStorage] Delete vault error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Backup vault
     * @param {string} backupPath - Backup file path
     * @returns {Promise<Object>} Backup result
     */
    async backupVault(backupPath) {
        try {
            console.log('[SecureStorage] Backing up vault...');

            // Copy vault file
            await fs.copyFile(this.vaultPath, backupPath);

            console.log('[SecureStorage] Vault backed up');

            // Emit event
            this.emit('vaultBackedUp', { backupPath });

            return { success: true, backupPath };
        } catch (error) {
            console.error('[SecureStorage] Backup vault error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Restore vault from backup
     * @param {string} backupPath - Backup file path
     * @returns {Promise<Object>} Restore result
     */
    async restoreVault(backupPath) {
        try {
            console.log('[SecureStorage] Restoring vault from backup...');

            // Copy backup file
            await fs.copyFile(backupPath, this.vaultPath);

            console.log('[SecureStorage] Vault restored');

            // Emit event
            this.emit('vaultRestored', { backupPath });

            return { success: true };
        } catch (error) {
            console.error('[SecureStorage] Restore vault error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ==================== ANALYTICS ====================

    /**
     * Get vault statistics
     * @returns {Object} Statistics
     */
    getVaultStatistics() {
        const items = Array.from(this.vault.values());

        const typeCounts = {};
        const categoryCounts = {};

        for (const item of items) {
            typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
            categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
        }

        return {
            isUnlocked: this.isUnlocked,
            totalItems: items.length,
            typeCounts,
            categoryCounts,
            encryptionAlgorithm: this.encryptionAlgorithm,
            keyDerivation: this.keyDerivation,
            vaultPath: this.vaultPath
        };
    }

    /**
     * Get vault status
     * @returns {Object} Vault status
     */
    getVaultStatus() {
        return {
            isUnlocked: this.isUnlocked,
            itemCount: this.vault.size,
            vaultExists: this.vaultExistsSync()
        };
    }

    /**
     * Check if vault exists (sync)
     * @private
     */
    vaultExistsSync() {
        try {
            fs.accessSync(this.vaultPath);
            return true;
        } catch {
            return false;
        }
    }

    // ==================== EXPORT/IMPORT ====================

    /**
     * Export vault
     * @param {boolean} includeData - Include decrypted data
     * @returns {Object} Exported data
     */
    exportVault(includeData = false) {
        if (!this.isUnlocked) {
            throw new Error('Vault is locked');
        }

        const items = Array.from(this.vault.values());

        return {
            version: '1.0',
            items: includeData ? items : items.map(i => ({
                id: i.id,
                type: i.type,
                title: i.title,
                category: i.category,
                tags: i.tags,
                createdAt: i.createdAt,
                updatedAt: i.updatedAt
            })),
            integrity: Object.fromEntries(this.integrityHashes),
            exportedAt: new Date().toISOString()
        };
    }

    /**
     * Import vault
     * @param {Object} data - Data to import
     * @returns {Promise<Object>} Import result
     */
    async importVault(data) {
        try {
            console.log('[SecureStorage] Importing vault...');

            // Validate data
            if (!data.version || !data.items) {
                throw new Error('Invalid vault data format');
            }

            // Import items
            for (const item of data.items) {
                const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

                const itemData = {
                    id: itemId,
                    ...item,
                    createdAt: item.createdAt || new Date().toISOString(),
                    updatedAt: item.updatedAt || new Date().toISOString(),
                    lastAccessed: null
                };

                this.vault.set(itemId, itemData);

                // Calculate integrity hash
                const integrityHash = this.calculateIntegrityHash(itemData);
                this.integrityHashes.set(itemId, integrityHash);
            }

            // Save vault
            await this.saveVault();

            console.log(`[SecureStorage] Imported ${data.items.length} items`);

            // Emit event
            this.emit('vaultImported', { itemCount: data.items.length });

            return { success: true };
        } catch (error) {
            console.error('[SecureStorage] Import vault error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ==================== CLEANUP ====================

    /**
     * Cleanup
     */
    async cleanup() {
        console.log('[SecureStorage] Cleaning up');

        // Lock vault
        await this.lockVault();

        // Clear caches
        this.vault.clear();
        this.integrityHashes.clear();
    }
}

// Export singleton instance
const secureStorageService = new SecureStorageService();
module.exports = secureStorageService;
