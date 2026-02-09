const { google } = require('googleapis');
const { JWT } = require('google-auth-library');

/**
 * Email Automation Service - Enhanced Gmail with auto-reply
 * Features: Send, read, reply, auto-reply, label management, search
 */
class EmailAutomationService {
    constructor() {
        this.gmailClient = null;
        this.gmailAuth = null;
        this.autoReplyRules = new Map(); // Auto-reply rules
        this.autoReplyHistory = new Map(); // Track sent auto-replies
        this.labelCache = new Map(); // Cache for labels
    }

    /**
     * Initialize Gmail client
     * @param {Object} credentials - Google API credentials
     */
    async initializeGmail(credentials) {
        try {
            // Authenticate with JWT
            this.gmailAuth = new JWT({
                email: credentials.client_email,
                key: credentials.private_key,
                scopes: [
                    'https://www.googleapis.com/auth/gmail.readonly',
                    'https://www.googleapis.com/auth/gmail.send',
                    'https://www.googleapis.com/auth/gmail.modify',
                    'https://www.googleapis.com/auth/gmail.labels'
                ]
            });

            // Initialize Gmail API
            this.gmailClient = google.gmail({ version: 'v1', auth: this.gmailAuth });

            console.log('[Email] Gmail initialized');
            return { success: true };
        } catch (error) {
            console.error('[Email] Gmail initialization error:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== EMAIL OPERATIONS ====================

    /**
     * Send email
     * @param {Object} email - Email configuration
     * @returns {Promise<Object>} Send result
     */
    async sendEmail(email) {
        try {
            if (!this.gmailClient) {
                throw new Error('Gmail not initialized');
            }

            console.log(`[Email] Sending email to: ${email.to}`);

            const message = {
                userId: 'me',
                threadId: email.threadId || '',
                raw: await this.buildRawEmail(email)
            };

            const response = await this.gmailClient.users.messages.send(message);

            // Track auto-reply if applicable
            if (email.enableAutoReply) {
                await this.trackAutoReply(email.to, email.subject, response.data.id);
            }

            return {
                success: true,
                messageId: response.data.id,
                threadId: response.data.threadId
            };
        } catch (error) {
            console.error('[Email] Send email error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Build raw email message
     * @private
     */
    async buildRawEmail(email) {
        const { simpleParser } = require('mailparser');
        const { simpleParser: simpleParser2 } = require('mailparser');

        // Build email content
        const emailContent = {
            from: email.from || this.gmailAuth.credentials.email,
            to: email.to,
            subject: email.subject,
            text: email.text,
            html: email.html,
            attachments: email.attachments || []
        };

        // Parse to raw format
        const parsed = simpleParser(emailContent);
        return parsed.raw;
    }

    /**
     * Read emails
     * @param {Object} options - Read options
     * @returns {Promise<Object>} Read result
     */
    async readEmails(options = {}) {
        try {
            if (!this.gmailClient) {
                throw new Error('Gmail not initialized');
            }

            console.log('[Email] Reading emails');

            const query = options.query || '';
            const maxResults = options.maxResults || 10;
            const labelIds = options.labelIds ? options.labelIds.join(',') : '';
            const includeSpamTrash = options.includeSpamTrash || false;

            const response = await this.gmailClient.users.messages.list({
                userId: 'me',
                q: query,
                maxResults,
                labelIds,
                includeSpamTrash,
                pageToken: options.pageToken
            });

            const messages = response.data.messages || [];

            return {
                success: true,
                messages,
                nextPageToken: response.data.nextPageToken,
                resultSizeEstimate: response.data.resultSizeEstimate
            };
        } catch (error) {
            console.error('[Email] Read emails error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get email by ID
     * @param {string} messageId - Message ID
     * @param {Object} options - Get options
     * @returns {Promise<Object>} Email result
     */
    async getEmail(messageId, options = {}) {
        try {
            if (!this.gmailClient) {
                throw new Error('Gmail not initialized');
            }

            console.log(`[Email] Getting email: ${messageId}`);

            const format = options.format || 'full';
            const metadataHeaders = options.metadata ? ['metadataHeaders'] : [];

            const response = await this.gmailClient.users.messages.get({
                userId: 'me',
                id: messageId,
                format,
                metadataHeaders
            });

            const message = response.data;

            return {
                success: true,
                message: {
                    id: message.id,
                    threadId: message.threadId,
                    snippet: message.snippet,
                    payload: message.payload,
                    internalDate: message.internalDate,
                    labelIds: message.labelIds
                }
            };
        } catch (error) {
            console.error('[Email] Get email error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Reply to email
     * @param {string} messageId - Message ID to reply to
     * @param {Object} reply - Reply configuration
     * @returns {Promise<Object>} Reply result
     */
    async replyToEmail(messageId, reply) {
        try {
            if (!this.gmailClient) {
                throw new Error('Gmail not initialized');
            }

            console.log(`[Email] Replying to: ${messageId}`);

            const message = {
                userId: 'me',
                threadId: reply.threadId || '',
                raw: await this.buildRawEmail(reply)
            };

            const response = await this.gmailClient.users.messages.send(message);

            return {
                success: true,
                messageId: response.data.id,
                threadId: response.data.threadId
            };
        } catch (error) {
            console.error('[Email] Reply error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Forward email
     * @param {string} messageId - Message ID to forward
     * @param {string} to - Forward to address
     * @returns {Promise<Object>} Forward result
     */
    async forwardEmail(messageId, to) {
        try {
            if (!this.gmailClient) {
                throw new Error('Gmail not initialized');
            }

            console.log(`[Email] Forwarding: ${messageId} to ${to}`);

            const response = await this.gmailClient.users.messages.forward({
                userId: 'me',
                id: messageId,
                to: [to]
            });

            return {
                success: true,
                messageId: response.data.id
            };
        } catch (error) {
            console.error('[Email] Forward error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Delete email
     * @param {string} messageId - Message ID to delete
     * @returns {Promise<Object>} Delete result
     */
    async deleteEmail(messageId) {
        try {
            if (!this.gmailClient) {
                throw new Error('Gmail not initialized');
            }

            console.log(`[Email] Deleting: ${messageId}`);

            const response = await this.gmailClient.users.messages.trash({
                userId: 'me',
                id: messageId
            });

            return {
                success: true,
                messageId
            };
        } catch (error) {
            console.error('[Email] Delete error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Archive email
     * @param {string} messageId - Message ID to archive
     * @returns {Promise<Object>} Archive result
     */
    async archiveEmail(messageId) {
        try {
            if (!this.gmailClient) {
                throw new Error('Gmail not initialized');
            }

            console.log(`[Email] Archiving: ${messageId}`);

            const response = await this.gmailClient.users.messages.archive({
                userId: 'me',
                id: messageId
            });

            return {
                success: true,
                messageId
            };
        } catch (error) {
            console.error('[Email] Archive error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Mark email as read
     * @param {string} messageId - Message ID
     * @returns {Promise<Object>} Mark read result
     */
    async markAsRead(messageId) {
        try {
            if (!this.gmailClient) {
                throw new Error('Gmail not initialized');
            }

            console.log(`[Email] Marking as read: ${messageId}`);

            const response = await this.gmailClient.users.messages.modify({
                userId: 'me',
                id: messageId,
                removeLabelIds: ['UNREAD']
            });

            return {
                success: true,
                messageId
            };
        } catch (error) {
            console.error('[Email] Mark as read error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Mark email as unread
     * @param {string} messageId - Message ID
     * @returns {Promise<Object>} Mark unread result
     */
    async markAsUnread(messageId) {
        try {
            if (!this.gmailClient) {
                throw new Error('Gmail not initialized');
            }

            console.log(`[Email] Marking as unread: ${messageId}`);

            const response = await this.gmailClient.users.messages.modify({
                userId: 'me',
                id: messageId,
                addLabelIds: ['UNREAD']
            });

            return {
                success: true,
                messageId
            };
        } catch (error) {
            console.error('[Email] Mark as unread error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ==================== LABEL MANAGEMENT ====================

    /**
     * Get all labels
     * @returns {Promise<Object>} Labels result
     */
    async getLabels() {
        try {
            if (!this.gmailClient) {
                throw new Error('Gmail not initialized');
            }

            console.log('[Email] Getting labels');

            const response = await this.gmailClient.users.labels.list({
                userId: 'me'
            });

            const labels = response.data.labels || [];

            return {
                success: true,
                labels: labels.map(label => ({
                    id: label.id,
                    name: label.name,
                    type: label.type,
                    messagesTotal: label.messagesTotal,
                    messagesUnread: label.messagesUnread,
                    threadsTotal: label.threadsTotal,
                    color: label.color
                }))
            };
        } catch (error) {
            console.error('[Email] Get labels error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Create label
     * @param {string} name - Label name
     * @param {Object} options - Label options
     * @returns {Promise<Object>} Create result
     */
    async createLabel(name, options = {}) {
        try {
            if (!this.gmailClient) {
                throw new Error('Gmail not initialized');
            }

            console.log(`[Email] Creating label: ${name}`);

            const label = {
                name,
                labelListVisibility: options.visibility || 'show',
                messageListVisibility: options.messageListVisibility || 'show',
                color: options.color || '#4285f4'
            };

            const response = await this.gmailClient.users.labels.create({
                userId: 'me',
                resource: label
            });

            return {
                success: true,
                labelId: response.data.id,
                label: response.data
            };
        } catch (error) {
            console.error('[Email] Create label error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Delete label
     * @param {string} labelId - Label ID to delete
     * @returns {Promise<Object>} Delete result
     */
    async deleteLabel(labelId) {
        try {
            if (!this.gmailClient) {
                throw new Error('Gmail not initialized');
            }

            console.log(`[Email] Deleting label: ${labelId}`);

            await this.gmailClient.users.labels.delete({
                userId: 'me',
                id: labelId
            });

            return {
                success: true,
                labelId
            };
        } catch (error) {
            console.error('[Email] Delete label error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Apply label to messages
     * @param {string} labelId - Label ID
     * @param {Array} messageIds - Message IDs to label
     * @returns {Promise<Object>} Apply result
     */
    async applyLabelToMessages(labelId, messageIds) {
        try {
            if (!this.gmailClient) {
                throw new Error('Gmail not initialized');
            }

            console.log(`[Email] Applying label ${labelId} to ${messageIds.length} messages`);

            const response = await this.gmailClient.users.messages.batchModify({
                userId: 'me',
                requests: messageIds.map(id => ({
                    id,
                    addLabelIds: [labelId]
                }))
            });

            return {
                success: true,
                modifiedCount: response.data.responses?.length || 0
            };
        } catch (error) {
            console.error('[Email] Apply label error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ==================== AUTO-REPLY SYSTEM ====================

    /**
     * Add auto-reply rule
     * @param {Object} rule - Auto-reply rule
     * @returns {string} Rule ID
     */
    addAutoReplyRule(rule) {
        const ruleId = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const ruleConfig = {
            id: ruleId,
            ...rule,
            enabled: rule.enabled !== false,
            createdAt: new Date().toISOString(),
            replyCount: 0
        };

        this.autoReplyRules.set(ruleId, ruleConfig);
        console.log(`[Email] Auto-reply rule added: ${ruleId}`);

        return ruleId;
    }

    /**
     * Remove auto-reply rule
     * @param {string} ruleId - Rule ID to remove
     */
    removeAutoReplyRule(ruleId) {
        this.autoReplyRules.delete(ruleId);
        console.log(`[Email] Auto-reply rule removed: ${ruleId}`);
    }

    /**
     * Get auto-reply rules
     * @returns {Array} Array of rules
     */
    getAutoReplyRules() {
        return Array.from(this.autoReplyRules.values());
    }

    /**
     * Update auto-reply rule
     * @param {string} ruleId - Rule ID
     * @param {Object} updates - Updates to apply
     */
    updateAutoReplyRule(ruleId, updates) {
        const rule = this.autoReplyRules.get(ruleId);
        if (rule) {
            const updatedRule = { ...rule, ...updates };
            this.autoReplyRules.set(ruleId, updatedRule);
            console.log(`[Email] Auto-reply rule updated: ${ruleId}`);
        }
    }

    /**
     * Enable auto-reply rule
     * @param {string} ruleId - Rule ID
     */
    enableAutoReplyRule(ruleId) {
        this.updateAutoReplyRule(ruleId, { enabled: true });
    }

    /**
     * Disable auto-reply rule
     * @param {string} ruleId - Rule ID
     */
    disableAutoReplyRule(ruleId) {
        this.updateAutoReplyRule(ruleId, { enabled: false });
    }

    /**
     * Check if should auto-reply
     * @param {string} from - Sender email
     * @param {string} subject - Email subject
     * @param {string} body - Email body
     * @returns {Object|null} Matching rule or null
     */
    shouldAutoReply(from, subject, body) {
        const rules = this.getAutoReplyRules().filter(r => r.enabled);

        for (const rule of rules) {
            // Check sender
            if (rule.sender && !from.includes(rule.sender)) {
                continue;
            }

            // Check subject
            if (rule.subject && !subject.toLowerCase().includes(rule.subject.toLowerCase())) {
                continue;
            }

            // Check body
            if (rule.body && !body.toLowerCase().includes(rule.body.toLowerCase())) {
                continue;
            }

            // Check keywords
            if (rule.keywords && rule.keywords.length > 0) {
                const hasKeyword = rule.keywords.some(keyword =>
                    body.toLowerCase().includes(keyword.toLowerCase()) ||
                    subject.toLowerCase().includes(keyword.toLowerCase())
                );
                if (!hasKeyword) {
                    continue;
                }
            }

            // Rule matched
            return {
                ruleId: rule.id,
                replyTemplate: rule.replyTemplate,
                delay: rule.delay || 0
            };
        }

        return null;
    }

    /**
     * Track auto-reply sent
     * @private
     */
    async trackAutoReply(to, subject, messageId) {
        const key = `${to}_${subject}`;
        const history = this.autoReplyHistory.get(key) || [];

        history.push({
            messageId,
            timestamp: new Date().toISOString()
        });

        this.autoReplyHistory.set(key, history);
    }

    /**
     * Check if already replied
     * @private
     */
    hasAlreadyReplied(to, subject, timeWindow = 3600000) { // 1 hour default
        const key = `${to}_${subject}`;
        const history = this.autoReplyHistory.get(key) || [];

        const now = Date.now();
        return history.some(entry => {
            now - new Date(entry.timestamp).getTime() < timeWindow
        });
    }

    /**
     * Process auto-reply for incoming email
     * @param {Object} email - Incoming email
     * @returns {Promise<Object>} Auto-reply result
     */
    async processAutoReply(email) {
        try {
            if (!this.gmailClient) {
                throw new Error('Gmail not initialized');
            }

            console.log(`[Email] Processing auto-reply for: ${email.from}`);

            // Check if should auto-reply
            const rule = this.shouldAutoReply(email.from, email.subject, email.snippet || '');

            if (!rule) {
                return {
                    success: true,
                    autoReplied: false,
                    reason: 'No matching rule'
                };
            }

            // Check if already replied recently
            if (this.hasAlreadyReplied(email.from, email.subject, rule.timeWindow || 3600000)) {
                return {
                    success: true,
                    autoReplied: false,
                    reason: 'Already replied recently'
                };
            }

            // Wait for delay if specified
            if (rule.delay > 0) {
                console.log(`[Email] Waiting ${rule.delay}ms before auto-reply`);
                await new Promise(resolve => setTimeout(resolve, rule.delay));
            }

            // Build reply email
            const replyEmail = {
                to: email.from,
                subject: this.buildReplySubject(email.subject, rule.replyTemplate),
                text: this.buildReplyBody(email, rule.replyTemplate),
                html: this.buildReplyHTML(email, rule.replyTemplate),
                enableAutoReply: true
            };

            // Send reply
            const result = await this.sendEmail(replyEmail);

            // Track auto-reply
            await this.trackAutoReply(email.from, email.subject, result.messageId);

            return {
                success: true,
                autoReplied: true,
                messageId: result.messageId,
                ruleId: rule.ruleId
            };
        } catch (error) {
            console.error('[Email] Auto-reply error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Build reply subject
     * @private
     */
    buildReplySubject(originalSubject, template) {
        return template
            .replace('{subject}', originalSubject)
            .replace('{date}', new Date().toLocaleDateString());
    }

    /**
     * Build reply body
     * @private
     */
    buildReplyBody(email, template) {
        return template
            .replace('{sender}', email.from || 'Sender')
            .replace('{date}', new Date().toLocaleDateString())
            .replace('{time}', new Date().toLocaleTimeString())
            .replace('{original_body}', email.snippet || '');
    }

    /**
     * Build reply HTML
     * @private
     */
    buildReplyHTML(email, template) {
        const textBody = this.buildReplyBody(email, template);
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #f4f4f4; padding: 20px; border-radius: 8px;">
                    <h2 style="color: #333; margin-top: 0;">Auto-Reply</h2>
                    <p style="color: #666; line-height: 1.6;">${textBody.replace(/\n/g, '<br>')}</p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px;">This is an automated response.</p>
                </div>
            </div>
        `;
    }

    // ==================== SEARCH ====================

    /**
     * Search emails
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {Promise<Object>} Search result
     */
    async searchEmails(query, options = {}) {
        try {
            if (!this.gmailClient) {
                throw new Error('Gmail not initialized');
            }

            console.log(`[Email] Searching: ${query}`);

            const response = await this.gmailClient.users.messages.list({
                userId: 'me',
                q: query,
                maxResults: options.maxResults || 10,
                includeSpamTrash: options.includeSpamTrash || false
            });

            const messages = response.data.messages || [];

            return {
                success: true,
                messages,
                nextPageToken: response.data.nextPageToken,
                resultSizeEstimate: response.data.resultSizeEstimate
            };
        } catch (error) {
            console.error('[Email] Search error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get thread
     * @param {string} threadId - Thread ID
     * @returns {Promise<Object>} Thread result
     */
    async getThread(threadId) {
        try {
            if (!this.gmailClient) {
                throw new Error('Gmail not initialized');
            }

            console.log(`[Email] Getting thread: ${threadId}`);

            const response = await this.gmailClient.users.threads.get({
                userId: 'me',
                id: threadId
            });

            return {
                success: true,
                thread: response.data
            };
        } catch (error) {
            console.error('[Email] Get thread error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Cleanup
     */
    async cleanup() {
        console.log('[Email] Cleaning up');

        // Clear caches
        this.labelCache.clear();
        this.autoReplyRules.clear();
        this.autoReplyHistory.clear();

        // Gmail cleanup is automatic with auth library
        this.gmailClient = null;
        this.gmailAuth = null;
    }
}

// Export singleton instance
const emailAutomationService = new EmailAutomationService();
module.exports = emailAutomationService;
