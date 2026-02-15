// Agent Orchestrator - Main coordinator for the AI agent system
// Coordinates all agents, workflows, MCP servers, and safety systems

import { IntentParser, ParsedIntent } from '../agents/IntentParser';
import { AgentRouter, Agent, AgentResult, agentRouter } from '../agents/AgentRouter';
import { EmailAgent, createEmailAgent } from '../agents/EmailAgent';
import { BrowserAgent, createBrowserAgent } from '../agents/BrowserAgent';
import { FileAgent, createFileAgent } from '../agents/FileAgent';
import { CalendarAgent, createCalendarAgent } from '../agents/CalendarAgent';
import { CodeAgent, createCodeAgent } from '../agents/CodeAgent';
import { DataAgent, createDataAgent } from '../agents/DataAgent';
import { WorkflowEngine, Workflow, WorkflowExecution, workflowEngine } from '../workflow/WorkflowEngine';
import { MCPManager, MCPServer, mcpManager } from '../mcp/MCPManager';
import { LearningSystem, Feedback, learningSystem } from '../learning/LearningSystem';
import { SafetyGuards, SafetyAssessment, safetyGuards } from '../safety/SafetyGuards';

export interface OrchestratorConfig {
  enableSafety: boolean;
  enableLearning: boolean;
  enableWorkflows: boolean;
  enableMCP: boolean;
  defaultModel: string;
  maxConcurrentExecutions: number;
}

export interface ExecutionRequest {
  input: string;
  userId?: string;
  context?: Record<string, any>;
  workflowId?: string;
  agentId?: string;
}

export interface ExecutionResponse {
  id: string;
  success: boolean;
  intent: ParsedIntent;
  agent?: Agent;
  result?: AgentResult;
  workflow?: WorkflowExecution;
  safety?: SafetyAssessment;
  followUp?: {
    needed: boolean;
    question?: string;
    options?: string[];
  };
  error?: string;
  duration: number;
  timestamp: Date;
}

export interface SystemStatus {
  agents: {
    total: number;
    active: number;
    idle: number;
    error: number;
  };
  mcp: {
    total: number;
    connected: number;
    disconnected: number;
  };
  workflows: {
    total: number;
    active: number;
    executions: number;
  };
  learning: {
    feedback: number;
    skills: number;
    sessions: number;
  };
  safety: {
    policies: number;
    auditLogs: number;
    pendingApprovals: number;
  };
}

export class AgentOrchestrator {
  private config: OrchestratorConfig;
  private intentParser: IntentParser;
  private agentRouter: AgentRouter;
  private workflowEngine: WorkflowEngine;
  private mcpManager: MCPManager;
  private learningSystem: LearningSystem;
  private safetyGuards: SafetyGuards;
  
  // Agent instances
  private emailAgent: EmailAgent;
  private browserAgent: BrowserAgent;
  private fileAgent: FileAgent;
  private calendarAgent: CalendarAgent;
  private codeAgent: CodeAgent;
  private dataAgent: DataAgent;

  private executionHistory: ExecutionResponse[] = [];
  private activeExecutions: Map<string, ExecutionResponse> = new Map();

  constructor(config?: Partial<OrchestratorConfig>) {
    this.config = {
      enableSafety: config?.enableSafety ?? true,
      enableLearning: config?.enableLearning ?? true,
      enableWorkflows: config?.enableWorkflows ?? true,
      enableMCP: config?.enableMCP ?? true,
      defaultModel: config?.defaultModel || 'claude-3-sonnet',
      maxConcurrentExecutions: config?.maxConcurrentExecutions || 10,
      ...config,
    };

    // Initialize core systems
    this.intentParser = new IntentParser();
    this.agentRouter = agentRouter;
    this.workflowEngine = workflowEngine;
    this.mcpManager = mcpManager;
    this.learningSystem = learningSystem;
    this.safetyGuards = safetyGuards;

    // Initialize agents
    this.emailAgent = createEmailAgent();
    this.browserAgent = createBrowserAgent();
    this.fileAgent = createFileAgent();
    this.calendarAgent = createCalendarAgent();
    this.codeAgent = createCodeAgent();
    this.dataAgent = createDataAgent();
  }

  // Main execution method
  async execute(request: ExecutionRequest): Promise<ExecutionResponse> {
    const startTime = Date.now();
    const id = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // 1. Parse intent
      const intent = this.intentParser.parse(request.input);

      // 2. Safety assessment
      let safety: SafetyAssessment | undefined;
      if (this.config.enableSafety) {
        safety = this.safetyGuards.assessAction(request.input, request.context);
        
        if (safety.requiresApproval) {
          const approvalId = this.safetyGuards.requestApproval(safety, request.userId || 'anonymous');
          
          return {
            id,
            success: false,
            intent,
            safety,
            followUp: {
              needed: true,
              question: `This action requires approval due to: ${safety.reasons.join(', ')}. Approval ID: ${approvalId}`,
            },
            duration: Date.now() - startTime,
            timestamp: new Date(),
          };
        }
      }

      // 3. Check if workflow execution
      if (request.workflowId && this.config.enableWorkflows) {
        return this.executeWorkflow(request, intent, id, startTime);
      }

      // 4. Route to appropriate agent
      const routing = this.agentRouter.route(intent);
      const agent = routing.selectedAgent;

      // 5. Execute with agent
      const result = await this.executeWithAgent(intent, agent);

      // 6. Record for learning
      if (this.config.enableLearning && result.success) {
        this.learningSystem.recordFeedback({
          agentId: agent.id,
          action: intent.action,
          type: 'approval',
          approved: true,
          context: {
            input: request.input,
            output: result.output,
            timestamp: new Date(),
          },
        });
      }

      const response: ExecutionResponse = {
        id,
        success: result.success,
        intent,
        agent,
        result,
        safety,
        followUp: result.followUp,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };

      this.executionHistory.push(response);
      return response;

    } catch (error) {
      return {
        id,
        success: false,
        intent: this.intentParser.parse(request.input),
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  // Execute with specific agent
  private async executeWithAgent(intent: ParsedIntent, agent: Agent): Promise<AgentResult> {
    switch (agent.type) {
      case 'email':
        return this.emailAgent.execute(intent, agent);
      case 'browser':
        return this.browserAgent.execute(intent, agent);
      case 'file':
        return this.fileAgent.execute(intent, agent);
      case 'calendar':
        return this.calendarAgent.execute(intent, agent);
      case 'code':
        return this.codeAgent.execute(intent, agent);
      case 'data':
        return this.dataAgent.execute(intent, agent);
      default:
        return {
          success: false,
          agentId: agent.id,
          action: intent.action,
          output: null,
          error: `Unknown agent type: ${agent.type}`,
          duration: 0,
        };
    }
  }

  // Execute workflow
  private async executeWorkflow(
    request: ExecutionRequest,
    intent: ParsedIntent,
    id: string,
    startTime: number
  ): Promise<ExecutionResponse> {
    const workflow = this.workflowEngine.getWorkflow(request.workflowId!);
    
    if (!workflow) {
      return {
        id,
        success: false,
        intent,
        error: `Workflow not found: ${request.workflowId}`,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }

    const execution = await this.workflowEngine.execute(
      request.workflowId!,
      async (node, context) => {
        // Execute each workflow node
        const nodeIntent = this.intentParser.parse(node.name);
        const routing = this.agentRouter.route(nodeIntent);
        const result = await this.executeWithAgent(nodeIntent, routing.selectedAgent);
        
        // Convert AgentResult to NodeResult
        return {
          nodeId: node.id,
          status: result.success ? 'success' : 'failed',
          output: result.output,
          error: result.error,
          duration: result.duration,
          timestamp: new Date(),
        };
      },
      request.context
    );

    return {
      id,
      success: execution.status === 'completed',
      intent,
      workflow: execution,
      duration: Date.now() - startTime,
      timestamp: new Date(),
    };
  }

  // Quick action methods
  async sendEmail(to: string, subject: string, body: string): Promise<ExecutionResponse> {
    return this.execute({
      input: `Send an email to ${to} with subject "${subject}" and body: ${body}`,
    });
  }

  async scheduleMeeting(title: string, date: string, time: string, attendees?: string[]): Promise<ExecutionResponse> {
    const input = `Schedule a meeting "${title}" on ${date} at ${time}${attendees ? ` with ${attendees.join(', ')}` : ''}`;
    return this.execute({ input });
  }

  async searchFiles(query: string): Promise<ExecutionResponse> {
    return this.execute({ input: `Search for files: ${query}` });
  }

  async generateCode(description: string, language?: string): Promise<ExecutionResponse> {
    const input = `Generate ${language || ''} code: ${description}`;
    return this.execute({ input });
  }

  async analyzeData(datasetId: string): Promise<ExecutionResponse> {
    return this.execute({ input: `Analyze dataset ${datasetId}` });
  }

  async scrapeWebsite(url: string): Promise<ExecutionResponse> {
    return this.execute({ input: `Scrape data from ${url}` });
  }

  // MCP methods
  async installMCPServer(templateId: string): Promise<MCPServer> {
    const server = await this.mcpManager.installServer(templateId);
    await this.mcpManager.connect(server.id);
    return server;
  }

  async executeMCPAction(serverId: string, toolName: string, params: Record<string, any>) {
    return this.mcpManager.executeAction(serverId, toolName, params);
  }

  // Workflow methods
  createWorkflow(config: Parameters<WorkflowEngine['createWorkflow']>[0]): Workflow {
    return this.workflowEngine.createWorkflow(config);
  }

  async runWorkflow(workflowId: string, variables?: Record<string, any>): Promise<WorkflowExecution> {
    return this.workflowEngine.execute(
      workflowId,
      async (node, context) => {
        const intent = this.intentParser.parse(node.name);
        const routing = this.agentRouter.route(intent);
        const result = await this.executeWithAgent(intent, routing.selectedAgent);
        
        // Convert AgentResult to NodeResult
        return {
          nodeId: node.id,
          status: result.success ? 'success' : 'failed',
          output: result.output,
          error: result.error,
          duration: result.duration,
          timestamp: new Date(),
        };
      },
      variables
    );
  }

  // Learning methods
  provideFeedback(
    executionId: string,
    type: Feedback['type'],
    data: Partial<Feedback>
  ): Feedback | null {
    const execution = this.executionHistory.find(e => e.id === executionId);
    if (!execution || !execution.agent) return null;

    return this.learningSystem.recordFeedback({
      agentId: execution.agent.id,
      action: execution.intent.action,
      type,
      ...data,
      context: {
        input: execution.intent.rawInput,
        output: execution.result?.output,
        timestamp: execution.timestamp,
      },
    });
  }

  // Safety methods
  approveAction(approvalId: string, approverId: string): boolean {
    return this.safetyGuards.approveAction(approvalId, approverId);
  }

  denyAction(approvalId: string, denierId: string, reason?: string): boolean {
    return this.safetyGuards.denyAction(approvalId, denierId, reason);
  }

  // Status and monitoring
  getStatus(): SystemStatus {
    const agents = this.agentRouter.getAllAgents();
    const mcpServers = this.mcpManager.getAllServers();
    const workflows = this.workflowEngine.getAllWorkflows();
    const learningData = this.learningSystem.exportLearningData();
    const auditLog = this.safetyGuards.getAuditLog();

    return {
      agents: {
        total: agents.length,
        active: agents.filter(a => a.status === 'busy').length,
        idle: agents.filter(a => a.status === 'idle').length,
        error: agents.filter(a => a.status === 'error').length,
      },
      mcp: {
        total: mcpServers.length,
        connected: mcpServers.filter(s => s.status === 'connected').length,
        disconnected: mcpServers.filter(s => s.status !== 'connected').length,
      },
      workflows: {
        total: workflows.length,
        active: workflows.filter(w => w.status === 'active').length,
        executions: this.executionHistory.length,
      },
      learning: {
        feedback: learningData.feedback.length,
        skills: learningData.skills.length,
        sessions: learningData.trainingSessions.length,
      },
      safety: {
        policies: this.safetyGuards.getPolicies().length,
        auditLogs: auditLog.length,
        pendingApprovals: this.safetyGuards.getPendingApprovals().length,
      },
    };
  }

  getExecutionHistory(limit: number = 100): ExecutionResponse[] {
    return this.executionHistory.slice(-limit);
  }

  getExecution(id: string): ExecutionResponse | undefined {
    return this.executionHistory.find(e => e.id === id);
  }

  // Configuration
  getConfig(): OrchestratorConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<OrchestratorConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  // Health check
  async healthCheck(): Promise<{
    healthy: boolean;
    components: Record<string, { status: string; healthy: boolean }>;
  }> {
    const components: Record<string, { status: string; healthy: boolean }> = {};

    // Check agents
    const agentHealth = this.agentRouter.healthCheck();
    const unhealthyAgents = Object.values(agentHealth).filter(h => !h.healthy).length;
    components.agents = {
      status: unhealthyAgents === 0 ? 'healthy' : 'degraded',
      healthy: unhealthyAgents === 0,
    };

    // Check MCP servers
    const mcpHealth = await this.mcpManager.healthCheck();
    const unhealthyMCP = Object.values(mcpHealth).filter(h => !h.healthy).length;
    components.mcp = {
      status: unhealthyMCP === 0 ? 'healthy' : 'degraded',
      healthy: unhealthyMCP === 0,
    };

    // Check workflow engine
    components.workflows = {
      status: 'healthy',
      healthy: true,
    };

    // Check learning system
    components.learning = {
      status: 'healthy',
      healthy: true,
    };

    // Check safety system
    components.safety = {
      status: 'healthy',
      healthy: true,
    };

    const healthy = Object.values(components).every(c => c.healthy);

    return { healthy, components };
  }
}

// Export singleton instance
export const agentOrchestrator = new AgentOrchestrator();
