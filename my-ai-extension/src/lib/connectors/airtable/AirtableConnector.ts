/**
 * Airtable Connector
 * Integrates with Airtable API for database operations
 */

import { BaseConnector } from '../BaseConnector';

export interface AirtableRecord {
    id: string;
    fields: Record<string, any>;
    createdTime?: string;
}

export interface AirtableTable {
    id: string;
    name: string;
    primaryFieldId: string;
    fields: AirtableField[];
    views: AirtableView[];
}

export interface AirtableField {
    id: string;
    name: string;
    type: string;
    description?: string;
}

export interface AirtableView {
    id: string;
    name: string;
    type: string;
}

export interface AirtableQuery {
    maxRecords?: number;
    filterByFormula?: string;
    sort?: Array<{ field: string; direction?: 'asc' | 'desc' }>;
    view?: string;
    offset?: string;
}

export class AirtableConnector extends BaseConnector {
    private apiKey: string | null = null;
    private baseId: string | null = null;
    private readonly apiBase = 'https://api.airtable.com/v0';

    constructor() {
        super('airtable');
    }

    /**
     * Authenticate with Airtable using API key
     * @param apiKey - Airtable API key
     * @param baseId - Airtable base ID
     */
    async authenticate(apiKey: string, baseId: string): Promise<void> {
        this.apiKey = apiKey;
        this.baseId = baseId;
        this.isAuthenticated = true;
    }

    /**
     * List all tables in the base
     * @returns Array of tables
     */
    async listTables(): Promise<AirtableTable[]> {
        if (!this.isAuthenticated || !this.apiKey || !this.baseId) {
            throw new Error('Not authenticated with Airtable');
        }

        const response = await fetch(`${this.apiBase}/meta/bases/${this.baseId}/tables`, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Failed to list tables: ${data.error?.message || data.message}`);
        }

        return data.tables || [];
    }

    /**
     * List records from a table
     * @param tableName - Table name or ID
     * @param query - Query parameters
     * @returns Array of records
     */
    async listRecords(tableName: string, query: AirtableQuery = {}): Promise<AirtableRecord[]> {
        if (!this.isAuthenticated || !this.apiKey || !this.baseId) {
            throw new Error('Not authenticated with Airtable');
        }

        const params = new URLSearchParams();
        if (query.maxRecords) params.append('maxRecords', query.maxRecords.toString());
        if (query.filterByFormula) params.append('filterByFormula', query.filterByFormula);
        if (query.view) params.append('view', query.view);
        if (query.offset) params.append('offset', query.offset);
        
        if (query.sort) {
            query.sort.forEach((s, index) => {
                params.append(`sort[${index}][field]`, s.field);
                if (s.direction) params.append(`sort[${index}][direction]`, s.direction);
            });
        }

        const allRecords: AirtableRecord[] = [];
        let url = `${this.apiBase}/${this.baseId}/${tableName}?${params.toString()}`;

        while (url) {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(`Failed to list records: ${data.error?.message || data.message}`);
            }

            allRecords.push(...(data.records || []));
            url = data.offset ? `${url.split('?')[0]}?offset=${data.offset}` : null;
        }

        return allRecords;
    }

    /**
     * Get a single record by ID
     * @param tableName - Table name or ID
     * @param recordId - Record ID
     * @returns Record
     */
    async getRecord(tableName: string, recordId: string): Promise<AirtableRecord> {
        if (!this.isAuthenticated || !this.apiKey || !this.baseId) {
            throw new Error('Not authenticated with Airtable');
        }

        const response = await fetch(`${this.apiBase}/${this.baseId}/${tableName}/${recordId}`, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Failed to get record: ${data.error?.message || data.message}`);
        }

        return data;
    }

    /**
     * Create a new record
     * @param tableName - Table name or ID
     * @param fields - Record fields
     * @returns Created record
     */
    async createRecord(tableName: string, fields: Record<string, any>): Promise<AirtableRecord> {
        if (!this.isAuthenticated || !this.apiKey || !this.baseId) {
            throw new Error('Not authenticated with Airtable');
        }

        const response = await fetch(`${this.apiBase}/${this.baseId}/${tableName}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fields
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Failed to create record: ${data.error?.message || data.message}`);
        }

        return data;
    }

    /**
     * Update a record
     * @param tableName - Table name or ID
     * @param recordId - Record ID
     * @param fields - Fields to update
     * @returns Updated record
     */
    async updateRecord(tableName: string, recordId: string, fields: Record<string, any>): Promise<AirtableRecord> {
        if (!this.isAuthenticated || !this.apiKey || !this.baseId) {
            throw new Error('Not authenticated with Airtable');
        }

        const response = await fetch(`${this.apiBase}/${this.baseId}/${tableName}/${recordId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fields
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Failed to update record: ${data.error?.message || data.message}`);
        }

        return data;
    }

    /**
     * Delete a record
     * @param tableName - Table name or ID
     * @param recordId - Record ID
     * @returns True if successful
     */
    async deleteRecord(tableName: string, recordId: string): Promise<boolean> {
        if (!this.isAuthenticated || !this.apiKey || !this.baseId) {
            throw new Error('Not authenticated with Airtable');
        }

        const response = await fetch(`${this.apiBase}/${this.baseId}/${tableName}/${recordId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Failed to delete record: ${data.error?.message || data.message}`);
        }

        return data.deleted || false;
    }

    /**
     * Bulk create records
     * @param tableName - Table name or ID
     * @param records - Array of field objects
     * @returns Created records
     */
    async bulkCreateRecords(tableName: string, records: Array<Record<string, any>>): Promise<AirtableRecord[]> {
        if (!this.isAuthenticated || !this.apiKey || !this.baseId) {
            throw new Error('Not authenticated with Airtable');
        }

        const allCreated: AirtableRecord[] = [];
        
        // Airtable limits to 10 records per request
        for (let i = 0; i < records.length; i += 10) {
            const batch = records.slice(i, i + 10);
            
            const response = await fetch(`${this.apiBase}/${this.baseId}/${tableName}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    records: batch.map(fields => ({ fields }))
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(`Failed to bulk create records: ${data.error?.message || data.message}`);
            }

            allCreated.push(...data.records);
        }

        return allCreated;
    }

    /**
     * Search records by field value
     * @param tableName - Table name or ID
     * @param fieldName - Field name to search
     * @param value - Value to search for
     * @returns Matching records
     */
    async searchRecords(tableName: string, fieldName: string, value: string): Promise<AirtableRecord[]> {
        const filterByFormula = `FIND("${value}", {${fieldName}})`;
        return this.listRecords(tableName, { filterByFormula });
    }
}
