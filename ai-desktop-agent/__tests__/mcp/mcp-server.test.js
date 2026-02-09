/**
 * MCP Server Tests
 */

const mcpServer = require('../../src/mcp/mcp-server');

describe('MCP Server', () => {
    beforeEach(async () => {
        await mcpServer.initialize();
    });

    afterEach(async () => {
        await mcpServer.shutdown();
    });

    describe('Initialization', () => {
        it('should initialize successfully', async () => {
            const status = mcpServer.getStatus();
            expect(status.initialized).toBe(true);
        });

        it('should have default resources', () => {
            const resources = mcpServer.listResources();
            expect(resources.resources).toBeDefined();
            expect(resources.resources.length).toBeGreaterThan(0);
        });

        it('should have default tools', () => {
            const tools = mcpServer.listTools();
            expect(tools.tools).toBeDefined();
            expect(tools.tools.length).toBeGreaterThan(0);
        });

        it('should have default prompts', () => {
            const prompts = mcpServer.listPrompts();
            expect(prompts.prompts).toBeDefined();
            expect(prompts.prompts.length).toBeGreaterThan(0);
        });
    });

    describe('Resources', () => {
        it('should list all resources', () => {
            const result = mcpServer.listResources();
            expect(result.success).toBe(true);
            expect(result.resources).toBeInstanceOf(Array);
        });

        it('should read file system resource', () => {
            const result = mcpServer.readResource('file://system');
            expect(result.success).toBe(true);
            expect(result.content).toBeDefined();
        });

        it('should read clipboard resource', () => {
            const result = mcpServer.readResource('clipboard://current');
            expect(result.success).toBe(true);
            expect(result.content).toBeDefined();
        });

        it('should return error for invalid resource', () => {
            const result = mcpServer.readResource('invalid://resource');
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('Tools', () => {
        it('should list all tools', () => {
            const result = mcpServer.listTools();
            expect(result.success).toBe(true);
            expect(result.tools).toBeInstanceOf(Array);
        });

        it('should call capture_screen tool', async () => {
            const result = await mcpServer.callTool('capture_screen', {});
            expect(result.success).toBe(true);
            expect(result.content).toBeDefined();
        });

        it('should call type_text tool', async () => {
            const result = await mcpServer.callTool('type_text', {
                text: 'Hello, World!'
            });
            expect(result.success).toBe(true);
        });

        it('should call press_key tool', async () => {
            const result = await mcpServer.callTool('press_key', {
                key: 'Enter'
            });
            expect(result.success).toBe(true);
        });

        it('should return error for invalid tool', async () => {
            const result = await mcpServer.callTool('invalid_tool', {});
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('Prompts', () => {
        it('should list all prompts', () => {
            const result = mcpServer.listPrompts();
            expect(result.success).toBe(true);
            expect(result.prompts).toBeInstanceOf(Array);
        });

        it('should get plan_task prompt', () => {
            const result = mcpServer.getPrompt('plan_task');
            expect(result.success).toBe(true);
            expect(result.prompt).toBeDefined();
            expect(result.prompt.name).toBe('plan_task');
        });

        it('should get review_code prompt', () => {
            const result = mcpServer.getPrompt('review_code');
            expect(result.success).toBe(true);
            expect(result.prompt).toBeDefined();
            expect(result.prompt.name).toBe('review_code');
        });

        it('should return error for invalid prompt', () => {
            const result = mcpServer.getPrompt('invalid_prompt');
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('JSON-RPC 2.0', () => {
        it('should handle valid JSON-RPC request', () => {
            const request = {
                jsonrpc: '2.0',
                id: 1,
                method: 'resources/list',
                params: {}
            };

            const response = mcpServer.handleRequest(request);
            expect(response.jsonrpc).toBe('2.0');
            expect(response.id).toBe(1);
            expect(response.result).toBeDefined();
        });

        it('should handle JSON-RPC notification', () => {
            const notification = {
                jsonrpc: '2.0',
                method: 'resources/list',
                params: {}
            };

            const response = mcpServer.handleRequest(notification);
            expect(response).toBeUndefined(); // Notifications don't have responses
        });

        it('should return error for invalid JSON-RPC version', () => {
            const request = {
                jsonrpc: '1.0',
                id: 1,
                method: 'resources/list',
                params: {}
            };

            const response = mcpServer.handleRequest(request);
            expect(response.error).toBeDefined();
            expect(response.error.code).toBe(-32600);
        });

        it('should return error for missing method', () => {
            const request = {
                jsonrpc: '2.0',
                id: 1,
                params: {}
            };

            const response = mcpServer.handleRequest(request);
            expect(response.error).toBeDefined();
            expect(response.error.code).toBe(-32601);
        });
    });

    describe('Event Emitter', () => {
        it('should emit initialized event', (done) => {
            mcpServer.once('initialized', () => {
                done();
            });
        });

        it('should emit resource-changed event', (done) => {
            mcpServer.once('resource-changed', (data) => {
                expect(data.uri).toBeDefined();
                done();
            });

            // Trigger a resource change
            mcpServer.notifyResourceChange('clipboard://current');
        });

        it('should emit tool-called event', (done) => {
            mcpServer.once('tool-called', (data) => {
                expect(data.name).toBeDefined();
                done();
            });

            mcpServer.callTool('capture_screen', {});
        });
    });

    describe('Custom Resources', () => {
        it('should register custom resource', () => {
            const resource = {
                uri: 'custom://test',
                name: 'Test Resource',
                description: 'A test resource',
                mimeType: 'text/plain'
            };

            const result = mcpServer.registerResource(resource);
            expect(result.success).toBe(true);
        });

        it('should read custom resource', () => {
            const resource = {
                uri: 'custom://test2',
                name: 'Test Resource 2',
                description: 'Another test resource',
                mimeType: 'text/plain',
                read: async () => ({ content: 'Test content' })
            };

            mcpServer.registerResource(resource);
            const result = mcpServer.readResource('custom://test2');
            expect(result.success).toBe(true);
            expect(result.content).toBe('Test content');
        });
    });

    describe('Custom Tools', () => {
        it('should register custom tool', () => {
            const tool = {
                name: 'custom_tool',
                description: 'A custom tool',
                inputSchema: {
                    type: 'object',
                    properties: {
                        message: { type: 'string' }
                    }
                },
                execute: async (args) => ({ content: `Echo: ${args.message}` })
            };

            const result = mcpServer.registerTool(tool);
            expect(result.success).toBe(true);
        });

        it('should call custom tool', async () => {
            const tool = {
                name: 'custom_tool2',
                description: 'Another custom tool',
                inputSchema: {
                    type: 'object',
                    properties: {
                        value: { type: 'number' }
                    }
                },
                execute: async (args) => ({ content: args.value * 2 })
            };

            mcpServer.registerTool(tool);
            const result = await mcpServer.callTool('custom_tool2', { value: 5 });
            expect(result.success).toBe(true);
            expect(result.content).toBe(10);
        });
    });

    describe('Custom Prompts', () => {
        it('should register custom prompt', () => {
            const prompt = {
                name: 'custom_prompt',
                description: 'A custom prompt',
                template: 'Custom template: {{input}}'
            };

            const result = mcpServer.registerPrompt(prompt);
            expect(result.success).toBe(true);
        });

        it('should get custom prompt', () => {
            const prompt = {
                name: 'custom_prompt2',
                description: 'Another custom prompt',
                template: 'Another template: {{input}}'
            };

            mcpServer.registerPrompt(prompt);
            const result = mcpServer.getPrompt('custom_prompt2');
            expect(result.success).toBe(true);
            expect(result.prompt.template).toBe('Another template: {{input}}');
        });
    });
});
