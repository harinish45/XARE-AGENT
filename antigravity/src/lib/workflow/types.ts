import { z } from 'zod';

// --- Core Enums ---

export enum NodeType {
    TRIGGER = 'trigger',
    ACTION_LLM = 'action_llm',
    ACTION_BROWSER = 'action_browser',
    ACTION_HTTP = 'action_http',
    CONTROL_IF = 'control_if',
    CONTROL_LOOP = 'control_loop',
    VARIABLE_SET = 'variable_set',
}

export enum TriggerType {
    MANUAL = 'manual',
    SCHEDULE = 'schedule',
    WEBHOOK = 'webhook',
    BROWSER_EVENT = 'browser_event',
}

export enum BrowserAction {
    NAVIGATE = 'navigate',
    CLICK = 'click',
    TYPE = 'type',
    EXTRACT_TEXT = 'extract_text',
    EXTRACT_HTML = 'extract_html',
    SCREENSHOT = 'screenshot',
    EXECUTE_SCRIPT = 'execute_script',
}

export enum LLMProvider {
    OPENAI = 'openai',
    ANTHROPIC = 'anthropic',
    OLLAMA = 'ollama', // Local execution
    GROQ = 'groq',
    GOOGLE = 'google',
}

// --- Node Data Interfaces ---

// base interface for all node data
export interface BaseNodeData {
    label?: string;
    description?: string;
}

export interface TriggerData extends BaseNodeData {
    type: TriggerType;
    scheduleCron?: string; // For SCHEDULE
    webhookPath?: string; // For WEBHOOK
}

export interface LLMNodeData extends BaseNodeData {
    prompt: string;
    systemMessage?: string;
    provider: LLMProvider;
    model: string;
    temperature?: number;
    fallbacks?: Array<{ provider: LLMProvider; model: string }>; // For Zero-Cost redundancy
    outputVariable?: string; // Variable to store result in
}

export interface BrowserNodeData extends BaseNodeData {
    action: BrowserAction;
    url?: string; // For NAVIGATE
    selector?: string; // For CLICK, TYPE, EXTRACT
    inputValue?: string; // For TYPE (can be {{variable}})
    javascript?: string; // For EXECUTE_SCRIPT
    outputVariable?: string;
}

export interface HttpNodeData extends BaseNodeData {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    url: string;
    headers?: Record<string, string>;
    body?: string; // JSON string or {{variable}}
    outputVariable?: string;
}

export interface ControlIfData extends BaseNodeData {
    condition: string; // JavaScript expression or simple comparison
}

export interface VariableSetData extends BaseNodeData {
    variables: Record<string, string>; // key -> value (or {{expression}})
}

// Union type for all node data
export type NodeData =
    | TriggerData
    | LLMNodeData
    | BrowserNodeData
    | HttpNodeData
    | ControlIfData
    | VariableSetData;

// --- Graph Structure ---

export interface WorkflowNode {
    id: string;
    type: NodeType;
    position: { x: number; y: number }; // For UI
    data: NodeData;
}

export interface WorkflowEdge {
    id: string;
    source: string;
    target: string;
    label?: string;
    // For control flow (e.g., 'true' path vs 'false' path)
    handle?: 'default' | 'true' | 'false';
}

export interface Workflow {
    id: string;
    name: string;
    description?: string;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    variables?: Record<string, any>; // Global execution variables
    created_at: string;
    updated_at: string;
}

// --- Zod Schemas for Runtime Validation ---

export const WorkflowSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    nodes: z.array(z.object({
        id: z.string(),
        type: z.nativeEnum(NodeType),
        position: z.object({ x: z.number(), y: z.number() }),
        data: z.any(), // Flexible for now, could be refined
    })),
    edges: z.array(z.object({
        id: z.string(),
        source: z.string(),
        target: z.string(),
        label: z.string().optional(),
        handle: z.enum(['default', 'true', 'false']).optional(),
    })),
    created_at: z.string(),
    updated_at: z.string(),
});
