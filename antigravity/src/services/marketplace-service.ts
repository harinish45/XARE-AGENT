import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
} else {
    console.warn('Supabase URL or Key is missing. Marketplace features will be limited to mock data.');
}

export interface Node {
    id: string;
    type: string;
    name: string;
    icon: string;
    x: number;
    y: number;
    data?: any;
}

export interface Connection {
    id: string;
    source: string;
    target: string;
}

export interface Workflow {
    id: string;
    name: string;
    description: string;
    author: string;
    downloads: number;
    rating: number;
    category: string;
    tags: string[];
    nodes: Node[];
    connections: Connection[];
    created_at: string;
}

export interface MCPServer {
    id: string;
    name: string;
    icon: string;
    category: string;
    description: string;
    installed: boolean;
    downloads: number;
    rating: number;
}

interface FilterOptions {
    category?: string;
    search?: string;
    sort?: 'popular' | 'newest' | 'name';
}

/**
 * Fetch workflows from the marketplace
 */
export const getWorkflows = async (options: FilterOptions = {}): Promise<Workflow[]> => {
    if (!supabase) return getMockWorkflows();

    let query = supabase
        .from('workflows')
        .select('*');

    if (options.category && options.category !== 'all') {
        query = query.eq('category', options.category);
    }

    if (options.search) {
        query = query.ilike('name', `%${options.search}%`);
    }

    if (options.sort) {
        switch (options.sort) {
            case 'popular':
                query = query.order('downloads', { ascending: false });
                break;
            case 'newest':
                query = query.order('created_at', { ascending: false });
                break;
            case 'name':
                query = query.order('name', { ascending: true });
                break;
            default:
                query = query.order('created_at', { ascending: false });
        }
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching workflows:', error);
        return getMockWorkflows();
    }

    return data as Workflow[];
};

/**
 * Fetch a single workflow by ID
 */
export const getWorkflow = async (id: string): Promise<Workflow | null> => {
    if (!supabase) {
        const mocks = await getMockWorkflows();
        return mocks.find(w => w.id === id) || null;
    }

    const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching workflow:', error);
        return null;
    }

    return data as Workflow;
};

/**
 * Increment download count for a workflow
 */
export const incrementDownloads = async (id: string): Promise<boolean> => {
    if (!supabase) return true;

    const { error } = await supabase.rpc('increment_downloads', { workflow_id: id });

    if (error) {
        console.error('Error incrementing downloads:', error);
        return false;
    }

    return true;
};

/**
 * Publish a new workflow to the marketplace
 */
export const publishWorkflow = async (workflow: Omit<Workflow, 'id' | 'created_at' | 'downloads' | 'rating'>): Promise<Workflow> => {
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase
        .from('workflows')
        .insert([workflow])
        .select();

    if (error) {
        throw error;
    }

    return data[0] as Workflow;
};

// Mock data fallback
const getMockWorkflows = async (): Promise<Workflow[]> => {
    return [
        {
            id: 'wf_daily_standup',
            name: 'Daily Standup Report',
            description: 'Automates the collection of daily standup updates from the team via Slack and compiles them into a summary email.',
            author: 'Antigravity Team',
            downloads: 1250,
            rating: 4.8,
            category: 'productivity',
            tags: ['slack', 'email', 'reporting'],
            nodes: [
                { id: '1', type: 'trigger', name: 'Schedule (9 AM)', icon: '⏰', x: 100, y: 100 },
                { id: '2', type: 'mcp', name: 'Slack', icon: '💬', x: 300, y: 100 },
                { id: '3', type: 'action', name: 'AI Summarize', icon: '🤖', x: 500, y: 100 },
                { id: '4', type: 'mcp', name: 'Gmail', icon: '📧', x: 700, y: 100 }
            ],
            connections: [
                { id: 'c1', source: '1', target: '2' },
                { id: 'c2', source: '2', target: '3' },
                { id: 'c3', source: '3', target: '4' }
            ],
            created_at: new Date().toISOString()
        },
        {
            id: 'wf_invoice_processor',
            name: 'Invoice Processing Pipeline',
            description: 'Automatically extracts data from invoice PDFs received in email and updates the accounting spreadsheet.',
            author: 'FinTech Solutions',
            downloads: 890,
            rating: 4.5,
            category: 'business',
            tags: ['finance', 'ocr', 'sheets'],
            nodes: [],
            connections: [],
            created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
            id: 'wf_social_monitor',
            name: 'Social Media Monitor',
            description: 'Monitors Twitter and Reddit for brand mentions and posts alerts to a Discord channel.',
            author: 'MarketingWiz',
            downloads: 2100,
            rating: 4.9,
            category: 'marketing',
            tags: ['social-media', 'monitoring', 'discord'],
            nodes: [],
            connections: [],
            created_at: new Date(Date.now() - 172800000).toISOString()
        }
    ];
};
