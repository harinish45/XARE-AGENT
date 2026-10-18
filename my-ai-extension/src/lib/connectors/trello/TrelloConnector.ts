/**
 * Trello Connector
 * Integrates with Trello API for project management
 */

import { BaseConnector } from '../BaseConnector';

export interface TrelloBoard {
    id: string;
    name: string;
    desc?: string;
    closed: boolean;
    url: string;
}

export interface TrelloList {
    id: string;
    name: string;
    closed: boolean;
    idBoard: string;
    pos: number;
}

export interface TrelloCard {
    id: string;
    name: string;
    desc?: string;
    idList: string;
    idBoard: string;
    pos: number;
    closed: boolean;
    due?: string;
    labels?: TrelloLabel[];
    members?: TrelloMember[];
    checklists?: TrelloChecklist[];
}

export interface TrelloLabel {
    id: string;
    name: string;
    color: string;
}

export interface TrelloMember {
    id: string;
    username: string;
    fullName: string;
    avatarUrl?: string;
}

export interface TrelloChecklist {
    id: string;
    name: string;
    items: TrelloChecklistItem[];
}

export interface TrelloChecklistItem {
    id: string;
    name: string;
    state: 'complete' | 'incomplete';
    pos: number;
}

export interface TrelloAction {
    id: string;
    type: string;
    text: string;
    date: string;
    memberCreator?: TrelloMember;
}

export class TrelloConnector extends BaseConnector {
    private apiKey: string | null = null;
    private token: string | null = null;
    private readonly apiBase = 'https://api.trello.com/1';

    constructor() {
        super('trello');
    }

    /**
     * Authenticate with Trello using API key and token
     * @param apiKey - Trello API key
     * @param token - Trello OAuth token
     */
    async authenticate(apiKey: string, token: string): Promise<void> {
        this.apiKey = apiKey;
        this.token = token;
        this.isAuthenticated = true;
    }

    /**
     * Get authenticated user's boards
     * @returns Array of boards
     */
    async getBoards(): Promise<TrelloBoard[]> {
        if (!this.isAuthenticated || !this.apiKey || !this.token) {
            throw new Error('Not authenticated with Trello');
        }

        const params = new URLSearchParams({
            key: this.apiKey,
            token: this.token,
            filter: 'open'
        });

        const response = await fetch(`${this.apiBase}/members/me/boards?${params}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Failed to get boards: ${data.message}`);
        }

        return data;
    }

    /**
     * Get a specific board by ID
     * @param boardId - Board ID
     * @returns Board details
     */
    async getBoard(boardId: string): Promise<TrelloBoard> {
        if (!this.isAuthenticated || !this.apiKey || !this.token) {
            throw new Error('Not authenticated with Trello');
        }

        const params = new URLSearchParams({
            key: this.apiKey,
            token: this.token
        });

        const response = await fetch(`${this.apiBase}/boards/${boardId}?${params}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Failed to get board: ${data.message}`);
        }

        return data;
    }

    /**
     * Get lists on a board
     * @param boardId - Board ID
     * @returns Array of lists
     */
    async getLists(boardId: string): Promise<TrelloList[]> {
        if (!this.isAuthenticated || !this.apiKey || !this.token) {
            throw new Error('Not authenticated with Trello');
        }

        const params = new URLSearchParams({
            key: this.apiKey,
            token: this.token
        });

        const response = await fetch(`${this.apiBase}/boards/${boardId}/lists?${params}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Failed to get lists: ${data.message}`);
        }

        return data;
    }

    /**
     * Get cards in a list
     * @param listId - List ID
     * @returns Array of cards
     */
    async getCardsInList(listId: string): Promise<TrelloCard[]> {
        if (!this.isAuthenticated || !this.apiKey || !this.token) {
            throw new Error('Not authenticated with Trello');
        }

        const params = new URLSearchParams({
            key: this.apiKey,
            token: this.token,
            fields: 'all'
        });

        const response = await fetch(`${this.apiBase}/lists/${listId}/cards?${params}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Failed to get cards: ${data.message}`);
        }

        return data;
    }

    /**
     * Get all cards on a board
     * @param boardId - Board ID
     * @returns Array of cards
     */
    async getCardsOnBoard(boardId: string): Promise<TrelloCard[]> {
        if (!this.isAuthenticated || !this.apiKey || !this.token) {
            throw new Error('Not authenticated with Trello');
        }

        const params = new URLSearchParams({
            key: this.apiKey,
            token: this.token,
            fields: 'all'
        });

        const response = await fetch(`${this.apiBase}/boards/${boardId}/cards?${params}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Failed to get cards: ${data.message}`);
        }

        return data;
    }

    /**
     * Create a new card
     * @param idList - List ID to create card in
     * @param name - Card name
     * @param options - Optional card properties
     * @returns Created card
     */
    async createCard(
        idList: string,
        name: string,
        options?: { desc?: string; due?: string; idLabels?: string[] }
    ): Promise<TrelloCard> {
        if (!this.isAuthenticated || !this.apiKey || !this.token) {
            throw new Error('Not authenticated with Trello');
        }

        const params = new URLSearchParams({
            key: this.apiKey,
            token: this.token,
            idList,
            name
        });

        if (options?.desc) params.append('desc', options.desc);
        if (options?.due) params.append('due', options.due);
        if (options?.idLabels) params.append('idLabels', options.idLabels.join(','));

        const response = await fetch(`${this.apiBase}/cards`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: params.toString()
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Failed to create card: ${data.message}`);
        }

        return data;
    }

    /**
     * Update a card
     * @param cardId - Card ID
     * @param updates - Fields to update
     * @returns Updated card
     */
    async updateCard(
        cardId: string,
        updates: { name?: string; desc?: string; due?: string; idList?: string; closed?: boolean }
    ): Promise<TrelloCard> {
        if (!this.isAuthenticated || !this.apiKey || !this.token) {
            throw new Error('Not authenticated with Trello');
        }

        const params = new URLSearchParams({
            key: this.apiKey,
            token: this.token
        });

        Object.entries(updates).forEach(([key, value]) => {
            if (value !== undefined) params.append(key, String(value));
        });

        const response = await fetch(`${this.apiBase}/cards/${cardId}?${params}`, {
            method: 'PUT'
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Failed to update card: ${data.message}`);
        }

        return data;
    }

    /**
     * Delete a card
     * @param cardId - Card ID
     * @returns True if successful
     */
    async deleteCard(cardId: string): Promise<boolean> {
        if (!this.isAuthenticated || !this.apiKey || !this.token) {
            throw new Error('Not authenticated with Trello');
        }

        const params = new URLSearchParams({
            key: this.apiKey,
            token: this.token
        });

        const response = await fetch(`${this.apiBase}/cards/${cardId}?${params}`, {
            method: 'DELETE'
        });

        return response.ok;
    }

    /**
     * Add a comment to a card
     * @param cardId - Card ID
     * @param text - Comment text
     * @returns Action object
     */
    async addComment(cardId: string, text: string): Promise<TrelloAction> {
        if (!this.isAuthenticated || !this.apiKey || !this.token) {
            throw new Error('Not authenticated with Trello');
        }

        const params = new URLSearchParams({
            key: this.apiKey,
            token: this.token,
            text
        });

        const response = await fetch(`${this.apiBase}/cards/${cardId}/actions/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: params.toString()
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Failed to add comment: ${data.message}`);
        }

        return data;
    }

    /**
     * Get card comments
     * @param cardId - Card ID
     * @returns Array of comment actions
     */
    async getCardComments(cardId: string): Promise<TrelloAction[]> {
        if (!this.isAuthenticated || !this.apiKey || !this.token) {
            throw new Error('Not authenticated with Trello');
        }

        const params = new URLSearchParams({
            key: this.apiKey,
            token: this.token,
            filter: 'commentCard'
        });

        const response = await fetch(`${this.apiBase}/cards/${cardId}/actions?${params}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Failed to get comments: ${data.message}`);
        }

        return data;
    }

    /**
     * Move card to another list
     * @param cardId - Card ID
     * @param listId - Target list ID
     * @param pos - Position in list (optional)
     * @returns Updated card
     */
    async moveCard(cardId: string, listId: string, pos?: number): Promise<TrelloCard> {
        return this.updateCard(cardId, { idList: listId, ...(pos !== undefined && { pos: String(pos) }) });
    }

    /**
     * Get recent activity on a board
     * @param boardId - Board ID
     * @param limit - Number of actions to retrieve
     * @returns Array of actions
     */
    async getBoardActivity(boardId: string, limit: number = 50): Promise<TrelloAction[]> {
        if (!this.isAuthenticated || !this.apiKey || !this.token) {
            throw new Error('Not authenticated with Trello');
        }

        const params = new URLSearchParams({
            key: this.apiKey,
            token: this.token,
            limit: limit.toString()
        });

        const response = await fetch(`${this.apiBase}/boards/${boardId}/actions?${params}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Failed to get activity: ${data.message}`);
        }

        return data;
    }
}
