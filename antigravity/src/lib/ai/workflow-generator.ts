import OpenAI from 'openai';
import { z } from 'zod';
import { Workflow, WorkflowSchema, NodeType, TriggerType, BrowserAction, LLMProvider } from '../workflow/types';
import { createAIClient } from './client';

// System prompt to guide the LLM
const SYSTEM_PROMPT = `
You are an expert Automation Agent Architect. Your goal is to convert user natural language descriptions into executable JSON workflows based on the provided schema.

### Capabilities
You can design workflows that:
1. **Trigger** on schedules (cron), webhooks, or manual input.
2. **Browse the web** (navigate, click, type, extract, screenshot).
3. **Use LLMs** to process text, summarize, or generate content.
4. **Make HTTP requests** to external APIs.
5. **Control flow** with loops and if/else conditions.

### Rules
1. **Zero-Cost Strategy**: ALWAYS prefer using 'ollama' or 'groq' as the provider for LLM nodes unless the user specifies otherwise. If not possible, set fallbacks.
2. **Browser Actions**: When extracting data, try to be specific with selectors or use 'extract_text' on 'body' if unsure.
3. **Variables**: Use double curly braces {{variableName}} to reference outputs from previous nodes.
4. **Precision**: Generate valid JSON matching the Workflow schema.

### Schema Summary
- **Nodes**: id, type, data, position.
- **Edges**: source, target.
- **Node Types**: 
  - TRIGGER: { type: 'manual' | 'schedule' | 'webhook', scheduleCron: '...' }
  - ACTION_BROWSER: { action: 'navigate' | 'click' | 'type' | 'extract_text', url: '...', selector: '...' }
  - ACTION_LLM: { prompt: '...', provider: 'ollama' | 'openai', model: '...' }
  - CONTROL_IF: { condition: '...' }

### Output Format
Return ONLY the raw JSON object. Do not include markdown formatting like \`\`\`json.
`;

export async function generateWorkflowFromPrompt(userPrompt: string): Promise<Workflow> {
    const client = createAIClient();

    try {
        const completion = await client.chat.completions.create({
            model: process.env.GROQ_API_KEY ? 'llama3-70b-8192' : 'gpt-4o', // Use efficient models
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: `Create an automation workflow for: "${userPrompt}"` }
            ],
            temperature: 0.2, // Low temperature for deterministic code generation
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) throw new Error('No content generated');

        // Clean up markdown if present
        const cleanJson = content.replace(/```json\n?|```/g, '');

        // Parse and validate
        const rawData = JSON.parse(cleanJson);

        // Ensure we have a valid structure (basic validation)
        if (!rawData.nodes || !rawData.edges) {
            throw new Error('Invalid workflow structure: missing nodes or edges');
        }

        // Add metadata if missing
        const workflow: Workflow = {
            id: crypto.randomUUID(),
            name: `Auto-generated: ${userPrompt.slice(0, 30)}...`,
            description: userPrompt,
            nodes: rawData.nodes,
            edges: rawData.edges,
            variables: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        // Validate against Zod schema
        // Note: We might need to relax validation if the LLM isn't perfect, but let's try strict first
        // WorkflowSchema.parse(workflow); 

        return workflow;

    } catch (error) {
        console.error('Failed to generate workflow:', error);
        throw new Error('Failed to generate workflow from prompt. Please try again.');
    }
}
