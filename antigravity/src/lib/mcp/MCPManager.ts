// MCP Manager - Manages Model Context Protocol server connections
// Handles server lifecycle, tool discovery, and action execution

export interface MCPServer {
  id: string;
  name: string;
  description: string;
  version: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  capabilities: MCPCapability[];
  tools: MCPTool[];
  resources: MCPResource[];
  config: MCPServerConfig;
  lastConnected?: Date;
  error?: string;
}

export interface MCPCapability {
  name: string;
  version?: string;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  outputSchema?: JSONSchema;
  category: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

export interface JSONSchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  additionalProperties?: boolean;
  items?: JSONSchema;
}

export interface MCPAction {
  serverId: string;
  toolName: string;
  parameters: Record<string, any>;
  id: string;
}

export interface MCPActionResult {
  actionId: string;
  success: boolean;
  result?: any;
  error?: string;
  duration: number;
  timestamp: Date;
}

export interface MCPServerTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  config: MCPServerConfig;
  tools: Omit<MCPTool, 'inputSchema'>[];
  popular: boolean;
}

// Predefined MCP server templates
const serverTemplates: MCPServerTemplate[] = [
  // Google Cloud
  {
    id: 'gcp-bigquery',
    name: 'BigQuery',
    description: 'Query and analyze data in Google BigQuery',
    category: 'google-cloud',
    icon: '📊',
    popular: true,
    config: { command: 'mcp-bigquery', args: [] },
    tools: [
      { name: 'query', description: 'Run a SQL query', category: 'database', riskLevel: 'low' },
      { name: 'list_tables', description: 'List tables in dataset', category: 'database', riskLevel: 'low' },
      { name: 'get_schema', description: 'Get table schema', category: 'database', riskLevel: 'low' },
    ],
  },
  {
    id: 'gcp-cloudsql',
    name: 'Cloud SQL',
    description: 'Connect to Google Cloud SQL databases',
    category: 'google-cloud',
    icon: '🗄️',
    popular: true,
    config: { command: 'mcp-cloudsql', args: [] },
    tools: [
      { name: 'query', description: 'Execute SQL query', category: 'database', riskLevel: 'medium' },
      { name: 'list_databases', description: 'List databases', category: 'database', riskLevel: 'low' },
    ],
  },
  {
    id: 'gcp-firebase',
    name: 'Firebase',
    description: 'Interact with Firebase services',
    category: 'google-cloud',
    icon: '🔥',
    popular: true,
    config: { command: 'mcp-firebase', args: [] },
    tools: [
      { name: 'get_document', description: 'Get Firestore document', category: 'database', riskLevel: 'low' },
      { name: 'set_document', description: 'Set Firestore document', category: 'database', riskLevel: 'medium' },
      { name: 'query_collection', description: 'Query Firestore collection', category: 'database', riskLevel: 'low' },
    ],
  },
  
  // Development Tools
  {
    id: 'github',
    name: 'GitHub',
    description: 'Interact with GitHub repositories',
    category: 'development',
    icon: '🐙',
    popular: true,
    config: { command: 'mcp-github', args: [] },
    tools: [
      { name: 'create_issue', description: 'Create a new issue', category: 'issues', riskLevel: 'low' },
      { name: 'create_pr', description: 'Create a pull request', category: 'code', riskLevel: 'medium' },
      { name: 'search_repos', description: 'Search repositories', category: 'search', riskLevel: 'low' },
      { name: 'get_file', description: 'Get file contents', category: 'code', riskLevel: 'low' },
      { name: 'push_files', description: 'Push files to repo', category: 'code', riskLevel: 'high' },
    ],
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    description: 'Interact with GitLab projects',
    category: 'development',
    icon: '🦊',
    popular: false,
    config: { command: 'mcp-gitlab', args: [] },
    tools: [
      { name: 'create_issue', description: 'Create an issue', category: 'issues', riskLevel: 'low' },
      { name: 'create_mr', description: 'Create merge request', category: 'code', riskLevel: 'medium' },
    ],
  },
  {
    id: 'linear',
    name: 'Linear',
    description: 'Manage Linear issues and projects',
    category: 'development',
    icon: '📋',
    popular: true,
    config: { command: 'mcp-linear', args: [] },
    tools: [
      { name: 'create_issue', description: 'Create an issue', category: 'issues', riskLevel: 'low' },
      { name: 'update_issue', description: 'Update an issue', category: 'issues', riskLevel: 'low' },
      { name: 'search_issues', description: 'Search issues', category: 'search', riskLevel: 'low' },
    ],
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Interact with Notion workspaces',
    category: 'productivity',
    icon: '📝',
    popular: true,
    config: { command: 'mcp-notion', args: [] },
    tools: [
      { name: 'create_page', description: 'Create a new page', category: 'docs', riskLevel: 'low' },
      { name: 'update_page', description: 'Update a page', category: 'docs', riskLevel: 'medium' },
      { name: 'search', description: 'Search Notion', category: 'search', riskLevel: 'low' },
    ],
  },
  
  // Databases
  {
    id: 'postgres',
    name: 'PostgreSQL',
    description: 'Connect to PostgreSQL databases',
    category: 'database',
    icon: '🐘',
    popular: true,
    config: { command: 'mcp-postgres', args: [] },
    tools: [
      { name: 'query', description: 'Execute SQL query', category: 'database', riskLevel: 'medium' },
      { name: 'list_tables', description: 'List all tables', category: 'database', riskLevel: 'low' },
      { name: 'describe_table', description: 'Describe table structure', category: 'database', riskLevel: 'low' },
    ],
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    description: 'Connect to MongoDB databases',
    category: 'database',
    icon: '🍃',
    popular: true,
    config: { command: 'mcp-mongodb', args: [] },
    tools: [
      { name: 'find', description: 'Find documents', category: 'database', riskLevel: 'low' },
      { name: 'insert', description: 'Insert document', category: 'database', riskLevel: 'medium' },
      { name: 'update', description: 'Update documents', category: 'database', riskLevel: 'medium' },
      { name: 'aggregate', description: 'Run aggregation pipeline', category: 'database', riskLevel: 'low' },
    ],
  },
  {
    id: 'redis',
    name: 'Redis',
    description: 'Connect to Redis cache',
    category: 'database',
    icon: '🔴',
    popular: false,
    config: { command: 'mcp-redis', args: [] },
    tools: [
      { name: 'get', description: 'Get value by key', category: 'cache', riskLevel: 'low' },
      { name: 'set', description: 'Set key-value pair', category: 'cache', riskLevel: 'low' },
      { name: 'delete', description: 'Delete key', category: 'cache', riskLevel: 'medium' },
    ],
  },
  
  // AI & ML
  {
    id: 'perplexity',
    name: 'Perplexity Ask',
    description: 'Web research with Perplexity AI',
    category: 'ai',
    icon: '🔍',
    popular: true,
    config: { command: 'mcp-perplexity', args: [] },
    tools: [
      { name: 'ask', description: 'Ask a question', category: 'research', riskLevel: 'low' },
      { name: 'search', description: 'Search the web', category: 'research', riskLevel: 'low' },
    ],
  },
  {
    id: 'pinecone',
    name: 'Pinecone',
    description: 'Vector database for embeddings',
    category: 'ai',
    icon: '🌲',
    popular: false,
    config: { command: 'mcp-pinecone', args: [] },
    tools: [
      { name: 'upsert', description: 'Upsert vectors', category: 'vectors', riskLevel: 'low' },
      { name: 'query', description: 'Query similar vectors', category: 'vectors', riskLevel: 'low' },
      { name: 'delete', description: 'Delete vectors', category: 'vectors', riskLevel: 'medium' },
    ],
  },
  
  // Payments
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Payment processing with Stripe',
    category: 'payments',
    icon: '💳',
    popular: true,
    config: { command: 'mcp-stripe', args: [] },
    tools: [
      { name: 'create_customer', description: 'Create a customer', category: 'customers', riskLevel: 'low' },
      { name: 'create_payment', description: 'Create a payment intent', category: 'payments', riskLevel: 'high' },
      { name: 'list_charges', description: 'List charges', category: 'payments', riskLevel: 'low' },
    ],
  },
  
  // Communication
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send messages to Slack',
    category: 'communication',
    icon: '💬',
    popular: true,
    config: { command: 'mcp-slack', args: [] },
    tools: [
      { name: 'send_message', description: 'Send a message', category: 'messaging', riskLevel: 'low' },
      { name: 'list_channels', description: 'List channels', category: 'channels', riskLevel: 'low' },
    ],
  },
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Send and manage emails',
    category: 'communication',
    icon: '📧',
    popular: true,
    config: { command: 'mcp-gmail', args: [] },
    tools: [
      { name: 'send_email', description: 'Send an email', category: 'email', riskLevel: 'medium' },
      { name: 'list_emails', description: 'List emails', category: 'email', riskLevel: 'low' },
      { name: 'search_emails', description: 'Search emails', category: 'email', riskLevel: 'low' },
    ],
  },
];

export class MCPManager {
  private servers: Map<string, MCPServer> = new Map();
  private templates: Map<string, MCPServerTemplate> = new Map();
  private actionHistory: MCPActionResult[] = [];

  constructor() {
    // Initialize templates
    serverTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  // Install server from template
  async installServer(templateId: string, config?: Partial<MCPServerConfig>): Promise<MCPServer> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const serverId = `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const server: MCPServer = {
      id: serverId,
      name: template.name,
      description: template.description,
      version: '1.0.0',
      status: 'disconnected',
      capabilities: [],
      tools: template.tools.map(t => ({
        ...t,
        inputSchema: { type: 'object', properties: {} },
      })),
      resources: [],
      config: { ...template.config, ...config },
    };

    this.servers.set(serverId, server);
    return server;
  }

  // Connect to server
  async connect(serverId: string): Promise<boolean> {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`Server not found: ${serverId}`);
    }

    server.status = 'connecting';
    server.error = undefined;

    try {
      // In real implementation, this would spawn the MCP server process
      // and establish the JSON-RPC connection
      
      // Simulate connection
      await new Promise(resolve => setTimeout(resolve, 500));
      
      server.status = 'connected';
      server.lastConnected = new Date();
      server.capabilities = [{ name: 'tools' }, { name: 'resources' }];
      
      return true;
    } catch (error) {
      server.status = 'error';
      server.error = error instanceof Error ? error.message : 'Connection failed';
      return false;
    }
  }

  // Disconnect from server
  async disconnect(serverId: string): Promise<boolean> {
    const server = this.servers.get(serverId);
    if (!server) return false;

    // In real implementation, this would close the connection
    
    server.status = 'disconnected';
    return true;
  }

  // Execute tool action
  async executeAction(
    serverId: string,
    toolName: string,
    parameters: Record<string, any>
  ): Promise<MCPActionResult> {
    const startTime = Date.now();
    const actionId = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const server = this.servers.get(serverId);
    if (!server) {
      return {
        actionId,
        success: false,
        error: `Server not found: ${serverId}`,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }

    if (server.status !== 'connected') {
      return {
        actionId,
        success: false,
        error: `Server not connected: ${server.name}`,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }

    const tool = server.tools.find(t => t.name === toolName);
    if (!tool) {
      return {
        actionId,
        success: false,
        error: `Tool not found: ${toolName}`,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }

    try {
      // In real implementation, this would call the MCP tool via JSON-RPC
      
      // Simulate execution
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const result: MCPActionResult = {
        actionId,
        success: true,
        result: { message: `Executed ${toolName} successfully` },
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };

      this.actionHistory.push(result);
      return result;
    } catch (error) {
      const result: MCPActionResult = {
        actionId,
        success: false,
        error: error instanceof Error ? error.message : 'Execution failed',
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };

      this.actionHistory.push(result);
      return result;
    }
  }

  // Get server
  getServer(serverId: string): MCPServer | undefined {
    return this.servers.get(serverId);
  }

  // Get all servers
  getAllServers(): MCPServer[] {
    return Array.from(this.servers.values());
  }

  // Get servers by status
  getServersByStatus(status: MCPServer['status']): MCPServer[] {
    return Array.from(this.servers.values()).filter(s => s.status === status);
  }

  // Get connected servers
  getConnectedServers(): MCPServer[] {
    return this.getServersByStatus('connected');
  }

  // Remove server
  async removeServer(serverId: string): Promise<boolean> {
    const server = this.servers.get(serverId);
    if (!server) return false;

    if (server.status === 'connected') {
      await this.disconnect(serverId);
    }

    return this.servers.delete(serverId);
  }

  // Get templates
  getTemplates(): MCPServerTemplate[] {
    return Array.from(this.templates.values());
  }

  // Get templates by category
  getTemplatesByCategory(category: string): MCPServerTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.category === category);
  }

  // Get popular templates
  getPopularTemplates(): MCPServerTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.popular);
  }

  // Search templates
  searchTemplates(query: string): MCPServerTemplate[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.templates.values()).filter(t =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.category.toLowerCase().includes(lowerQuery)
    );
  }

  // Get available tools across all connected servers
  getAvailableTools(): Array<{ server: MCPServer; tool: MCPTool }> {
    const tools: Array<{ server: MCPServer; tool: MCPTool }> = [];

    this.getServersByStatus('connected').forEach(server => {
      server.tools.forEach(tool => {
        tools.push({ server, tool });
      });
    });

    return tools;
  }

  // Find tool by name
  findTool(toolName: string): { server: MCPServer; tool: MCPTool } | undefined {
    for (const server of this.getServersByStatus('connected')) {
      const tool = server.tools.find(t => t.name === toolName);
      if (tool) {
        return { server, tool };
      }
    }
    return undefined;
  }

  // Get action history
  getActionHistory(limit: number = 100): MCPActionResult[] {
    return this.actionHistory.slice(-limit);
  }

  // Get server statistics
  getServerStats(serverId: string): {
    totalActions: number;
    successfulActions: number;
    failedActions: number;
    avgDuration: number;
  } | undefined {
    const serverActions = this.actionHistory.filter(a => {
      const server = this.servers.get(serverId);
      return server !== undefined;
    });

    if (serverActions.length === 0) return undefined;

    const successful = serverActions.filter(a => a.success);
    const failed = serverActions.filter(a => !a.success);
    const totalDuration = serverActions.reduce((sum, a) => sum + a.duration, 0);

    return {
      totalActions: serverActions.length,
      successfulActions: successful.length,
      failedActions: failed.length,
      avgDuration: totalDuration / serverActions.length,
    };
  }

  // Health check all servers
  async healthCheck(): Promise<Record<string, { status: MCPServer['status']; healthy: boolean }>> {
    const health: Record<string, { status: MCPServer['status']; healthy: boolean }> = {};

    for (const [id, server] of this.servers) {
      // Try to reconnect if disconnected
      if (server.status === 'disconnected') {
        await this.connect(id);
      }

      health[id] = {
        status: server.status,
        healthy: server.status === 'connected',
      };
    }

    return health;
  }

  // Get categories
  getCategories(): string[] {
    const categories = new Set<string>();
    this.templates.forEach(t => categories.add(t.category));
    return Array.from(categories);
  }
}

// Export singleton instance
export const mcpManager = new MCPManager();
