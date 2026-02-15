// Workflow Engine - Orchestrates multi-step agent workflows
// Executes DAG-based workflows with parallel processing and error handling

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'loop' | 'parallel' | 'delay' | 'webhook';
  name: string;
  config: Record<string, any>;
  position: { x: number; y: number };
  data?: any;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  condition?: (data: any) => boolean;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables: Record<string, any>;
  triggers: WorkflowTrigger[];
  status: 'draft' | 'active' | 'paused' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface WorkflowTrigger {
  type: 'manual' | 'schedule' | 'webhook' | 'event' | 'email';
  config: Record<string, any>;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';
  startedAt: Date;
  completedAt?: Date;
  currentNode: string | null;
  executedNodes: string[];
  results: Record<string, NodeResult>;
  variables: Record<string, any>;
  error?: string;
}

export interface NodeResult {
  nodeId: string;
  status: 'success' | 'failed' | 'skipped';
  output: any;
  error?: string;
  duration: number;
  timestamp: Date;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags?: string[];
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables?: Record<string, any>;
  estimatedDuration?: number;
}

// Built-in workflow templates
const workflowTemplates: WorkflowTemplate[] = [
  {
    id: 'email-triage',
    name: 'Email Triage',
    description: 'Automatically categorize and prioritize incoming emails',
    category: 'productivity',
    nodes: [
      { id: 'trigger', type: 'trigger', name: 'Email Received', config: { type: 'email' }, position: { x: 100, y: 100 } },
      { id: 'analyze', type: 'action', name: 'Analyze Content', config: { agent: 'email', action: 'analyze' }, position: { x: 300, y: 100 } },
      { id: 'categorize', type: 'action', name: 'Categorize', config: { agent: 'email', action: 'categorize' }, position: { x: 500, y: 100 } },
      { id: 'notify', type: 'action', name: 'Notify', config: { agent: 'general', action: 'notify' }, position: { x: 700, y: 100 } },
    ],
    edges: [
      { id: 'e1', source: 'trigger', target: 'analyze' },
      { id: 'e2', source: 'analyze', target: 'categorize' },
      { id: 'e3', source: 'categorize', target: 'notify' },
    ],
    variables: { categories: ['urgent', 'important', 'normal', 'low'] },
  },
  {
    id: 'daily-report',
    name: 'Daily Report',
    description: 'Generate and send a daily summary report',
    category: 'reporting',
    nodes: [
      { id: 'trigger', type: 'trigger', name: 'Schedule', config: { type: 'schedule', cron: '0 9 * * *' }, position: { x: 100, y: 100 } },
      { id: 'collect', type: 'action', name: 'Collect Data', config: { agent: 'data', action: 'collect' }, position: { x: 300, y: 100 } },
      { id: 'analyze', type: 'action', name: 'Analyze', config: { agent: 'data', action: 'analyze' }, position: { x: 500, y: 100 } },
      { id: 'generate', type: 'action', name: 'Generate Report', config: { agent: 'file', action: 'create' }, position: { x: 700, y: 100 } },
      { id: 'send', type: 'action', name: 'Send Email', config: { agent: 'email', action: 'send' }, position: { x: 900, y: 100 } },
    ],
    edges: [
      { id: 'e1', source: 'trigger', target: 'collect' },
      { id: 'e2', source: 'collect', target: 'analyze' },
      { id: 'e3', source: 'analyze', target: 'generate' },
      { id: 'e4', source: 'generate', target: 'send' },
    ],
    variables: { recipients: [], metrics: [] },
  },
  {
    id: 'lead-qualification',
    name: 'Lead Qualification',
    description: 'Qualify leads from form submissions',
    category: 'sales',
    nodes: [
      { id: 'trigger', type: 'trigger', name: 'Form Submitted', config: { type: 'webhook' }, position: { x: 100, y: 100 } },
      { id: 'enrich', type: 'action', name: 'Enrich Data', config: { agent: 'browser', action: 'scrape' }, position: { x: 300, y: 100 } },
      { id: 'score', type: 'action', name: 'Score Lead', config: { agent: 'data', action: 'predict' }, position: { x: 500, y: 100 } },
      { id: 'condition', type: 'condition', name: 'Check Score', config: { threshold: 70 }, position: { x: 700, y: 100 } },
      { id: 'notify-sales', type: 'action', name: 'Notify Sales', config: { agent: 'email', action: 'send' }, position: { x: 900, y: 50 } },
      { id: 'add-nurture', type: 'action', name: 'Add to Nurture', config: { agent: 'email', action: 'subscribe' }, position: { x: 900, y: 150 } },
    ],
    edges: [
      { id: 'e1', source: 'trigger', target: 'enrich' },
      { id: 'e2', source: 'enrich', target: 'score' },
      { id: 'e3', source: 'score', target: 'condition' },
      { id: 'e4', source: 'condition', target: 'notify-sales', sourceHandle: 'high' },
      { id: 'e5', source: 'condition', target: 'add-nurture', sourceHandle: 'low' },
    ],
    variables: { scoreThreshold: 70 },
  },
];

export class WorkflowEngine {
  private workflows: Map<string, Workflow> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private templates: Map<string, WorkflowTemplate> = new Map();
  private activeExecutions: Set<string> = new Set();

  constructor() {
    // Initialize templates
    workflowTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  // Create workflow
  createWorkflow(config: {
    name: string;
    description?: string;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    variables?: Record<string, any>;
    triggers?: WorkflowTrigger[];
  }): Workflow {
    const id = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const workflow: Workflow = {
      id,
      name: config.name,
      description: config.description || '',
      nodes: config.nodes,
      edges: config.edges,
      variables: config.variables || {},
      triggers: config.triggers || [{ type: 'manual', config: {} }],
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    };

    this.workflows.set(id, workflow);
    return workflow;
  }

  // Create from template
  createFromTemplate(templateId: string, variables?: Record<string, any>): Workflow | null {
    const template = this.templates.get(templateId);
    if (!template) return null;

    return this.createWorkflow({
      name: template.name,
      description: template.description,
      nodes: template.nodes,
      edges: template.edges,
      variables: { ...template.variables, ...variables },
    });
  }

  // Execute workflow
  async execute(
    workflowId: string,
    executor: (node: WorkflowNode, context: ExecutionContext) => Promise<NodeResult>,
    initialVariables?: Record<string, any>
  ): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    // Create execution record
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      status: 'running',
      startedAt: new Date(),
      currentNode: null,
      executedNodes: [],
      results: {},
      variables: { ...workflow.variables, ...initialVariables },
    };

    this.executions.set(executionId, execution);
    this.activeExecutions.add(executionId);

    try {
      // Find trigger node
      const triggerNode = workflow.nodes.find(n => n.type === 'trigger');
      if (!triggerNode) {
        throw new Error('No trigger node found in workflow');
      }

      // Build execution order (topological sort)
      const executionOrder = this.getExecutionOrder(workflow);

      // Execute nodes in order
      for (const nodeId of executionOrder) {
        const node = workflow.nodes.find(n => n.id === nodeId);
        if (!node) continue;

        execution.currentNode = nodeId;

        // Check conditions for this node
        const incomingEdges = workflow.edges.filter(e => e.target === nodeId);
        let shouldExecute = true;

        for (const edge of incomingEdges) {
          if (edge.condition) {
            const sourceResult = execution.results[edge.source];
            if (!edge.condition(sourceResult?.output)) {
              shouldExecute = false;
              break;
            }
          }
        }

        if (!shouldExecute) {
          execution.results[nodeId] = {
            nodeId,
            status: 'skipped',
            output: null,
            duration: 0,
            timestamp: new Date(),
          };
          continue;
        }

        // Execute node
        const context: ExecutionContext = {
          workflow,
          execution,
          variables: execution.variables,
          previousResults: execution.results,
        };

        const result = await executor(node, context);
        execution.results[nodeId] = result;
        execution.executedNodes.push(nodeId);

        // Update variables from output
        if (result.output?.variables) {
          execution.variables = { ...execution.variables, ...result.output.variables };
        }

        // Handle node failure
        if (result.status === 'failed') {
          execution.status = 'failed';
          execution.error = result.error;
          break;
        }
      }

      // Mark as completed if not failed
      if (execution.status !== 'failed') {
        execution.status = 'completed';
      }
    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      execution.completedAt = new Date();
      execution.currentNode = null;
      this.activeExecutions.delete(executionId);
    }

    return execution;
  }

  // Get execution order using topological sort
  private getExecutionOrder(workflow: Workflow): string[] {
    const order: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      if (visiting.has(nodeId)) {
        throw new Error('Cycle detected in workflow');
      }

      visiting.add(nodeId);

      // Visit dependencies first
      const incomingEdges = workflow.edges.filter(e => e.target === nodeId);
      for (const edge of incomingEdges) {
        visit(edge.source);
      }

      visiting.delete(nodeId);
      visited.add(nodeId);
      order.push(nodeId);
    };

    // Start from all nodes
    workflow.nodes.forEach(node => visit(node.id));

    return order;
  }

  // Execute nodes in parallel
  async executeParallel(
    workflowId: string,
    nodeIds: string[],
    executor: (node: WorkflowNode, context: ExecutionContext) => Promise<NodeResult>
  ): Promise<Record<string, NodeResult>> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const execution = this.executions.get(
      Array.from(this.executions.keys()).pop() || ''
    );

    const context: ExecutionContext = {
      workflow,
      execution: execution!,
      variables: execution?.variables || {},
      previousResults: execution?.results || {},
    };

    const promises = nodeIds.map(async nodeId => {
      const node = workflow.nodes.find(n => n.id === nodeId);
      if (!node) return null;
      return { nodeId, result: await executor(node, context) };
    });

    const results = await Promise.all(promises);

    return results.reduce((acc, item) => {
      if (item) acc[item.nodeId] = item.result;
      return acc;
    }, {} as Record<string, NodeResult>);
  }

  // Pause execution
  pauseExecution(executionId: string): boolean {
    const execution = this.executions.get(executionId);
    if (!execution || execution.status !== 'running') return false;

    execution.status = 'paused';
    return true;
  }

  // Resume execution
  async resumeExecution(
    executionId: string,
    executor: (node: WorkflowNode, context: ExecutionContext) => Promise<NodeResult>
  ): Promise<WorkflowExecution | null> {
    const execution = this.executions.get(executionId);
    if (!execution || execution.status !== 'paused') return null;

    execution.status = 'running';
    // Continue execution from where it left off
    // Implementation would continue the execution loop

    return execution;
  }

  // Cancel execution
  cancelExecution(executionId: string): boolean {
    const execution = this.executions.get(executionId);
    if (!execution) return false;

    execution.status = 'cancelled';
    execution.completedAt = new Date();
    this.activeExecutions.delete(executionId);
    return true;
  }

  // Update workflow
  updateWorkflow(workflowId: string, updates: Partial<Workflow>): Workflow | null {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return null;

    const updated = {
      ...workflow,
      ...updates,
      updatedAt: new Date(),
      version: workflow.version + 1,
    };

    this.workflows.set(workflowId, updated);
    return updated;
  }

  // Delete workflow
  deleteWorkflow(workflowId: string): boolean {
    return this.workflows.delete(workflowId);
  }

  // Get workflow
  getWorkflow(workflowId: string): Workflow | undefined {
    return this.workflows.get(workflowId);
  }

  // Get all workflows
  getAllWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  // Get execution
  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  // Get executions for workflow
  getWorkflowExecutions(workflowId: string): WorkflowExecution[] {
    return Array.from(this.executions.values())
      .filter(e => e.workflowId === workflowId);
  }

  // Get templates
  getTemplates(): WorkflowTemplate[] {
    return Array.from(this.templates.values());
  }

  // Get templates by category
  getTemplatesByCategory(category: string): WorkflowTemplate[] {
    return Array.from(this.templates.values())
      .filter(t => t.category === category);
  }

  // Validate workflow
  validateWorkflow(workflow: Workflow): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for trigger node
    const triggerNodes = workflow.nodes.filter(n => n.type === 'trigger');
    if (triggerNodes.length === 0) {
      errors.push('Workflow must have at least one trigger node');
    }
    if (triggerNodes.length > 1) {
      errors.push('Workflow can only have one trigger node');
    }

    // Check for orphan nodes
    const connectedNodes = new Set<string>();
    workflow.edges.forEach(e => {
      connectedNodes.add(e.source);
      connectedNodes.add(e.target);
    });

    workflow.nodes.forEach(node => {
      if (!connectedNodes.has(node.id) && node.type !== 'trigger') {
        errors.push(`Node "${node.name}" is not connected to the workflow`);
      }
    });

    // Check for cycles
    try {
      this.getExecutionOrder(workflow);
    } catch (error) {
      errors.push('Workflow contains a cycle');
    }

    // Check edge references
    workflow.edges.forEach(edge => {
      if (!workflow.nodes.find(n => n.id === edge.source)) {
        errors.push(`Edge references non-existent source node: ${edge.source}`);
      }
      if (!workflow.nodes.find(n => n.id === edge.target)) {
        errors.push(`Edge references non-existent target node: ${edge.target}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Export workflow
  exportWorkflow(workflowId: string): string | null {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return null;

    return JSON.stringify(workflow, null, 2);
  }

  // Import workflow
  importWorkflow(json: string): Workflow | null {
    try {
      const workflow = JSON.parse(json) as Workflow;
      workflow.id = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      workflow.createdAt = new Date();
      workflow.updatedAt = new Date();

      this.workflows.set(workflow.id, workflow);
      return workflow;
    } catch {
      return null;
    }
  }
}

export interface ExecutionContext {
  workflow: Workflow;
  execution: WorkflowExecution;
  variables: Record<string, any>;
  previousResults: Record<string, NodeResult>;
}

// Export singleton instance
export const workflowEngine = new WorkflowEngine();
