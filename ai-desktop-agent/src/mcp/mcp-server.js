/**
 * MCP Server Implementation
 * Full Model Context Protocol server with JSON-RPC 2.0 support
 */

const EventEmitter = require('events');
const { v4: uuidv4 } = require('crypto');

class MCPServer extends EventEmitter {
    constructor() {
        super();
        this.name = 'AI Desktop Agent MCP Server';
        this.version = '1.0.0';
        this.capabilities = {
            resources: {
                subscribe: true,
                listChanged: true
            },
            tools: {},
            prompts: {
                listChanged: true
            }
        };
        this.resources = new Map();
        this.tools = new Map();
        this.prompts = new Map();
        this.clients = new Map();
        this.subscriptions = new Map();
        this.isRunning = false;
    }

    /**
     * Initialize MCP server
     */
    async initialize() {
        console.log('[MCP Server] Initializing...');

        // Register default resources
        this.registerDefaultResources();

        // Register default tools
        this.registerDefaultTools();

        // Register default prompts
        this.registerDefaultPrompts();

        this.isRunning = true;
        this.emit('initialized');
        console.log('[MCP Server] Initialized successfully');

        return { success: true, name: this.name, version: this.version };
    }

    /**
     * Register default resources
     */
    registerDefaultResources() {
        // File system resource
        this.registerResource({
            uri: 'file://system',
            name: 'System Files',
            description: 'Access to system files',
            mimeType: 'application/json',
            read: async () => {
                const fs = require('fs');
                const path = require('path');
                const homeDir = require('os').homedir();
                const files = fs.readdirSync(homeDir, { withFileTypes: true });
                return JSON.stringify({
                    homeDir,
                    files: files.map(f => ({
                        name: f.name,
                        type: f.isDirectory() ? 'directory' : 'file'
                    }))
                }, null, 2);
            }
        });

        // Clipboard resource
        this.registerResource({
            uri: 'clipboard://current',
            name: 'Current Clipboard',
            description: 'Current clipboard content',
            mimeType: 'text/plain',
            read: async () => {
                const clipboardy = require('clipboardy');
                return await clipboardy.read();
            },
            write: async (content) => {
                const clipboardy = require('clipboardy');
                await clipboardy.write(content);
                return { success: true };
            }
        });

        // Screen resource
        this.registerResource({
            uri: 'screen://capture',
            name: 'Screen Capture',
            description: 'Current screen capture',
            mimeType: 'image/png',
            read: async () => {
                const screenController = require('../controllers/screen-controller');
                const screenshot = await screenController.captureScreen();
                return screenshot.toString('base64');
            }
        });

        // Active window resource
        this.registerResource({
            uri: 'window://active',
            name: 'Active Window',
            description: 'Currently active window information',
            mimeType: 'application/json',
            read: async () => {
                const screenController = require('../controllers/screen-controller');
                const window = await screenController.getActiveWindow();
                return JSON.stringify(window, null, 2);
            }
        });

        // Memory resource
        this.registerResource({
            uri: 'memory://conversations',
            name: 'Conversation Memory',
            description: 'Stored conversation history',
            mimeType: 'application/json',
            read: async () => {
                const memoryManager = require('../agent/memory-manager');
                const history = memoryManager.getConversationHistory();
                return JSON.stringify(history, null, 2);
            },
            write: async (content) => {
                const memoryManager = require('../agent/memory-manager');
                const data = JSON.parse(content);
                if (data.messages) {
                    data.messages.forEach(msg => {
                        memoryManager.addToHistory(msg.role, msg.content);
                    });
                }
                return { success: true };
            }
        });

        // Workflows resource
        this.registerResource({
            uri: 'workflows://all',
            name: 'All Workflows',
            description: 'Available automation workflows',
            mimeType: 'application/json',
            read: async () => {
                const workflowEngine = require('../automation/workflow-engine');
                const workflows = workflowEngine.getAllWorkflows();
                return JSON.stringify(workflows, null, 2);
            }
        });

        // Settings resource
        this.registerResource({
            uri: 'settings://app',
            name: 'Application Settings',
            description: 'Application configuration',
            mimeType: 'application/json',
            read: async () => {
                const config = require('../utils/config');
                return JSON.stringify(config.getAll(), null, 2);
            },
            write: async (content) => {
                const config = require('../utils/config');
                const settings = JSON.parse(content);
                Object.keys(settings).forEach(key => {
                    config.set(key, settings[key]);
                });
                return { success: true };
            }
        });
    }

    /**
     * Register default tools
     */
    registerDefaultTools() {
        // Execute action tool
        this.registerTool({
            name: 'execute_action',
            description: 'Execute a system action (mouse, keyboard, window, file, etc.)',
            inputSchema: {
                type: 'object',
                properties: {
                    type: {
                        type: 'string',
                        enum: ['mouse', 'keyboard', 'window', 'file', 'browser', 'clipboard', 'screen', 'app'],
                        description: 'Action type'
                    },
                    action: {
                        type: 'string',
                        description: 'Specific action to execute'
                    },
                    params: {
                        type: 'object',
                        description: 'Action parameters'
                    }
                },
                required: ['type', 'action']
            },
            execute: async (params) => {
                const actionExecutor = require('../automation/action-executor');
                const result = await actionExecutor.execute({
                    type: params.type,
                    action: params.action,
                    ...params.params
                });
                return result;
            }
        });

        // Capture screen tool
        this.registerTool({
            name: 'capture_screen',
            description: 'Capture a screenshot of the screen or a specific region',
            inputSchema: {
                type: 'object',
                properties: {
                    region: {
                        type: 'object',
                        properties: {
                            x: { type: 'number' },
                            y: { type: 'number' },
                            width: { type: 'number' },
                            height: { type: 'number' }
                        },
                        description: 'Screen region to capture (optional)'
                    },
                    format: {
                        type: 'string',
                        enum: ['png', 'jpeg', 'base64'],
                        default: 'base64',
                        description: 'Output format'
                    }
                }
            },
            execute: async (params) => {
                const screenController = require('../controllers/screen-controller');
                let screenshot;

                if (params.region) {
                    screenshot = await screenController.captureRegion(
                        params.region.x,
                        params.region.y,
                        params.region.width,
                        params.region.height
                    );
                } else {
                    screenshot = await screenController.captureScreen();
                }

                if (params.format === 'base64') {
                    return { success: true, data: screenshot.toString('base64'), format: 'base64' };
                } else {
                    const fs = require('fs');
                    const path = require('path');
                    const filename = `screenshot_${Date.now()}.${params.format || 'png'}`;
                    const filepath = path.join(__dirname, '../../data/screenshots', filename);
                    await fs.promises.writeFile(filepath, screenshot);
                    return { success: true, filepath, format: params.format || 'png' };
                }
            }
        });

        // Extract text tool (OCR)
        this.registerTool({
            name: 'extract_text',
            description: 'Extract text from an image using OCR',
            inputSchema: {
                type: 'object',
                properties: {
                    image: {
                        type: 'string',
                        description: 'Base64 encoded image or file path'
                    },
                    language: {
                        type: 'string',
                        default: 'eng',
                        description: 'Language code (eng, spa, fra, deu, etc.)'
                    }
                },
                required: ['image']
            },
            execute: async (params) => {
                const screenController = require('../controllers/screen-controller');
                const text = await screenController.extractText(
                    Buffer.from(params.image, 'base64')
                );
                return { success: true, text, language: params.language };
            }
        });

        // Find text on screen tool
        this.registerTool({
            name: 'find_text_on_screen',
            description: 'Find text on the screen and return its coordinates',
            inputSchema: {
                type: 'object',
                properties: {
                    searchText: {
                        type: 'string',
                        description: 'Text to search for'
                    },
                    caseSensitive: {
                        type: 'boolean',
                        default: false,
                        description: 'Case sensitive search'
                    }
                },
                required: ['searchText']
            },
            execute: async (params) => {
                const screenController = require('../controllers/screen-controller');
                const result = await screenController.findTextOnScreen(
                    params.searchText,
                    params.caseSensitive
                );
                return result;
            }
        });

        // Type text tool
        this.registerTool({
            name: 'type_text',
            description: 'Type text at the current cursor position',
            inputSchema: {
                type: 'object',
                properties: {
                    text: {
                        type: 'string',
                        description: 'Text to type'
                    },
                    delay: {
                        type: 'number',
                        default: 10,
                        description: 'Delay between keystrokes in milliseconds'
                    }
                },
                required: ['text']
            },
            execute: async (params) => {
                const inputController = require('../controllers/input-controller');
                await inputController.typeText(params.text, params.delay);
                return { success: true, text: params.text };
            }
        });

        // Press key tool
        this.registerTool({
            name: 'press_key',
            description: 'Press a keyboard key or combination',
            inputSchema: {
                type: 'object',
                properties: {
                    key: {
                        type: 'string',
                        description: 'Key to press (e.g., "enter", "ctrl+c", "alt+tab")'
                    }
                },
                required: ['key']
            },
            execute: async (params) => {
                const inputController = require('../controllers/input-controller');
                await inputController.pressShortcut(params.key);
                return { success: true, key: params.key };
            }
        });

        // Click mouse tool
        this.registerTool({
            name: 'click_mouse',
            description: 'Click the mouse at specific coordinates',
            inputSchema: {
                type: 'object',
                properties: {
                    x: {
                        type: 'number',
                        description: 'X coordinate'
                    },
                    y: {
                        type: 'number',
                        description: 'Y coordinate'
                    },
                    button: {
                        type: 'string',
                        enum: ['left', 'right', 'middle'],
                        default: 'left',
                        description: 'Mouse button'
                    },
                    doubleClick: {
                        type: 'boolean',
                        default: false,
                        description: 'Double click'
                    }
                },
                required: ['x', 'y']
            },
            execute: async (params) => {
                const inputController = require('../controllers/input-controller');
                await inputController.moveMouse(params.x, params.y, true);
                await inputController.clickMouse(params.button, params.doubleClick);
                return { success: true, x: params.x, y: params.y };
            }
        });

        // Open application tool
        this.registerTool({
            name: 'open_application',
            description: 'Open an application',
            inputSchema: {
                type: 'object',
                properties: {
                    appName: {
                        type: 'string',
                        description: 'Application name or path'
                    }
                },
                required: ['appName']
            },
            execute: async (params) => {
                const appController = require('../controllers/app-controller');
                await appController.openApplication(params.appName);
                return { success: true, appName: params.appName };
            }
        });

        // Navigate browser tool
        this.registerTool({
            name: 'navigate_browser',
            description: 'Navigate to a URL in the browser',
            inputSchema: {
                type: 'object',
                properties: {
                    url: {
                        type: 'string',
                        description: 'URL to navigate to'
                    },
                    browser: {
                        type: 'string',
                        enum: ['chrome', 'firefox', 'edge', 'safari'],
                        default: 'chrome',
                        description: 'Browser to use'
                    }
                },
                required: ['url']
            },
            execute: async (params) => {
                const browserController = require('../controllers/browser-controller');
                await browserController.openInBrowser(params.url, params.browser);
                return { success: true, url: params.url, browser: params.browser };
            }
        });

        // Read file tool
        this.registerTool({
            name: 'read_file',
            description: 'Read the contents of a file',
            inputSchema: {
                type: 'object',
                properties: {
                    filePath: {
                        type: 'string',
                        description: 'Path to the file'
                    },
                    encoding: {
                        type: 'string',
                        default: 'utf8',
                        description: 'File encoding'
                    }
                },
                required: ['filePath']
            },
            execute: async (params) => {
                const fileController = require('../controllers/file-controller');
                const content = await fileController.readFile(params.filePath, params.encoding);
                return { success: true, content, filePath: params.filePath };
            }
        });

        // Write file tool
        this.registerTool({
            name: 'write_file',
            description: 'Write content to a file',
            inputSchema: {
                type: 'object',
                properties: {
                    filePath: {
                        type: 'string',
                        description: 'Path to the file'
                    },
                    content: {
                        type: 'string',
                        description: 'Content to write'
                    },
                    encoding: {
                        type: 'string',
                        default: 'utf8',
                        description: 'File encoding'
                    }
                },
                required: ['filePath', 'content']
            },
            execute: async (params) => {
                const fileController = require('../controllers/file-controller');
                await fileController.writeFile(params.filePath, params.content, params.encoding);
                return { success: true, filePath: params.filePath };
            }
        });

        // Search files tool
        this.registerTool({
            name: 'search_files',
            description: 'Search for files matching a pattern',
            inputSchema: {
                type: 'object',
                properties: {
                    pattern: {
                        type: 'string',
                        description: 'Glob pattern to search for'
                    },
                    directory: {
                        type: 'string',
                        default: '.',
                        description: 'Directory to search in'
                    }
                },
                required: ['pattern']
            },
            execute: async (params) => {
                const fileController = require('../controllers/file-controller');
                const files = await fileController.searchFiles(params.pattern, params.directory);
                return { success: true, files, count: files.length };
            }
        });

        // Execute workflow tool
        this.registerTool({
            name: 'execute_workflow',
            description: 'Execute a predefined workflow',
            inputSchema: {
                type: 'object',
                properties: {
                    workflowId: {
                        type: 'string',
                        description: 'ID of the workflow to execute'
                    },
                    variables: {
                        type: 'object',
                        description: 'Variables to substitute in the workflow'
                    }
                },
                required: ['workflowId']
            },
            execute: async (params) => {
                const workflowEngine = require('../automation/workflow-engine');
                const result = await workflowEngine.executeWorkflow(params.workflowId, params.variables);
                return result;
            }
        });

        // Get windows tool
        this.registerTool({
            name: 'get_windows',
            description: 'Get list of all open windows',
            inputSchema: {
                type: 'object',
                properties: {}
            },
            execute: async () => {
                const windowController = require('../controllers/window-controller');
                const windows = await windowController.getWindows();
                return { success: true, windows, count: windows.length };
            }
        });

        // Focus window tool
        this.registerTool({
            name: 'focus_window',
            description: 'Focus a specific window',
            inputSchema: {
                type: 'object',
                properties: {
                    windowId: {
                        type: 'string',
                        description: 'Window ID or title'
                    }
                },
                required: ['windowId']
            },
            execute: async (params) => {
                const windowController = require('../controllers/window-controller');
                await windowController.focusWindow(params.windowId);
                return { success: true, windowId: params.windowId };
            }
        });

        // Chat with AI tool
        this.registerTool({
            name: 'chat_with_ai',
            description: 'Send a message to the AI and get a response',
            inputSchema: {
                type: 'object',
                properties: {
                    message: {
                        type: 'string',
                        description: 'Message to send to AI'
                    },
                    provider: {
                        type: 'string',
                        enum: ['anthropic', 'openai', 'gemini', 'perplexity'],
                        default: 'anthropic',
                        description: 'AI provider to use'
                    },
                    model: {
                        type: 'string',
                        description: 'Specific model to use'
                    }
                },
                required: ['message']
            },
            execute: async (params) => {
                const aiEngine = require('../agent/ai-engine');
                const response = await aiEngine.chat(params.message, {
                    provider: params.provider,
                    model: params.model
                });
                return { success: true, response, provider: params.provider };
            }
        });

        // Analyze screen tool
        this.registerTool({
            name: 'analyze_screen',
            description: 'Analyze the current screen with AI vision',
            inputSchema: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'What to look for or analyze on screen'
                    }
                },
                required: ['query']
            },
            execute: async (params) => {
                const aiEngine = require('../agent/ai-engine');
                const screenController = require('../controllers/screen-controller');
                const screenshot = await screenController.captureScreen();
                const analysis = await aiEngine.analyzeScreen(screenshot, params.query);
                return { success: true, analysis, query: params.query };
            }
        });
    }

    /**
     * Register default prompts
     */
    registerDefaultPrompts() {
        // Task planning prompt
        this.registerPrompt({
            name: 'plan_task',
            description: 'Plan a complex task by breaking it down into steps',
            arguments: [
                {
                    name: 'task',
                    description: 'The task to plan',
                    required: true
                },
                {
                    name: 'context',
                    description: 'Additional context about the task',
                    required: false
                }
            ],
            template: `You are an expert task planner. Break down the following task into clear, actionable steps:

Task: {{task}}
{{#if context}}Context: {{context}}{{/if}}

Provide a step-by-step plan with:
1. Clear objectives
2. Required tools/actions
3. Estimated time for each step
4. Potential risks and mitigations
5. Success criteria

Format your response as a numbered list with clear headings.`
        });

        // Code review prompt
        this.registerPrompt({
            name: 'review_code',
            description: 'Review code for bugs, security issues, and improvements',
            arguments: [
                {
                    name: 'code',
                    description: 'The code to review',
                    required: true
                },
                {
                    name: 'language',
                    description: 'Programming language',
                    required: false
                }
            ],
            template: `You are an expert code reviewer. Review the following code:

{{#if language}}Language: {{language}}{{/if}}

Code:
\`\`\`
{{code}}
\`\`\`

Provide feedback on:
1. Bugs and potential issues
2. Security vulnerabilities
3. Performance improvements
4. Code style and best practices
5. Suggestions for refactoring

Be constructive and specific with your feedback.`
        });

        // Summarize content prompt
        this.registerPrompt({
            name: 'summarize',
            description: 'Summarize long content into key points',
            arguments: [
                {
                    name: 'content',
                    description: 'The content to summarize',
                    required: true
                },
                {
                    name: 'length',
                    description: 'Summary length (brief, medium, detailed)',
                    required: false
                }
            ],
            template: `Summarize the following content:

{{content}}

{{#if length}}Target length: {{length}}{{/if}}

Provide:
1. A concise summary
2. Key points (bullet list)
3. Main conclusions or takeaways
4. Any important details that shouldn't be missed`
        });

        // Explain concept prompt
        this.registerPrompt({
            name: 'explain',
            description: 'Explain a concept in simple terms',
            arguments: [
                {
                    name: 'concept',
                    description: 'The concept to explain',
                    required: true
                },
                {
                    name: 'audience',
                    description: 'Target audience level (beginner, intermediate, advanced)',
                    required: false
                }
            ],
            template: `Explain the following concept:

Concept: {{concept}}
{{#if audience}}Audience level: {{audience}}{{/if}}

Provide:
1. A simple definition
2. How it works (in simple terms)
3. Why it matters
4. Real-world examples
5. Common misconceptions

Use analogies and examples to make it easy to understand.`
        });

        // Generate code prompt
        this.registerPrompt({
            name: 'generate_code',
            description: 'Generate code based on requirements',
            arguments: [
                {
                    name: 'requirements',
                    description: 'What the code should do',
                    required: true
                },
                {
                    name: 'language',
                    description: 'Programming language',
                    required: true
                },
                {
                    name: 'framework',
                    description: 'Framework or library to use',
                    required: false
                }
            ],
            template: `Generate code based on the following requirements:

Requirements: {{requirements}}
Language: {{language}}
{{#if framework}}Framework: {{framework}}{{/if}}

Provide:
1. Complete, working code
2. Comments explaining key parts
3. Usage examples
4. Error handling
5. Best practices followed

Make the code production-ready and well-documented.`
        });

        // Debug code prompt
        this.registerPrompt({
            name: 'debug_code',
            description: 'Help debug code that has issues',
            arguments: [
                {
                    name: 'code',
                    description: 'The code with issues',
                    required: true
                },
                {
                    name: 'error',
                    description: 'Error message or description of the issue',
                    required: true
                },
                {
                    name: 'language',
                    description: 'Programming language',
                    required: false
                }
            ],
            template: `Help debug the following code:

Code:
\`\`\`
{{code}}
\`\`\`

Error/Issue: {{error}}
{{#if language}}Language: {{language}}{{/if}}

Provide:
1. Root cause analysis
2. Fixed code with corrections highlighted
3. Explanation of what was wrong
4. How to prevent similar issues
5. Additional improvements or suggestions`
        });

        // Optimize code prompt
        this.registerPrompt({
            name: 'optimize_code',
            description: 'Optimize code for better performance',
            arguments: [
                {
                    name: 'code',
                    description: 'The code to optimize',
                    required: true
                },
                {
                    name: 'language',
                    description: 'Programming language',
                    required: false
                }
            ],
            template: `Optimize the following code for better performance:

Code:
\`\`\`
{{code}}
\`\`\`
{{#if language}}Language: {{language}}{{/if}}

Provide:
1. Optimized code
2. Performance improvements made
3. Time/space complexity analysis
4. Benchmark comparisons (if applicable)
5. Trade-offs and considerations`
        });
    }

    /**
     * Register a resource
     */
    registerResource(resource) {
        if (!resource.uri) {
            throw new Error('Resource must have a URI');
        }
        this.resources.set(resource.uri, resource);
        this.emit('resource-registered', resource);
        console.log(`[MCP Server] Resource registered: ${resource.uri}`);
    }

    /**
     * Register a tool
     */
    registerTool(tool) {
        if (!tool.name) {
            throw new Error('Tool must have a name');
        }
        this.tools.set(tool.name, tool);
        this.emit('tool-registered', tool);
        console.log(`[MCP Server] Tool registered: ${tool.name}`);
    }

    /**
     * Register a prompt
     */
    registerPrompt(prompt) {
        if (!prompt.name) {
            throw new Error('Prompt must have a name');
        }
        this.prompts.set(prompt.name, prompt);
        this.emit('prompt-registered', prompt);
        console.log(`[MCP Server] Prompt registered: ${prompt.name}`);
    }

    /**
     * Handle JSON-RPC request
     */
    async handleRequest(request) {
        try {
            const { jsonrpc, id, method, params } = request;

            // Validate JSON-RPC 2.0
            if (jsonrpc !== '2.0') {
                return this.createErrorResponse(id, -32600, 'Invalid Request');
            }

            // Handle different methods
            switch (method) {
                case 'initialize':
                    return this.createSuccessResponse(id, await this.handleInitialize(params));

                case 'initialized':
                    return this.createSuccessResponse(id, { success: true });

                case 'shutdown':
                    return this.createSuccessResponse(id, await this.handleShutdown());

                case 'notifications/initialized':
                    return this.createSuccessResponse(id, { success: true });

                case 'resources/list':
                    return this.createSuccessResponse(id, await this.listResources(params));

                case 'resources/read':
                    return this.createSuccessResponse(id, await this.readResource(params));

                case 'resources/subscribe':
                    return this.createSuccessResponse(id, await this.subscribeResource(params));

                case 'resources/unsubscribe':
                    return this.createSuccessResponse(id, await this.unsubscribeResource(params));

                case 'tools/list':
                    return this.createSuccessResponse(id, await this.listTools(params));

                case 'tools/call':
                    return this.createSuccessResponse(id, await this.callTool(params));

                case 'prompts/list':
                    return this.createSuccessResponse(id, await this.listPrompts(params));

                case 'prompts/get':
                    return this.createSuccessResponse(id, await this.getPrompt(params));

                default:
                    return this.createErrorResponse(id, -32601, 'Method not found');
            }
        } catch (error) {
            console.error('[MCP Server] Request error:', error);
            return this.createErrorResponse(request.id, -32603, 'Internal error', error.message);
        }
    }

    /**
     * Handle initialize request
     */
    async handleInitialize(params) {
        console.log('[MCP Server] Initialize request from:', params.clientInfo?.name);
        return {
            protocolVersion: '2024-11-05',
            capabilities: this.capabilities,
            serverInfo: {
                name: this.name,
                version: this.version
            }
        };
    }

    /**
     * Handle shutdown request
     */
    async handleShutdown() {
        console.log('[MCP Server] Shutdown requested');
        this.isRunning = false;
        this.emit('shutdown');
        return { success: true };
    }

    /**
     * List resources
     */
    async listResources(params) {
        const resources = Array.from(this.resources.values()).map(r => ({
            uri: r.uri,
            name: r.name,
            description: r.description,
            mimeType: r.mimeType
        }));
        return { resources };
    }

    /**
     * Read resource
     */
    async readResource(params) {
        const resource = this.resources.get(params.uri);
        if (!resource) {
            throw new Error(`Resource not found: ${params.uri}`);
        }
        const content = await resource.read();
        return {
            contents: [
                {
                    uri: params.uri,
                    mimeType: resource.mimeType,
                    text: typeof content === 'string' ? content : undefined,
                    blob: typeof content === 'string' ? undefined : content
                }
            ]
        };
    }

    /**
     * Subscribe to resource
     */
    async subscribeResource(params) {
        const resource = this.resources.get(params.uri);
        if (!resource) {
            throw new Error(`Resource not found: ${params.uri}`);
        }

        const subscriptionId = uuidv4();
        this.subscriptions.set(subscriptionId, {
            uri: params.uri,
            clientId: params.clientId
        });

        this.emit('resource-subscribed', { uri: params.uri, subscriptionId });
        return { success: true, subscriptionId };
    }

    /**
     * Unsubscribe from resource
     */
    async unsubscribeResource(params) {
        this.subscriptions.delete(params.subscriptionId);
        this.emit('resource-unsubscribed', { subscriptionId: params.subscriptionId });
        return { success: true };
    }

    /**
     * List tools
     */
    async listTools(params) {
        const tools = Array.from(this.tools.values()).map(t => ({
            name: t.name,
            description: t.description,
            inputSchema: t.inputSchema
        }));
        return { tools };
    }

    /**
     * Call tool
     */
    async callTool(params) {
        const tool = this.tools.get(params.name);
        if (!tool) {
            throw new Error(`Tool not found: ${params.name}`);
        }

        console.log(`[MCP Server] Calling tool: ${params.name}`);
        const result = await tool.execute(params.arguments || {});

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }
            ]
        };
    }

    /**
     * List prompts
     */
    async listPrompts(params) {
        const prompts = Array.from(this.prompts.values()).map(p => ({
            name: p.name,
            description: p.description,
            arguments: p.arguments
        }));
        return { prompts };
    }

    /**
     * Get prompt
     */
    async getPrompt(params) {
        const prompt = this.prompts.get(params.name);
        if (!prompt) {
            throw new Error(`Prompt not found: ${params.name}`);
        }

        return {
            name: prompt.name,
            description: prompt.description,
            arguments: prompt.arguments
        };
    }

    /**
     * Create success response
     */
    createSuccessResponse(id, result) {
        return {
            jsonrpc: '2.0',
            id,
            result
        };
    }

    /**
     * Create error response
     */
    createErrorResponse(id, code, message, data = null) {
        return {
            jsonrpc: '2.0',
            id,
            error: {
                code,
                message,
                ...(data && { data })
            }
        };
    }

    /**
     * Get server status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            name: this.name,
            version: this.version,
            resources: this.resources.size,
            tools: this.tools.size,
            prompts: this.prompts.size,
            clients: this.clients.size,
            subscriptions: this.subscriptions.size
        };
    }
}

module.exports = new MCPServer();
