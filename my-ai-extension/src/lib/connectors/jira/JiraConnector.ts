/**
 * Jira Connector
 * Integrates with Jira API for issue tracking and project management
 */

import { BaseConnector } from '../BaseConnector';

export interface JiraIssue {
    id: string;
    key: string;
    self: string;
    fields: JiraIssueFields;
}

export interface JiraIssueFields {
    summary: string;
    description?: string;
    status: JiraStatus;
    priority?: JiraPriority;
    assignee?: JiraUser;
    reporter: JiraUser;
    issuetype: JiraIssueType;
    project: JiraProject;
    created: string;
    updated: string;
    duedate?: string;
    labels?: string[];
    components?: JiraComponent[];
    fixVersions?: JiraVersion[];
    versions?: JiraVersion[];
    customfield_10002?: string; // Sprint field
}

export interface JiraStatus {
    id: string;
    name: string;
    statusCategory: { id: number; key: string; colorName: string };
}

export interface JiraPriority {
    id: string;
    name: string;
    iconUrl: string;
}

export interface JiraUser {
    accountId: string;
    displayName: string;
    emailAddress?: string;
    avatarUrls: { '48x48': string; '24x24': string; '16x16': string; '32x32': string };
    active: boolean;
}

export interface JiraIssueType {
    id: string;
    name: string;
    iconUrl: string;
    description: string;
}

export interface JiraProject {
    id: string;
    key: string;
    name: string;
    projectTypeKey: string;
    avatarUrls: { '48x48': string };
}

export interface JiraComponent {
    id: string;
    name: string;
    description?: string;
}

export interface JiraVersion {
    id: string;
    name: string;
    released: boolean;
    archived: boolean;
    releaseDate?: string;
}

export interface JiraComment {
    id: string;
    author: JiraUser;
    updateAuthor: JiraUser;
    body: string;
    created: string;
    updated: string;
}

export class JiraConnector extends BaseConnector {
    private apiToken: string | null = null;
    private email: string | null = null;
    private domain: string | null = null;
    private readonly apiBase: string = '';

    constructor() {
        super('jira');
    }

    async authenticate(apiToken: string, email: string, domain: string): Promise<void> {
        this.apiToken = apiToken;
        this.email = email;
        this.domain = domain;
        this.apiBase = `https://${domain}/rest/api/3`;
        this.isAuthenticated = true;
    }

    async getProjects(): Promise<JiraProject[]> {
        if (!this.isAuthenticated) throw new Error('Not authenticated with Jira');

        const response = await fetch(`${this.apiBase}/project/search`, {
            headers: {
                'Authorization': `Basic ${btoa(`${this.email}:${this.apiToken}`)}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        return data.values || [];
    }

    async getIssues(jql: string, maxResults: number = 50): Promise<JiraIssue[]> {
        if (!this.isAuthenticated) throw new Error('Not authenticated with Jira');

        const response = await fetch(`${this.apiBase}/search`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${btoa(`${this.email}:${this.apiToken}`)}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ jql, maxResults })
        });

        const data = await response.json();
        return data.issues || [];
    }

    async getIssue(issueIdOrKey: string): Promise<JiraIssue> {
        if (!this.isAuthenticated) throw new Error('Not authenticated with Jira');

        const response = await fetch(`${this.apiBase}/issue/${issueIdOrKey}`, {
            headers: {
                'Authorization': `Basic ${btoa(`${this.email}:${this.apiToken}`)}`,
                'Content-Type': 'application/json'
            }
        });

        return await response.json();
    }

    async createIssue(projectKey: string, summary: string, options?: {
        description?: string;
        issuetype?: string;
        priority?: string;
        assignee?: string;
        labels?: string[];
    }): Promise<JiraIssue> {
        if (!this.isAuthenticated) throw new Error('Not authenticated with Jira');

        const body: any = {
            fields: {
                project: { key: projectKey },
                summary,
                issuetype: { name: options?.issuetype || 'Task' },
                ...(options?.description && { description: options.description }),
                ...(options?.priority && { priority: { name: options.priority } }),
                ...(options?.assignee && { assignee: { id: options.assignee } }),
                ...(options?.labels && { labels: options.labels })
            }
        };

        const response = await fetch(`${this.apiBase}/issue`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${btoa(`${this.email}:${this.apiToken}`)}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        return await response.json();
    }

    async updateIssue(issueIdOrKey: string, updates: {
        summary?: string;
        description?: string;
        status?: string;
        priority?: string;
        assignee?: string;
        labels?: string[];
    }): Promise<void> {
        if (!this.isAuthenticated) throw new Error('Not authenticated with Jira');

        const fields: any = {};
        if (updates.summary) fields.summary = updates.summary;
        if (updates.description) fields.description = updates.description;
        if (updates.priority) fields.priority = { name: updates.priority };
        if (updates.assignee) fields.assignee = { id: updates.assignee };
        if (updates.labels) fields.labels = updates.labels;

        const body = { fields };

        await fetch(`${this.apiBase}/issue/${issueIdOrKey}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Basic ${btoa(`${this.email}:${this.apiToken}`)}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
    }

    async addComment(issueIdOrKey: string, body: string): Promise<JiraComment> {
        if (!this.isAuthenticated) throw new Error('Not authenticated with Jira');

        const response = await fetch(`${this.apiBase}/issue/${issueIdOrKey}/comment`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${btoa(`${this.email}:${this.apiToken}`)}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ body: { type: 'doc', version: 1, content: [{ type: 'paragraph', content: [{ type: 'text', text: body }] }] } })
        });

        return await response.json();
    }

    async getComments(issueIdOrKey: string): Promise<JiraComment[]> {
        if (!this.isAuthenticated) throw new Error('Not authenticated with Jira');

        const response = await fetch(`${this.apiBase}/issue/${issueIdOrKey}/comment`, {
            headers: {
                'Authorization': `Basic ${btoa(`${this.email}:${this.apiToken}`)}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        return data.comments || [];
    }

    async transitionIssue(issueIdOrKey: string, transitionId: string): Promise<void> {
        if (!this.isAuthenticated) throw new Error('Not authenticated with Jira');

        await fetch(`${this.apiBase}/issue/${issueIdOrKey}/transitions`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${btoa(`${this.email}:${this.apiToken}`)}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ transition: { id: transitionId } })
        });
    }

    async getTransitions(issueIdOrKey: string): Promise<any[]> {
        if (!this.isAuthenticated) throw new Error('Not authenticated with Jira');

        const response = await fetch(`${this.apiBase}/issue/${issueIdOrKey}/transitions`, {
            headers: {
                'Authorization': `Basic ${btoa(`${this.email}:${this.apiToken}`)}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        return data.transitions || [];
    }
}
