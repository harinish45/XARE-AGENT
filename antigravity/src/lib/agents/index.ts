// Antigravity AI Agent Platform - Core Exports
// This file exports all the core components of the AI agent system

// Intent Parser
export { IntentParser, intentParser } from './IntentParser';
export type { 
  ParsedIntent, 
  Entity, 
  Context, 
  SessionContext, 
  TemporalContext,
  IntentType,
  EntityType 
} from './IntentParser';

// Agent Router
export { AgentRouter, agentRouter } from './AgentRouter';
export type { 
  Agent, 
  AgentStatus, 
  AgentType, 
  AgentConfig, 
  AgentResult, 
  RoutingDecision 
} from './AgentRouter';

// Email Agent
export { EmailAgent, createEmailAgent } from './EmailAgent';
export type { 
  Email, 
  EmailDraft, 
  Attachment, 
  EmailTemplate, 
  EmailAgentConfig 
} from './EmailAgent';

// Browser Agent
export { BrowserAgent, createBrowserAgent } from './BrowserAgent';
export type { 
  BrowserSession, 
  WebPage, 
  Link, 
  Image, 
  Form, 
  FormField,
  ScrapingResult,
  BrowserAction,
  BrowserAgentConfig 
} from './BrowserAgent';

// File Agent
export { FileAgent, createFileAgent } from './FileAgent';
export type { 
  FileInfo, 
  FileContent, 
  SearchResult, 
  OrganizationPlan,
  OrganizationAction,
  FileAgentConfig 
} from './FileAgent';

// Calendar Agent
export { CalendarAgent, createCalendarAgent } from './CalendarAgent';
export type { 
  CalendarEvent, 
  Attendee, 
  Reminder, 
  RecurrenceRule,
  ConferenceData,
  TimeSlot,
  CalendarAgentConfig 
} from './CalendarAgent';

// Code Agent
export { CodeAgent, createCodeAgent } from './CodeAgent';
export type { 
  CodeFile, 
  CodeGenerationResult, 
  CodeReviewResult, 
  CodeIssue,
  SecurityIssue,
  ComplexityMetrics,
  TestResult,
  TestFailure,
  DeploymentResult,
  CodeAgentConfig 
} from './CodeAgent';

// Data Agent
export { DataAgent, createDataAgent } from './DataAgent';
export type { 
  Dataset, 
  ColumnDefinition, 
  AnalysisResult, 
  DataSummary,
  Statistics,
  NumericStats,
  CategoricalStats,
  TemporalStats,
  Correlation,
  Visualization,
  QueryResult,
  TransformOperation,
  DataAgentConfig 
} from './DataAgent';

// Workflow Engine
export { WorkflowEngine, workflowEngine } from '../workflow/WorkflowEngine';
export type { 
  Workflow, 
  WorkflowNode, 
  WorkflowEdge, 
  WorkflowTrigger,
  WorkflowExecution,
  NodeResult,
  WorkflowTemplate,
  ExecutionContext 
} from '../workflow/WorkflowEngine';

// MCP Manager
export { MCPManager, mcpManager } from '../mcp/MCPManager';
export type { 
  MCPServer, 
  MCPCapability, 
  MCPTool, 
  MCPResource,
  MCPServerConfig,
  JSONSchema,
  MCPAction,
  MCPActionResult,
  MCPServerTemplate 
} from '../mcp/MCPManager';

// Learning System
export { LearningSystem, learningSystem } from '../learning/LearningSystem';
export type { 
  Feedback, 
  Skill, 
  SkillExample, 
  SkillParameter,
  TrainingSession,
  TrainingConfig,
  TrainingMetrics,
  LearningConfig 
} from '../learning/LearningSystem';

// Safety Guards
export { SafetyGuards, safetyGuards } from '../safety/SafetyGuards';
export type { 
  RiskLevel, 
  SafetyAssessment, 
  SafetyPolicy, 
  SafetyRule,
  RuleCondition,
  Permission,
  Role,
  AuditLog,
  SafetyConfig 
} from '../safety/SafetyGuards';
