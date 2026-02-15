// Agent Router - Routes commands to specialized agents
// Handles agent selection, load balancing, and execution coordination

import { ParsedIntent } from './IntentParser';

export type AgentStatus = 'idle' | 'busy' | 'error' | 'offline';

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  capabilities: string[];
  currentLoad: number;
  maxLoad: number;
  lastUsed: Date | null;
  successRate: number;
  avgResponseTime: number;
  config: AgentConfig;
}

export type AgentType = 
  | 'email' 
  | 'browser' 
  | 'file' 
  | 'calendar' 
  | 'code' 
  | 'data' 
  | 'workflow'
  | 'general';

export interface AgentConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  retries?: number;
  priority?: number;
}

export interface AgentResult {
  success: boolean;
  agentId: string;
  action: string;
  output: any;
  error?: string;
  duration: number;
  tokensUsed?: number;
  followUp?: {
    needed: boolean;
    question?: string;
    options?: string[];
  };
}

export interface RoutingDecision {
  selectedAgent: Agent;
  alternativeAgents: Agent[];
  reason: string;
  confidence: number;
}

// Agent capability mapping
const agentCapabilities: Map<AgentType, string[]> = new Map([
  ['email', [
    'compose_email',
    'send_email',
    'read_email',
    'reply_email',
    'forward_email',
    'schedule_email',
    'categorize_email',
    'search_email',
    'summarize_email',
  ]],
  ['browser', [
    'navigate',
    'click',
    'type',
    'scrape',
    'screenshot',
    'fill_form',
    'download',
    'monitor',
    'extract_data',
  ]],
  ['file', [
    'read_file',
    'write_file',
    'delete_file',
    'move_file',
    'copy_file',
    'search_files',
    'organize_files',
    'convert_file',
    'compress_file',
  ]],
  ['calendar', [
    'create_event',
    'update_event',
    'delete_event',
    'find_time',
    'schedule_meeting',
    'set_reminder',
    'list_events',
    'sync_calendar',
  ]],
  ['code', [
    'generate_code',
    'review_code',
    'debug_code',
    'test_code',
    'document_code',
    'refactor_code',
    'deploy_code',
    'run_code',
  ]],
  ['data', [
    'analyze_data',
    'transform_data',
    'visualize_data',
    'query_database',
    'export_data',
    'import_data',
    'clean_data',
    'predict',
  ]],
  ['workflow', [
    'create_workflow',
    'run_workflow',
    'schedule_workflow',
    'monitor_workflow',
    'optimize_workflow',
  ]],
  ['general', [
    'ask_question',
    'general_command',
    'chat',
    'explain',
    'summarize',
  ]],
]);

// Intent to capability mapping
const intentCapabilityMap: Record<string, string> = {
  compose_email: 'compose_email',
  send_email: 'send_email',
  schedule_meeting: 'schedule_meeting',
  search_files: 'search_files',
  analyze_data: 'analyze_data',
  generate_code: 'generate_code',
  scrape_website: 'scrape',
  create_document: 'write_file',
  organize_files: 'organize_files',
  set_reminder: 'set_reminder',
  query_database: 'query_database',
  deploy_code: 'deploy_code',
  run_test: 'test_code',
  create_workflow: 'create_workflow',
  train_agent: 'general_command',
  ask_question: 'ask_question',
  general_command: 'general_command',
};

export class AgentRouter {
  private agents: Map<string, Agent> = new Map();
  private executionHistory: Array<{
    intent: ParsedIntent;
    agent: Agent;
    result: AgentResult;
    timestamp: Date;
  }> = [];

  constructor() {
    this.initializeAgents();
  }

  // Initialize default agents
  private initializeAgents(): void {
    const defaultAgents: Agent[] = [
      {
        id: 'email-agent-1',
        name: 'Email Agent',
        type: 'email',
        status: 'idle',
        capabilities: agentCapabilities.get('email') || [],
        currentLoad: 0,
        maxLoad: 10,
        lastUsed: null,
        successRate: 0.95,
        avgResponseTime: 1500,
        config: { model: 'claude-3-sonnet', temperature: 0.3, priority: 1 },
      },
      {
        id: 'browser-agent-1',
        name: 'Browser Agent',
        type: 'browser',
        status: 'idle',
        capabilities: agentCapabilities.get('browser') || [],
        currentLoad: 0,
        maxLoad: 5,
        lastUsed: null,
        successRate: 0.92,
        avgResponseTime: 3000,
        config: { model: 'claude-3-opus', temperature: 0.2, priority: 2 },
      },
      {
        id: 'file-agent-1',
        name: 'File Agent',
        type: 'file',
        status: 'idle',
        capabilities: agentCapabilities.get('file') || [],
        currentLoad: 0,
        maxLoad: 15,
        lastUsed: null,
        successRate: 0.98,
        avgResponseTime: 500,
        config: { model: 'claude-3-haiku', temperature: 0.1, priority: 1 },
      },
      {
        id: 'calendar-agent-1',
        name: 'Calendar Agent',
        type: 'calendar',
        status: 'idle',
        capabilities: agentCapabilities.get('calendar') || [],
        currentLoad: 0,
        maxLoad: 10,
        lastUsed: null,
        successRate: 0.97,
        avgResponseTime: 800,
        config: { model: 'claude-3-sonnet', temperature: 0.2, priority: 1 },
      },
      {
        id: 'code-agent-1',
        name: 'Code Agent',
        type: 'code',
        status: 'idle',
        capabilities: agentCapabilities.get('code') || [],
        currentLoad: 0,
        maxLoad: 8,
        lastUsed: null,
        successRate: 0.94,
        avgResponseTime: 2500,
        config: { model: 'claude-3-opus', temperature: 0.4, priority: 2 },
      },
      {
        id: 'data-agent-1',
        name: 'Data Agent',
        type: 'data',
        status: 'idle',
        capabilities: agentCapabilities.get('data') || [],
        currentLoad: 0,
        maxLoad: 8,
        lastUsed: null,
        successRate: 0.93,
        avgResponseTime: 4000,
        config: { model: 'claude-3-sonnet', temperature: 0.3, priority: 2 },
      },
      {
        id: 'workflow-agent-1',
        name: 'Workflow Agent',
        type: 'workflow',
        status: 'idle',
        capabilities: agentCapabilities.get('workflow') || [],
        currentLoad: 0,
        maxLoad: 5,
        lastUsed: null,
        successRate: 0.91,
        avgResponseTime: 5000,
        config: { model: 'claude-3-opus', temperature: 0.5, priority: 3 },
      },
      {
        id: 'general-agent-1',
        name: 'General Agent',
        type: 'general',
        status: 'idle',
        capabilities: agentCapabilities.get('general') || [],
        currentLoad: 0,
        maxLoad: 20,
        lastUsed: null,
        successRate: 0.96,
        avgResponseTime: 1000,
        config: { model: 'claude-3-sonnet', temperature: 0.5, priority: 0 },
      },
    ];

    defaultAgents.forEach(agent => {
      this.agents.set(agent.id, agent);
    });
  }

  // Route intent to appropriate agent
  route(intent: ParsedIntent): RoutingDecision {
    const capability = intentCapabilityMap[intent.primaryIntent] || 'general_command';
    
    // Find agents with the required capability
    const capableAgents = Array.from(this.agents.values())
      .filter(agent => 
        agent.capabilities.includes(capability) && 
        agent.status !== 'offline'
      );

    if (capableAgents.length === 0) {
      // Fallback to general agent
      const generalAgent = this.agents.get('general-agent-1')!;
      return {
        selectedAgent: generalAgent,
        alternativeAgents: [],
        reason: 'No specialized agent available, using general agent',
        confidence: 0.5,
      };
    }

    // Score agents based on multiple factors
    const scoredAgents = capableAgents.map(agent => ({
      agent,
      score: this.scoreAgent(agent, intent),
    }));

    // Sort by score (higher is better)
    scoredAgents.sort((a, b) => b.score - a.score);

    const selectedAgent = scoredAgents[0].agent;
    const alternativeAgents = scoredAgents.slice(1, 3).map(s => s.agent);

    return {
      selectedAgent,
      alternativeAgents,
      reason: this.explainSelection(selectedAgent, intent),
      confidence: Math.min(0.95, scoredAgents[0].score / 100),
    };
  }

  // Score agent based on multiple factors
  private scoreAgent(agent: Agent, intent: ParsedIntent): number {
    let score = 0;

    // Base score from success rate (0-30 points)
    score += agent.successRate * 30;

    // Load factor (0-20 points, less load = higher score)
    const loadPercentage = agent.currentLoad / agent.maxLoad;
    score += (1 - loadPercentage) * 20;

    // Response time factor (0-15 points, faster = higher score)
    const normalizedResponseTime = Math.max(0, 1 - (agent.avgResponseTime / 10000));
    score += normalizedResponseTime * 15;

    // Priority factor (0-10 points)
    score += (agent.config.priority || 0) * 5;

    // Capability match bonus (0-15 points)
    const capability = intentCapabilityMap[intent.primaryIntent];
    if (agent.capabilities.includes(capability)) {
      score += 15;
    }

    // Intent confidence alignment (0-10 points)
    score += intent.confidence * 10;

    return score;
  }

  // Explain why agent was selected
  private explainSelection(agent: Agent, intent: ParsedIntent): string {
    const capability = intentCapabilityMap[intent.primaryIntent];
    const reasons: string[] = [];

    if (agent.capabilities.includes(capability)) {
      reasons.push(`has '${capability}' capability`);
    }
    if (agent.successRate > 0.9) {
      reasons.push(`high success rate (${(agent.successRate * 100).toFixed(0)}%)`);
    }
    if (agent.currentLoad < agent.maxLoad * 0.5) {
      reasons.push('low current load');
    }
    if (agent.avgResponseTime < 2000) {
      reasons.push('fast response time');
    }

    return reasons.length > 0 
      ? `Selected because it ${reasons.join(', ')}`
      : 'Best available agent for this task';
  }

  // Execute intent with selected agent
  async execute(
    intent: ParsedIntent, 
    agent: Agent,
    executor: (intent: ParsedIntent, agent: Agent) => Promise<AgentResult>
  ): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      // Update agent status
      agent.status = 'busy';
      agent.currentLoad++;

      // Execute
      const result = await executor(intent, agent);

      // Update agent metrics
      agent.lastUsed = new Date();
      agent.currentLoad--;
      agent.status = agent.currentLoad > 0 ? 'busy' : 'idle';

      // Update success rate (exponential moving average)
      if (result.success) {
        agent.successRate = agent.successRate * 0.95 + 1 * 0.05;
      } else {
        agent.successRate = agent.successRate * 0.95 + 0 * 0.05;
      }

      // Update average response time
      const duration = Date.now() - startTime;
      agent.avgResponseTime = agent.avgResponseTime * 0.9 + duration * 0.1;

      // Record in history
      this.executionHistory.push({
        intent,
        agent,
        result,
        timestamp: new Date(),
      });

      return result;
    } catch (error) {
      // Handle error
      agent.currentLoad--;
      agent.status = 'error';

      const errorResult: AgentResult = {
        success: false,
        agentId: agent.id,
        action: intent.action,
        output: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      };

      this.executionHistory.push({
        intent,
        agent,
        result: errorResult,
        timestamp: new Date(),
      });

      return errorResult;
    }
  }

  // Get agent by ID
  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  // Get all agents
  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  // Get agents by type
  getAgentsByType(type: AgentType): Agent[] {
    return Array.from(this.agents.values()).filter(agent => agent.type === type);
  }

  // Get agent status
  getAgentStatus(agentId: string): AgentStatus | undefined {
    return this.agents.get(agentId)?.status;
  }

  // Update agent config
  updateAgentConfig(agentId: string, config: Partial<AgentConfig>): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;
    
    agent.config = { ...agent.config, ...config };
    return true;
  }

  // Add custom agent
  addAgent(agent: Agent): void {
    this.agents.set(agent.id, agent);
  }

  // Remove agent
  removeAgent(agentId: string): boolean {
    return this.agents.delete(agentId);
  }

  // Get execution history
  getHistory(limit: number = 100): typeof this.executionHistory {
    return this.executionHistory.slice(-limit);
  }

  // Get agent statistics
  getAgentStats(agentId: string): {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    avgDuration: number;
  } | undefined {
    const agentHistory = this.executionHistory.filter(h => h.agent.id === agentId);
    
    if (agentHistory.length === 0) return undefined;

    const successful = agentHistory.filter(h => h.result.success);
    const failed = agentHistory.filter(h => !h.result.success);
    const totalDuration = agentHistory.reduce((sum, h) => sum + h.result.duration, 0);

    return {
      totalExecutions: agentHistory.length,
      successfulExecutions: successful.length,
      failedExecutions: failed.length,
      avgDuration: totalDuration / agentHistory.length,
    };
  }

  // Health check all agents
  healthCheck(): Record<string, { status: AgentStatus; healthy: boolean }> {
    const health: Record<string, { status: AgentStatus; healthy: boolean }> = {};
    
    this.agents.forEach((agent, id) => {
      health[id] = {
        status: agent.status,
        healthy: agent.status !== 'offline' && agent.successRate > 0.5,
      };
    });

    return health;
  }
}

// Export singleton instance
export const agentRouter = new AgentRouter();
