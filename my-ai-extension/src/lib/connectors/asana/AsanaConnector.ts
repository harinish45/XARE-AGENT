/**
 * Asana Connector
 * Integrates with Asana API for project management and task tracking
 */

import { BaseConnector } from '../BaseConnector';

export interface AsanaWorkspace {
    gid: string;
    name: string;
    resource_type: 'workspace' | 'organization';
}

export interface AsanaProject {
    gid: string;
    name: string;
    owner?: AsanaUser;
    workspace?: AsanaWorkspace;
    team?: AsanaTeam;
    archived: boolean;
    public: boolean;
    color?: string;
    created_at: string;
    modified_at: string;
    due_date?: string;
    start_on?: string;
    current_status?: AsanaProjectStatus;
}

export interface AsanaProjectStatus {
    gid: string;
    title: string;
    text: string;
    color: string;
    created_at: string;
    created_by: AsanaUser;
}

export interface AsanaTask {
    gid: string;
    name: string;
    notes?: string;
    completed: boolean;
    completed_at?: string;
    due_on?: string;
    due_at?: string;
    created_at: string;
    modified_at: string;
    assignee?: AsanaUser;
    assignee_status?: 'inbox' | 'today' | 'upcoming' | 'later';
    projects?: AsanaProject[];
    memberships?: AsanaMembership[];
    tags?: AsanaTag[];
    parent?: AsanaTask;
    followers?: AsanaUser[];
    liked?: boolean;
    likes?: AsanaLike[];
    num_likes: number;
    num_subtasks: number;
    start_on?: string;
    custom_fields?: AsanaCustomField[];
}

export interface AsanaMembership {
    project?: AsanaProject;
    section?: AsanaSection;
}

export interface AsanaSection {
    gid: string;
    name: string;
    project?: AsanaProject;
    created_at: string;
}

export interface AsanaUser {
    gid: string;
    name: string;
    email?: string;
    photo?: { image_21x21: string; image_27x27: string; image_36x36: string; image_60x60: string; image_128x128: string };
    resource_type: 'user';
}

export interface AsanaTeam {
    gid: string;
    name: string;
    organization?: AsanaWorkspace;
}

export interface AsanaTag {
    gid: string;
    name: string;
    color?: string;
    notes?: string;
}

export interface AsanaLike {
    gid: string;
    user: AsanaUser;
    created_at: string;
}

export interface AsanaCustomField {
    gid: string;
    name: string;
    type: 'text' | 'number' | 'enum' | 'multi_enum' | 'date' | 'currency' | 'checkbox';
    text_value?: string;
    number_value?: number;
    enum_value?: { gid: string; name: string; enabled: boolean; color?: string };
    multi_enum_values?: Array<{ gid: string; name: string; enabled: boolean; color?: string }>;
    date_value?: { date: string; date_time?: string };
    checkbox_value?: boolean;
}

export interface AsanaStory {
    gid: string;
    created_at: string;
    created_by: AsanaUser;
    type: 'comment' | 'system';
    text?: string;
    html_text?: string;
    is_pinned: boolean;
    target?: AsanaTask;
}

export class AsanaConnector extends BaseConnector {
    private accessToken: string | null = null;
    private readonly apiBase = 'https://app.asana.com/api/1.0';

    constructor() {
        super('asana');
    }

    /**
     * Authenticate with Asana using OAuth token
     * @param accessToken - OAuth access token
     */
    async authenticate(accessToken: string): Promise<void> {
        this.accessToken = accessToken;
        this.isAuthenticated = true;
    }

    /**
     * Get authenticated user's workspaces
     * @returns Array of workspaces
     */
    async getWorkspaces(): Promise<AsanaWorkspace[]> {
        if (!this.isAuthenticated || !this.accessToken) {
            throw new Error('Not authenticated with Asana');
        }

        const response = await fetch(`${this.apiBase}/workspaces`, {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Failed to get workspaces: ${data.errors?.[0]?.message || data.message}`);
        }

        return data.data || [];
    }

    /**
     * Get projects in a workspace
     * @param workspaceId - Workspace ID
     * @returns Array of projects
     */
    async getProjects(workspaceId: string): Promise<AsanaProject[]> {
        if (!this.isAuthenticated || !this.accessToken) {
            throw new Error('Not authenticated with Asana');
        }

        const params = new URLSearchParams({
            workspace: workspaceId,
            opt_fields: 'gid,name,owner,archived,color,created_at,modified_at,due_date,current_status'
        });

        const response = await fetch(`${this.apiBase}/projects?${params}`, {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Failed to get projects: ${data.errors?.[0]?.message || data.message}`);
        }

        return data.data || [];
    }

    /**
     * Get tasks in a project
     * @param projectId - Project ID
     * @returns Array of tasks
     */
    async getProjectTasks(projectId: string): Promise<AsanaTask[]> {
        if (!this.isAuthenticated || !this.accessToken) {
            throw new Error('Not authenticated with Asana');
        }

        const params = new URLSearchParams({
            project: projectId,
            opt_fields: 'gid,name,notes,completed,due_on,assignee,created_at,modified_at,memberships,tags,parent,followers,num_likes,num_subtasks',
            opt_expand: 'parent,memberships.project'
        });

        const response = await fetch(`${this.apiBase}/tasks?${params}`, {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Failed to get tasks: ${data.errors?.[0]?.message || data.message}`);
        }

        return data.data || [];
    }

    /**
     * Get a specific task by ID
     * @param taskId - Task ID
     * @returns Task details
     */
    async getTask(taskId: string): Promise<AsanaTask> {
        if (!this.isAuthenticated || !this.accessToken) {
            throw new Error('Not authenticated with Asana');
        }

        const params = new URLSearchParams({
            opt_fields: 'gid,name,notes,completed,completed_at,due_on,due_at,created_at,modified_at,assignee,assignee_status,projects,memberships,tags,parent,followers,liked,likes,num_likes,num_subtasks,start_on,custom_fields',
            opt_expand: 'parent,memberships.project'
        });

        const response = await fetch(`${this.apiBase}/tasks/${taskId}?${params}`, {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Failed to get task: ${data.errors?.[0]?.message || data.message}`);
        }

        return data.data;
    }

    /**
     * Create a new task
     * @param project - Project ID
     * @param name - Task name
     * @param options - Optional task properties
     * @returns Created task
     */
    async createTask(
        project: string,
        name: string,
        options?: {
            notes?: string;
            due_on?: string;
            assignee?: string;
            followers?: string[];
            parent?: string;
        }
    ): Promise<AsanaTask> {
        if (!this.isAuthenticated || !this.accessToken) {
            throw new Error('Not authenticated with Asana');
        }

        const body: any = {
            name,
            projects: [project]
        };

        if (options?.notes) body.notes = options.notes;
        if (options?.due_on) body.due_on = options.due_on;
        if (options?.assignee) body.assignee = options.assignee;
        if (options?.followers) body.followers = options.followers;
        if (options?.parent) body.parent = options.parent;

        const response = await fetch(`${this.apiBase}/tasks`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Failed to create task: ${data.errors?.[0]?.message || data.message}`);
        }

        return data.data;
    }

    /**
     * Update a task
     * @param taskId - Task ID
     * @param updates - Fields to update
     * @returns Updated task
     */
    async updateTask(
        taskId: string,
        updates: {
            name?: string;
            notes?: string;
            completed?: boolean;
            due_on?: string;
            assignee?: string;
        }
    ): Promise<AsanaTask> {
        if (!this.isAuthenticated || !this.accessToken) {
            throw new Error('Not authenticated with Asana');
        }

        const response = await fetch(`${this.apiBase}/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updates)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Failed to update task: ${data.errors?.[0]?.message || data.message}`);
        }

        return data.data;
    }

    /**
     * Delete a task
     * @param taskId - Task ID
     * @returns True if successful
     */
    async deleteTask(taskId: string): Promise<boolean> {
        if (!this.isAuthenticated || !this.accessToken) {
            throw new Error('Not authenticated with Asana');
        }

        const response = await fetch(`${this.apiBase}/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            }
        });

        return response.ok;
    }

    /**
     * Add a comment to a task
     * @param taskId - Task ID
     * @param text - Comment text
     * @returns Created story
     */
    async addComment(taskId: string, text: string): Promise<AsanaStory> {
        if (!this.isAuthenticated || !this.accessToken) {
            throw new Error('Not authenticated with Asana');
        }

        const response = await fetch(`${this.apiBase}/tasks/${taskId}/stories`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Failed to add comment: ${data.errors?.[0]?.message || data.message}`);
        }

        return data.data;
    }

    /**
     * Get task comments/stories
     * @param taskId - Task ID
     * @returns Array of stories
     */
    async getTaskStories(taskId: string): Promise<AsanaStory[]> {
        if (!this.isAuthenticated || !this.accessToken) {
            throw new Error('Not authenticated with Asana');
        }

        const params = new URLSearchParams({
            type: 'comment'
        });

        const response = await fetch(`${this.apiBase}/tasks/${taskId}/stories?${params}`, {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Failed to get stories: ${data.errors?.[0]?.message || data.message}`);
        }

        return data.data || [];
    }

    /**
     * Get sections in a project
     * @param projectId - Project ID
     * @returns Array of sections
     */
    async getProjectSections(projectId: string): Promise<AsanaSection[]> {
        if (!this.isAuthenticated || !this.accessToken) {
            throw new Error('Not authenticated with Asana');
        }

        const response = await fetch(`${this.apiBase}/projects/${projectId}/sections`, {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Failed to get sections: ${data.errors?.[0]?.message || data.message}`);
        }

        return data.data || [];
    }

    /**
     * Move task to a section
     * @param taskId - Task ID
     * @param sectionId - Section ID
     * @param insertBefore - Task GID to insert before (optional)
     * @param insertAfter - Task GID to insert after (optional)
     * @returns True if successful
     */
    async moveTaskToSection(
        taskId: string,
        sectionId: string,
        insertBefore?: string,
        insertAfter?: string
    ): Promise<boolean> {
        if (!this.isAuthenticated || !this.accessToken) {
            throw new Error('Not authenticated with Asana');
        }

        const body: any = { section: sectionId };
        if (insertBefore) body.insert_before = insertBefore;
        if (insertAfter) body.insert_after = insertAfter;

        const response = await fetch(`${this.apiBase}/sections/${sectionId}/addTask`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        return response.ok;
    }

    /**
     * Like a task
     * @param taskId - Task ID
     * @returns True if successful
     */
    async likeTask(taskId: string): Promise<boolean> {
        if (!this.isAuthenticated || !this.accessToken) {
            throw new Error('Not authenticated with Asana');
        }

        const response = await fetch(`${this.apiBase}/tasks/${taskId}/addLike`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            }
        });

        return response.ok;
    }

    /**
     * Get user info
     * @param userId - User ID ('me' for current user)
     * @returns User details
     */
    async getUser(userId: string = 'me'): Promise<AsanaUser> {
        if (!this.isAuthenticated || !this.accessToken) {
            throw new Error('Not authenticated with Asana');
        }

        const params = new URLSearchParams({
            opt_fields: 'gid,name,email,photo'
        });

        const response = await fetch(`${this.apiBase}/users/${userId}?${params}`, {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Failed to get user: ${data.errors?.[0]?.message || data.message}`);
        }

        return data.data;
    }
}
