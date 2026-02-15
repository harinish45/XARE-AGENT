import { Workflow, WorkflowNode, WorkflowEdge, NodeType, NodeData, LLMNodeData, HttpNodeData, ControlIfData } from './types';
import { createAIClient } from '../ai/client';

export interface ExecutionLog {
    nodeId: string;
    nodeType: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    output?: any;
    error?: string;
    timestamp: number;
}

export interface ExecutionState {
    variables: Record<string, any>;
    logs: ExecutionLog[];
    currentNodeId?: string;
}

/**
 * Interpolate variables in a string (e.g., "Hello {{name}}")
 */
function interpolate(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{(.*?)\}\}/g, (_, key) => {
        const value = variables[key.trim()];
        return value !== undefined ? String(value) : `{{${key}}}`;
    });
}

/**
 * Execute a single node
 */
async function executeNode(
    node: WorkflowNode,
    state: ExecutionState
): Promise<Partial<ExecutionState>> {
    const { data } = node;
    const newVariables = { ...state.variables };

    switch (node.type) {
        case NodeType.ACTION_LLM: {
            const llmData = data as LLMNodeData;
            const prompt = interpolate(llmData.prompt, state.variables);
            const system = llmData.systemMessage ? interpolate(llmData.systemMessage, state.variables) : undefined;

            const client = createAIClient(); // Uses env vars or local config

            const response = await client.chat.completions.create({
                model: llmData.model || 'gpt-4o', // Fallback
                messages: [
                    ...(system ? [{ role: 'system' as const, content: system }] : []),
                    { role: 'user' as const, content: prompt }
                ],
                temperature: llmData.temperature || 0.7,
            });

            const output = response.choices[0]?.message?.content || '';

            if (llmData.outputVariable) {
                newVariables[llmData.outputVariable] = output;
            }

            return { variables: newVariables, logs: [...state.logs, { nodeId: node.id, nodeType: node.type, status: 'completed', output, timestamp: Date.now() }] };
        }

        case NodeType.ACTION_HTTP: {
            const httpData = data as HttpNodeData;
            const url = interpolate(httpData.url, state.variables);
            const body = httpData.body ? interpolate(httpData.body, state.variables) : undefined;
            const headers = httpData.headers || {}; // TODO: Interpolate headers

            const response = await fetch(url, {
                method: httpData.method,
                headers: { 'Content-Type': 'application/json', ...headers },
                body: body,
            });

            const text = await response.text();
            let json;
            try {
                json = JSON.parse(text);
            } catch (e) {
                json = text;
            }

            if (httpData.outputVariable) {
                newVariables[httpData.outputVariable] = json;
            }

            return { variables: newVariables, logs: [...state.logs, { nodeId: node.id, nodeType: node.type, status: 'completed', output: json, timestamp: Date.now() }] };
        }

        case NodeType.CONTROL_IF: {
            const ifData = data as ControlIfData;
            // Simple evaluation for now. CAUTION: eval/Function is risky, but standard for these tools.
            // Using a safer restricted evaluation would be better for production.
            const condition = interpolate(ifData.condition, state.variables);
            let result = false;
            try {
                // Create a function with variables as arguments
                const keys = Object.keys(state.variables);
                const values = Object.values(state.variables);
                const func = new Function(...keys, `return ${condition};`);
                result = Boolean(func(...values));
            } catch (e) {
                console.error('Condition evaluation failed:', e);
            }

            return {
                variables: newVariables,
                logs: [...state.logs, { nodeId: node.id, nodeType: node.type, status: 'completed', output: result, timestamp: Date.now() }],
                // We handle branching in the graph traversal, but we pass the result here if needed
            };
        }

        case NodeType.TRIGGER:
            // Triggers just start the flow, essentially pass-through with initial vars
            return { variables: newVariables, logs: [...state.logs, { nodeId: node.id, nodeType: node.type, status: 'completed', output: 'Triggered', timestamp: Date.now() }] };

        default:
            console.warn(`Node type ${node.type} not implemented yet`);
            return { variables: newVariables, logs: [...state.logs, { nodeId: node.id, nodeType: node.type, status: 'completed', output: 'Skipped', timestamp: Date.now() }] };
    }
}

/**
 * Execute the full workflow
 */
export async function executeWorkflow(
    workflow: Workflow,
    initialVariables: Record<string, any> = {}
): Promise<ExecutionState> {
    let state: ExecutionState = {
        variables: { ...initialVariables, ...workflow.variables },
        logs: [],
    };

    // Find start node (First TRIGGER)
    const startNode = workflow.nodes.find(n => n.type === NodeType.TRIGGER);
    if (!startNode) {
        throw new Error('No trigger node found');
    }

    const queue: string[] = [startNode.id];
    const visited = new Set<string>();

    while (queue.length > 0) {
        const nodeId = queue.shift()!;
        // Allow revisiting for loops, but prevent infinite loops in simple DAGs for now (naive graph traversal)
        // For simple pipelines, we can just process. Complex graphs need a better engine (like n8n's).

        const node = workflow.nodes.find(n => n.id === nodeId);
        if (!node) continue;

        try {
            // Log start
            state.logs.push({ nodeId: node.id, nodeType: node.type, status: 'running', timestamp: Date.now() });

            // Execute
            const result = await executeNode(node, state);

            // Merge state
            state = {
                ...state,
                variables: { ...state.variables, ...result.variables },
                logs: [...state.logs.filter(l => l.nodeId !== nodeId), ...(result.logs || [])] // Replace running log with completed
            };

            // Find next nodes
            const outboundEdges = workflow.edges.filter(e => e.source === nodeId);

            if (node.type === NodeType.CONTROL_IF) {
                // Check the result from the last log for this node
                const lastLog = state.logs.find(l => l.nodeId === nodeId && l.status === 'completed');
                const conditionMet = lastLog?.output === true;

                // Follow 'true' or 'false' handle
                const nextEdges = outboundEdges.filter(e => e.handle === (conditionMet ? 'true' : 'false'));
                nextEdges.forEach(e => queue.push(e.target));
            } else {
                // Follow all default edges
                outboundEdges.forEach(e => queue.push(e.target));
            }

        } catch (error: any) {
            console.error(`Error executing node ${nodeId}:`, error);
            state.logs.push({ nodeId: node.id, nodeType: node.type, status: 'failed', error: error.message, timestamp: Date.now() });
            break; // Stop execution on error
        }
    }

    return state;
}
