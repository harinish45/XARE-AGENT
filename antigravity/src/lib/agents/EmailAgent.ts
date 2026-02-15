// Email Agent - Handles all email-related tasks
// Composes, sends, reads, and manages emails

import { ParsedIntent } from './IntentParser';
import { Agent, AgentResult } from './AgentRouter';

export interface Email {
    id: string;
    from: string;
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    htmlBody?: string;
    attachments?: Attachment[];
    date: Date;
    read: boolean;
    starred: boolean;
    labels: string[];
    threadId?: string;
}

export interface Attachment {
    filename: string;
    mimeType: string;
    size: number;
    content?: Buffer;
    url?: string;
}

export interface EmailDraft {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    htmlBody?: string;
    attachments?: Attachment[];
}

export interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
    variables: string[];
}

export interface EmailAgentConfig {
    provider: 'gmail' | 'outlook' | 'smtp';
    defaultFrom?: string;
    signature?: string;
    templates?: EmailTemplate[];
}

// Email templates
const defaultTemplates: EmailTemplate[] = [
    {
        id: 'meeting-request',
        name: 'Meeting Request',
        subject: 'Meeting Request: {{topic}}',
        body: `Hi {{name}},

I hope this email finds you well. I would like to schedule a meeting to discuss {{topic}}.

Would you be available on {{date}} at {{time}}?

Best regards,
{{signature}}`,
        variables: ['name', 'topic', 'date', 'time', 'signature'],
    },
    {
        id: 'follow-up',
        name: 'Follow Up',
        subject: 'Following up on {{topic}}',
        body: `Hi {{name}},

I wanted to follow up on our previous conversation about {{topic}}.

{{message}}

Please let me know if you have any questions.

Best regards,
{{signature}}`,
        variables: ['name', 'topic', 'message', 'signature'],
    },
    {
        id: 'thank-you',
        name: 'Thank You',
        subject: 'Thank you for {{reason}}',
        body: `Hi {{name}},

Thank you so much for {{reason}}. I really appreciate it.

{{additional_message}}

Best regards,
{{signature}}`,
        variables: ['name', 'reason', 'additional_message', 'signature'],
    },
];

export class EmailAgent {
    private config: EmailAgentConfig;
    private drafts: Map<string, EmailDraft> = new Map();
    private templates: Map<string, EmailTemplate> = new Map();

    constructor(config: EmailAgentConfig) {
        this.config = config;

        // Initialize templates
        defaultTemplates.forEach(template => {
            this.templates.set(template.id, template);
        });

        if (config.templates) {
            config.templates.forEach(template => {
                this.templates.set(template.id, template);
            });
        }
    }

    // Main execution method
    async execute(intent: ParsedIntent, agent: Agent): Promise<AgentResult> {
        const startTime = Date.now();

        try {
            let result: any;

            switch (intent.primaryIntent) {
                case 'compose_email':
                    result = await this.composeEmail(intent.parameters);
                    break;
                case 'send_email':
                    result = await this.sendEmail(intent.parameters);
                    break;
                default:
                    // Handle as general email task
                    result = await this.handleGeneralEmailTask(intent);
            }

            return {
                success: true,
                agentId: agent.id,
                action: intent.action,
                output: result,
                duration: Date.now() - startTime,
            };
        } catch (error) {
            return {
                success: false,
                agentId: agent.id,
                action: intent.action,
                output: null,
                error: error instanceof Error ? error.message : 'Unknown error',
                duration: Date.now() - startTime,
            };
        }
    }

    // Compose email
    async composeEmail(params: Record<string, any>): Promise<{
        draftId: string;
        email: EmailDraft;
        preview: string;
    }> {
        const draftId = `draft_${Date.now()}`;

        // Extract parameters
        const to = params.to ? [params.to] : params.toList || [];
        const subject = params.subject || this.generateSubject(params);
        const body = params.body || await this.generateEmailBody(params);

        const draft: EmailDraft = {
            to,
            cc: params.cc,
            bcc: params.bcc,
            subject,
            body,
            htmlBody: params.htmlBody || this.textToHtml(body),
            attachments: params.attachments,
        };

        // Store draft
        this.drafts.set(draftId, draft);

        return {
            draftId,
            email: draft,
            preview: this.generatePreview(draft),
        };
    }

    // Send email
    async sendEmail(params: Record<string, any>): Promise<{
        messageId: string;
        status: string;
        sentAt: Date;
    }> {
        const draftId = params.draftId;

        let draft: EmailDraft;

        if (draftId && this.drafts.has(draftId)) {
            draft = this.drafts.get(draftId)!;
        } else {
            // Create from params
            draft = {
                to: params.to ? [params.to] : params.toList || [],
                cc: params.cc,
                bcc: params.bcc,
                subject: params.subject || '(No Subject)',
                body: params.body || '',
            };
        }

        // Validate
        if (draft.to.length === 0) {
            throw new Error('No recipient specified');
        }

        // In a real implementation, this would call the email provider API
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Remove draft after sending
        if (draftId) {
            this.drafts.delete(draftId);
        }

        return {
            messageId,
            status: 'sent',
            sentAt: new Date(),
        };
    }

    // Generate email body using AI
    private async generateEmailBody(params: Record<string, any>): Promise<string> {
        const { tone = 'professional', purpose, context, keyPoints } = params;

        // Build email based on purpose
        let body = '';

        if (purpose === 'meeting') {
            body = this.generateMeetingEmail(params);
        } else if (purpose === 'follow_up') {
            body = this.generateFollowUpEmail(params);
        } else if (purpose === 'introduction') {
            body = this.generateIntroductionEmail(params);
        } else if (purpose === 'request') {
            body = this.generateRequestEmail(params);
        } else {
            body = this.generateGenericEmail(params);
        }

        // Add signature
        if (this.config.signature) {
            body += `\n\n${this.config.signature}`;
        }

        return body;
    }

    // Generate meeting email
    private generateMeetingEmail(params: Record<string, any>): string {
        const { recipientName = 'there', topic, date, time, duration = '30 minutes' } = params;

        return `Hi ${recipientName},

I hope this email finds you well. I would like to schedule a meeting${topic ? ` to discuss ${topic}` : ''}.

Would you be available on ${date || 'a date that works for you'}${time ? ` at ${time}` : ''}? I expect the meeting to take approximately ${duration}.

Please let me know what works best for your schedule.

Looking forward to hearing from you.`;
    }

    // Generate follow-up email
    private generateFollowUpEmail(params: Record<string, any>): string {
        const { recipientName = 'there', previousTopic, additionalInfo } = params;

        return `Hi ${recipientName},

I wanted to follow up on our previous conversation${previousTopic ? ` about ${previousTopic}` : ''}.

${additionalInfo || 'I wanted to check if there are any updates or if you need any additional information from my end.'}

Please let me know how you'd like to proceed.`;
    }

    // Generate introduction email
    private generateIntroductionEmail(params: Record<string, any>): string {
        const { recipientName = 'there', senderName, company, purpose } = params;

        return `Hi ${recipientName},

I hope this email finds you well. My name is ${senderName || 'I am'}${company ? ` from ${company}` : ''}.

${purpose || 'I wanted to reach out to introduce myself and explore potential opportunities for collaboration.'}

I would love to schedule a brief call to discuss further. Please let me know if you'd be interested.

Thank you for your time.`;
    }

    // Generate request email
    private generateRequestEmail(params: Record<string, any>): string {
        const { recipientName = 'there', requestType, details, deadline } = params;

        return `Hi ${recipientName},

I hope you're doing well.

I am writing to request ${requestType || 'your assistance'}.

${details || 'Please let me know if you need any additional information from my end.'}

${deadline ? `I would appreciate it if you could get back to me by ${deadline}.` : 'Looking forward to your response.'}

Thank you in advance for your help.`;
    }

    // Generate generic email
    private generateGenericEmail(params: Record<string, any>): string {
        const { recipientName = 'there', message, context } = params;

        return `Hi ${recipientName},

${context ? `${context}\n\n` : ''}${message || 'I wanted to reach out to you. Please let me know if you have any questions.'}

Best regards.`;
    }

    // Generate subject line
    private generateSubject(params: Record<string, any>): string {
        const { purpose, topic } = params;

        const subjectMap: Record<string, string> = {
            meeting: `Meeting Request${topic ? `: ${topic}` : ''}`,
            follow_up: `Following up${topic ? ` on ${topic}` : ''}`,
            introduction: 'Introduction',
            request: `Request: ${topic || 'Your Assistance'}`,
        };

        return subjectMap[purpose] || topic || 'No Subject';
    }

    // Convert text to HTML
    private textToHtml(text: string): string {
        return text
            .split('\n')
            .map(line => `<p>${line || '&nbsp;'}</p>`)
            .join('');
    }

    // Generate preview
    private generatePreview(draft: EmailDraft): string {
        const to = draft.to.join(', ');
        const subject = draft.subject;
        const bodyPreview = draft.body.substring(0, 100);

        return `To: ${to}\nSubject: ${subject}\n\n${bodyPreview}...`;
    }

    // Handle general email task
    private async handleGeneralEmailTask(intent: ParsedIntent): Promise<any> {
        const input = intent.rawInput.toLowerCase();

        if (input.includes('read') || input.includes('check')) {
            return this.checkEmails();
        }
        if (input.includes('search') || input.includes('find')) {
            return this.searchEmails(intent.parameters.query || '');
        }
        if (input.includes('template')) {
            return this.listTemplates();
        }

        return {
            message: 'Email task processed',
            suggestions: [
                'Compose a new email',
                'Check inbox',
                'Search emails',
                'Use a template',
            ],
        };
    }

    // Check emails (mock implementation)
    private async checkEmails(): Promise<{
        count: number;
        unread: number;
        recent: Email[];
    }> {
        // In real implementation, this would fetch from email provider
        return {
            count: 0,
            unread: 0,
            recent: [],
        };
    }

    // Search emails (mock implementation)
    private async searchEmails(query: string): Promise<Email[]> {
        // In real implementation, this would search via email provider API
        return [];
    }

    // List available templates
    listTemplates(): EmailTemplate[] {
        return Array.from(this.templates.values());
    }

    // Use template
    useTemplate(templateId: string, variables: Record<string, string>): EmailDraft {
        const template = this.templates.get(templateId);
        if (!template) {
            throw new Error(`Template not found: ${templateId}`);
        }

        let body = template.body;
        let subject = template.subject;

        // Replace variables
        Object.entries(variables).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            body = body.replace(regex, value);
            subject = subject.replace(regex, value);
        });

        return {
            to: [],
            subject,
            body,
        };
    }

    // Get draft
    getDraft(draftId: string): EmailDraft | undefined {
        return this.drafts.get(draftId);
    }

    // Update draft
    updateDraft(draftId: string, updates: Partial<EmailDraft>): boolean {
        const draft = this.drafts.get(draftId);
        if (!draft) return false;

        this.drafts.set(draftId, { ...draft, ...updates });
        return true;
    }

    // Delete draft
    deleteDraft(draftId: string): boolean {
        return this.drafts.delete(draftId);
    }

    // Get all drafts
    getAllDrafts(): Map<string, EmailDraft> {
        return new Map(this.drafts);
    }
}

// Export factory function
export function createEmailAgent(config?: Partial<EmailAgentConfig>): EmailAgent {
    return new EmailAgent({
        provider: config?.provider || 'gmail',
        defaultFrom: config?.defaultFrom,
        signature: config?.signature,
        templates: config?.templates,
    });
}
