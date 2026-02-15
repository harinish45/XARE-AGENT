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

  // Web Scraping & Browser Automation
  {
    id: 'apify',
    name: 'Apify',
    description: 'Web scraping, data extraction, and browser automation at scale',
    category: 'web-scraping',
    icon: '🕷️',
    popular: true,
    config: { command: 'mcp-apify', args: [], env: { APIFY_API_TOKEN: '' } },
    tools: [
      { name: 'run_actor', description: 'Run an Apify actor/scraper', category: 'scraping', riskLevel: 'medium' },
      { name: 'get_dataset', description: 'Get scraped dataset results', category: 'data', riskLevel: 'low' },
      { name: 'list_actors', description: 'List available actors', category: 'scraping', riskLevel: 'low' },
      { name: 'scrape_url', description: 'Scrape a single URL', category: 'scraping', riskLevel: 'low' },
      { name: 'crawl_website', description: 'Crawl an entire website', category: 'scraping', riskLevel: 'medium' },
      { name: 'get_key_value_store', description: 'Get key-value store data', category: 'data', riskLevel: 'low' },
    ],
  },
  {
    id: 'browserless',
    name: 'Browserless',
    description: 'Headless Chrome API — screenshots, PDFs, and JS execution',
    category: 'web-scraping',
    icon: '🖥️',
    popular: false,
    config: { command: 'mcp-browserless', args: [] },
    tools: [
      { name: 'screenshot', description: 'Take a screenshot of a URL', category: 'capture', riskLevel: 'low' },
      { name: 'pdf', description: 'Generate PDF from URL', category: 'capture', riskLevel: 'low' },
      { name: 'scrape', description: 'Scrape page content', category: 'scraping', riskLevel: 'low' },
      { name: 'execute_js', description: 'Execute JavaScript on a page', category: 'automation', riskLevel: 'high' },
    ],
  },
  {
    id: 'firecrawl',
    name: 'Firecrawl',
    description: 'Convert any URL into clean, LLM-ready markdown',
    category: 'web-scraping',
    icon: '🔥',
    popular: true,
    config: { command: 'mcp-firecrawl', args: [] },
    tools: [
      { name: 'scrape', description: 'Scrape a URL to markdown', category: 'scraping', riskLevel: 'low' },
      { name: 'crawl', description: 'Crawl and extract site content', category: 'scraping', riskLevel: 'medium' },
      { name: 'search', description: 'Search and extract content', category: 'search', riskLevel: 'low' },
      { name: 'map', description: 'Map site structure', category: 'analysis', riskLevel: 'low' },
    ],
  },

  // Social Media
  {
    id: 'twitter',
    name: 'Twitter / X',
    description: 'Post tweets, monitor mentions, search the timeline',
    category: 'social-media',
    icon: '🐦',
    popular: true,
    config: { command: 'mcp-twitter', args: [], env: { TWITTER_BEARER_TOKEN: '' } },
    tools: [
      { name: 'post_tweet', description: 'Post a new tweet', category: 'posting', riskLevel: 'medium' },
      { name: 'search_tweets', description: 'Search tweets by keyword', category: 'search', riskLevel: 'low' },
      { name: 'get_timeline', description: 'Get user timeline', category: 'reading', riskLevel: 'low' },
      { name: 'get_mentions', description: 'Get mentions of user', category: 'reading', riskLevel: 'low' },
      { name: 'reply_tweet', description: 'Reply to a tweet', category: 'posting', riskLevel: 'medium' },
      { name: 'like_tweet', description: 'Like a tweet', category: 'engagement', riskLevel: 'low' },
    ],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Post updates, get profile data, and grow your network',
    category: 'social-media',
    icon: '💼',
    popular: true,
    config: { command: 'mcp-linkedin', args: [] },
    tools: [
      { name: 'post_update', description: 'Publish a LinkedIn post', category: 'posting', riskLevel: 'medium' },
      { name: 'get_profile', description: 'Get user profile data', category: 'reading', riskLevel: 'low' },
      { name: 'search_people', description: 'Search for people', category: 'search', riskLevel: 'low' },
      { name: 'send_message', description: 'Send a direct message', category: 'messaging', riskLevel: 'medium' },
    ],
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'Build bots, send messages, manage servers',
    category: 'social-media',
    icon: '🎮',
    popular: true,
    config: { command: 'mcp-discord', args: [] },
    tools: [
      { name: 'send_message', description: 'Send a message to a channel', category: 'messaging', riskLevel: 'low' },
      { name: 'get_channels', description: 'List server channels', category: 'reading', riskLevel: 'low' },
      { name: 'create_thread', description: 'Create a thread', category: 'threads', riskLevel: 'low' },
      { name: 'add_reaction', description: 'Add a reaction to message', category: 'engagement', riskLevel: 'low' },
    ],
  },
  {
    id: 'telegram',
    name: 'Telegram',
    description: 'Build Telegram bots and automate messages',
    category: 'social-media',
    icon: '✈️',
    popular: false,
    config: { command: 'mcp-telegram', args: [] },
    tools: [
      { name: 'send_message', description: 'Send a message', category: 'messaging', riskLevel: 'low' },
      { name: 'send_photo', description: 'Send a photo', category: 'media', riskLevel: 'low' },
      { name: 'get_updates', description: 'Get bot updates', category: 'reading', riskLevel: 'low' },
    ],
  },

  // Email & Communication
  {
    id: 'sendgrid',
    name: 'SendGrid',
    description: 'Transactional and marketing email delivery at scale',
    category: 'communication',
    icon: '📬',
    popular: true,
    config: { command: 'mcp-sendgrid', args: [] },
    tools: [
      { name: 'send_email', description: 'Send an email', category: 'email', riskLevel: 'medium' },
      { name: 'create_template', description: 'Create email template', category: 'templates', riskLevel: 'low' },
      { name: 'get_stats', description: 'Get email statistics', category: 'analytics', riskLevel: 'low' },
      { name: 'manage_contacts', description: 'Manage contact lists', category: 'contacts', riskLevel: 'low' },
    ],
  },
  {
    id: 'resend',
    name: 'Resend',
    description: 'Modern email API for developers',
    category: 'communication',
    icon: '✉️',
    popular: false,
    config: { command: 'mcp-resend', args: [] },
    tools: [
      { name: 'send_email', description: 'Send an email', category: 'email', riskLevel: 'medium' },
      { name: 'get_email', description: 'Get email by ID', category: 'email', riskLevel: 'low' },
    ],
  },
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'SMS, voice, and WhatsApp messaging APIs',
    category: 'communication',
    icon: '📱',
    popular: true,
    config: { command: 'mcp-twilio', args: [] },
    tools: [
      { name: 'send_sms', description: 'Send an SMS message', category: 'sms', riskLevel: 'medium' },
      { name: 'make_call', description: 'Make a voice call', category: 'voice', riskLevel: 'high' },
      { name: 'send_whatsapp', description: 'Send WhatsApp message', category: 'messaging', riskLevel: 'medium' },
    ],
  },

  // Additional Databases
  {
    id: 'supabase',
    name: 'Supabase',
    description: 'Open-source Firebase alternative with PostgreSQL',
    category: 'database',
    icon: '⚡',
    popular: true,
    config: { command: 'mcp-supabase', args: [] },
    tools: [
      { name: 'query', description: 'Execute SQL query', category: 'database', riskLevel: 'medium' },
      { name: 'insert', description: 'Insert rows', category: 'database', riskLevel: 'medium' },
      { name: 'update', description: 'Update rows', category: 'database', riskLevel: 'medium' },
      { name: 'delete', description: 'Delete rows', category: 'database', riskLevel: 'high' },
      { name: 'rpc', description: 'Call database function', category: 'database', riskLevel: 'medium' },
      { name: 'storage_upload', description: 'Upload file to storage', category: 'storage', riskLevel: 'low' },
    ],
  },
  {
    id: 'neon',
    name: 'Neon',
    description: 'Serverless Postgres with branching and autoscaling',
    category: 'database',
    icon: '🟢',
    popular: false,
    config: { command: 'mcp-neon', args: [] },
    tools: [
      { name: 'query', description: 'Execute SQL query', category: 'database', riskLevel: 'medium' },
      { name: 'create_branch', description: 'Create database branch', category: 'management', riskLevel: 'medium' },
    ],
  },
  {
    id: 'upstash',
    name: 'Upstash Redis',
    description: 'Serverless Redis — caching and rate limiting',
    category: 'database',
    icon: '🔴',
    popular: false,
    config: { command: 'mcp-upstash', args: [] },
    tools: [
      { name: 'get', description: 'Get value', category: 'cache', riskLevel: 'low' },
      { name: 'set', description: 'Set value', category: 'cache', riskLevel: 'low' },
      { name: 'del', description: 'Delete value', category: 'cache', riskLevel: 'medium' },
      { name: 'incr', description: 'Increment counter', category: 'cache', riskLevel: 'low' },
    ],
  },

  // Developer Tools
  {
    id: 'vercel',
    name: 'Vercel',
    description: 'Deploy, preview, and ship web applications',
    category: 'development',
    icon: '▲',
    popular: true,
    config: { command: 'mcp-vercel', args: [] },
    tools: [
      { name: 'deploy', description: 'Create a deployment', category: 'deployment', riskLevel: 'high' },
      { name: 'list_projects', description: 'List all projects', category: 'projects', riskLevel: 'low' },
      { name: 'get_logs', description: 'Get deployment logs', category: 'monitoring', riskLevel: 'low' },
      { name: 'set_env_var', description: 'Set environment variable', category: 'config', riskLevel: 'medium' },
    ],
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    description: 'CDN, Workers, R2, and DNS management',
    category: 'development',
    icon: '🛡️',
    popular: false,
    config: { command: 'mcp-cloudflare', args: [] },
    tools: [
      { name: 'deploy_worker', description: 'Deploy a Worker', category: 'workers', riskLevel: 'high' },
      { name: 'purge_cache', description: 'Purge CDN cache', category: 'cdn', riskLevel: 'medium' },
      { name: 'manage_dns', description: 'Manage DNS records', category: 'dns', riskLevel: 'high' },
      { name: 'upload_r2', description: 'Upload to R2 storage', category: 'storage', riskLevel: 'low' },
    ],
  },

  // Productivity
  {
    id: 'google-sheets',
    name: 'Google Sheets',
    description: 'Read, write, and manage spreadsheet data',
    category: 'productivity',
    icon: '📊',
    popular: true,
    config: { command: 'mcp-google-sheets', args: [] },
    tools: [
      { name: 'read_sheet', description: 'Read spreadsheet data', category: 'data', riskLevel: 'low' },
      { name: 'write_cells', description: 'Write data to cells', category: 'data', riskLevel: 'medium' },
      { name: 'create_sheet', description: 'Create a new spreadsheet', category: 'management', riskLevel: 'low' },
      { name: 'append_rows', description: 'Append rows to sheet', category: 'data', riskLevel: 'low' },
    ],
  },
  {
    id: 'airtable',
    name: 'Airtable',
    description: 'Spreadsheet-database hybrid for custom apps',
    category: 'productivity',
    icon: '📋',
    popular: true,
    config: { command: 'mcp-airtable', args: [] },
    tools: [
      { name: 'list_records', description: 'List records in a table', category: 'data', riskLevel: 'low' },
      { name: 'create_record', description: 'Create a new record', category: 'data', riskLevel: 'low' },
      { name: 'update_record', description: 'Update a record', category: 'data', riskLevel: 'medium' },
      { name: 'delete_record', description: 'Delete a record', category: 'data', riskLevel: 'high' },
    ],
  },

  // Search & Research
  {
    id: 'tavily',
    name: 'Tavily',
    description: 'AI-optimized search API built for agents and RAG',
    category: 'ai',
    icon: '🌟',
    popular: true,
    config: { command: 'mcp-tavily', args: [] },
    tools: [
      { name: 'search', description: 'Search the web', category: 'search', riskLevel: 'low' },
      { name: 'extract', description: 'Extract content from URL', category: 'scraping', riskLevel: 'low' },
      { name: 'qna', description: 'Get direct answer to question', category: 'search', riskLevel: 'low' },
    ],
  },
  {
    id: 'brave-search',
    name: 'Brave Search',
    description: 'Privacy-first web search API',
    category: 'ai',
    icon: '🦁',
    popular: false,
    config: { command: 'mcp-brave-search', args: [] },
    tools: [
      { name: 'web_search', description: 'Search the web', category: 'search', riskLevel: 'low' },
      { name: 'news_search', description: 'Search news articles', category: 'search', riskLevel: 'low' },
      { name: 'image_search', description: 'Search images', category: 'search', riskLevel: 'low' },
    ],
  },

  // AI & ML Models
  {
    id: 'huggingface',
    name: 'Hugging Face',
    description: 'Open-source model inference and datasets',
    category: 'ai',
    icon: '🤗',
    popular: true,
    config: { command: 'mcp-huggingface', args: [] },
    tools: [
      { name: 'inference', description: 'Run model inference', category: 'inference', riskLevel: 'low' },
      { name: 'text_generation', description: 'Generate text', category: 'generation', riskLevel: 'low' },
      { name: 'list_models', description: 'List available models', category: 'models', riskLevel: 'low' },
      { name: 'embeddings', description: 'Generate embeddings', category: 'vectors', riskLevel: 'low' },
    ],
  },
  {
    id: 'replicate',
    name: 'Replicate',
    description: 'Run open-source AI models in the cloud',
    category: 'ai',
    icon: '🔄',
    popular: false,
    config: { command: 'mcp-replicate', args: [] },
    tools: [
      { name: 'run_prediction', description: 'Run a model prediction', category: 'inference', riskLevel: 'low' },
      { name: 'list_models', description: 'List available models', category: 'models', riskLevel: 'low' },
      { name: 'get_prediction', description: 'Get prediction result', category: 'inference', riskLevel: 'low' },
    ],
  },

  // Payments
  {
    id: 'lemonsqueezy',
    name: 'LemonSqueezy',
    description: 'Digital product sales and subscription management',
    category: 'payments',
    icon: '🍋',
    popular: false,
    config: { command: 'mcp-lemonsqueezy', args: [] },
    tools: [
      { name: 'list_products', description: 'List all products', category: 'products', riskLevel: 'low' },
      { name: 'create_checkout', description: 'Create checkout link', category: 'checkout', riskLevel: 'low' },
      { name: 'get_orders', description: 'Get recent orders', category: 'orders', riskLevel: 'low' },
    ],
  },

  // Analytics
  {
    id: 'posthog',
    name: 'PostHog',
    description: 'Product analytics, session replays, and feature flags',
    category: 'analytics',
    icon: '🦔',
    popular: false,
    config: { command: 'mcp-posthog', args: [] },
    tools: [
      { name: 'capture_event', description: 'Track an event', category: 'events', riskLevel: 'low' },
      { name: 'get_insights', description: 'Get analytics insights', category: 'analytics', riskLevel: 'low' },
      { name: 'check_feature_flag', description: 'Check feature flag status', category: 'flags', riskLevel: 'low' },
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
