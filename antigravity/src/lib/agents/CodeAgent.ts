// Code Agent - Handles code generation, review, debugging, and deployment
// Generates code, reviews code, runs tests, and deploys applications

import { ParsedIntent } from './IntentParser';
import { Agent, AgentResult } from './AgentRouter';

export interface CodeFile {
  path: string;
  content: string;
  language: string;
  size: number;
  lines: number;
}

export interface CodeGenerationResult {
  files: CodeFile[];
  explanation: string;
  dependencies: string[];
  instructions: string[];
}

export interface CodeReviewResult {
  score: number;
  issues: CodeIssue[];
  suggestions: string[];
  securityIssues: SecurityIssue[];
  complexity: ComplexityMetrics;
}

export interface CodeIssue {
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  rule: string;
  fix?: string;
}

export interface SecurityIssue {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  line: number;
  recommendation: string;
}

export interface ComplexityMetrics {
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  linesOfCode: number;
  maintainabilityIndex: number;
}

export interface TestResult {
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  coverage: number;
  failures: TestFailure[];
}

export interface TestFailure {
  testName: string;
  error: string;
  stackTrace: string;
}

export interface DeploymentResult {
  success: boolean;
  url?: string;
  logs: string[];
  duration: number;
  environment: string;
}

export interface CodeAgentConfig {
  defaultLanguage: string;
  styleGuide: string;
  testFramework: string;
  maxFileSize: number;
  autoFormat: boolean;
}

// Language templates
const languageTemplates: Record<string, { extension: string; commentStyle: string }> = {
  javascript: { extension: '.js', commentStyle: '//' },
  typescript: { extension: '.ts', commentStyle: '//' },
  python: { extension: '.py', commentStyle: '#' },
  java: { extension: '.java', commentStyle: '//' },
  csharp: { extension: '.cs', commentStyle: '//' },
  go: { extension: '.go', commentStyle: '//' },
  rust: { extension: '.rs', commentStyle: '//' },
  ruby: { extension: '.rb', commentStyle: '#' },
  php: { extension: '.php', commentStyle: '//' },
  swift: { extension: '.swift', commentStyle: '//' },
  kotlin: { extension: '.kt', commentStyle: '//' },
};

export class CodeAgent {
  private config: CodeAgentConfig;
  private generatedFiles: Map<string, CodeFile> = new Map();

  constructor(config?: Partial<CodeAgentConfig>) {
    this.config = {
      defaultLanguage: config?.defaultLanguage || 'typescript',
      styleGuide: config?.styleGuide || 'standard',
      testFramework: config?.testFramework || 'jest',
      maxFileSize: config?.maxFileSize || 100000, // 100KB
      autoFormat: config?.autoFormat ?? true,
      ...config,
    };
  }

  // Main execution method
  async execute(intent: ParsedIntent, agent: Agent): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      let result: any;

      switch (intent.primaryIntent) {
        case 'generate_code':
          result = await this.generateCode(intent.parameters);
          break;
        case 'run_test':
          result = await this.runTests(intent.parameters);
          break;
        case 'deploy_code':
          result = await this.deploy(intent.parameters);
          break;
        default:
          result = await this.handleGeneralCodeTask(intent);
      }

      return {
        success: true,
        agentId: agent.id,
        action: intent.action,
        output: result,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        agentId: agent.id,
        action: intent.action,
        output: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      };
    }
  }

  // Generate code
  async generateCode(params: Record<string, any>): Promise<CodeGenerationResult> {
    const { 
      description, 
      language = this.config.defaultLanguage,
      framework,
      includeTests = false,
      includeDocs = false,
    } = params;

    const files: CodeFile[] = [];
    const dependencies: string[] = [];
    const instructions: string[] = [];

    // Generate main code file
    const mainFile = await this.generateMainFile(description, language, framework);
    files.push(mainFile);

    // Generate tests if requested
    if (includeTests) {
      const testFile = await this.generateTestFile(mainFile, language);
      files.push(testFile);
    }

    // Generate documentation if requested
    if (includeDocs) {
      const docFile = await this.generateDocFile(mainFile, description);
      files.push(docFile);
    }

    // Determine dependencies
    if (framework) {
      dependencies.push(...this.getFrameworkDependencies(framework, language));
    }

    // Store generated files
    files.forEach(file => {
      this.generatedFiles.set(file.path, file);
    });

    return {
      files,
      explanation: this.generateExplanation(files, description),
      dependencies,
      instructions: this.generateInstructions(files, dependencies),
    };
  }

  // Generate main code file
  private async generateMainFile(
    description: string, 
    language: string, 
    framework?: string
  ): Promise<CodeFile> {
    const template = languageTemplates[language] || languageTemplates.typescript;
    
    // Generate code based on description
    // In real implementation, this would call an LLM
    const content = this.generateCodeFromDescription(description, language, framework);
    
    return {
      path: `src/index${template.extension}`,
      content,
      language,
      size: content.length,
      lines: content.split('\n').length,
    };
  }

  // Generate code from description
  private generateCodeFromDescription(
    description: string, 
    language: string, 
    framework?: string
  ): string {
    const commentStyle = languageTemplates[language]?.commentStyle || '//';
    
    // Template-based code generation
    // In real implementation, this would use an LLM
    return `${commentStyle} Generated code for: ${description}
${commentStyle} Language: ${language}${framework ? `\n${commentStyle} Framework: ${framework}` : ''}

// Implementation based on description
export function main() {
  // TODO: Implement ${description}
  console.log("Hello from Antigravity Code Agent!");
}

// Export for module usage
export default main;
`;
  }

  // Generate test file
  private async generateTestFile(mainFile: CodeFile, language: string): Promise<CodeFile> {
    const testFramework = this.config.testFramework;
    const extension = language === 'typescript' ? '.test.ts' : '.test.js';
    
    const content = `// Tests for ${mainFile.path}
import { main } from './index';

describe('Main Module', () => {
  test('should execute without errors', () => {
    expect(() => main()).not.toThrow();
  });
});
`;

    return {
      path: `src/index${extension}`,
      content,
      language,
      size: content.length,
      lines: content.split('\n').length,
    };
  }

  // Generate documentation file
  private async generateDocFile(mainFile: CodeFile, description: string): Promise<CodeFile> {
    const content = `# ${description}

## Overview

This module was generated by the Antigravity Code Agent.

## Usage

\`\`\`${mainFile.language}
import { main } from './index';

main();
\`\`\`

## API Reference

### main()

The main entry point for this module.

## License

MIT
`;

    return {
      path: 'README.md',
      content,
      language: 'markdown',
      size: content.length,
      lines: content.split('\n').length,
    };
  }

  // Review code
  async reviewCode(code: string, language: string): Promise<CodeReviewResult> {
    // In real implementation, this would use ESLint, Prettier, etc.
    const issues: CodeIssue[] = [];
    const suggestions: string[] = [];
    const securityIssues: SecurityIssue[] = [];

    // Basic checks
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      // Check for console.log
      if (line.includes('console.log')) {
        issues.push({
          line: index + 1,
          column: line.indexOf('console.log') + 1,
          severity: 'warning',
          message: 'Remove console.log before production',
          rule: 'no-console',
        });
      }

      // Check for TODO comments
      if (line.includes('TODO')) {
        issues.push({
          line: index + 1,
          column: line.indexOf('TODO') + 1,
          severity: 'info',
          message: 'Unresolved TODO comment',
          rule: 'no-todo',
        });
      }

      // Check for potential security issues
      if (line.includes('eval(')) {
        securityIssues.push({
          type: 'Code Injection',
          severity: 'critical',
          description: 'Use of eval() is dangerous',
          line: index + 1,
          recommendation: 'Avoid eval() and use safer alternatives',
        });
      }

      if (line.includes('innerHTML')) {
        securityIssues.push({
          type: 'XSS',
          severity: 'high',
          description: 'Potential XSS vulnerability with innerHTML',
          line: index + 1,
          recommendation: 'Use textContent or sanitize input',
        });
      }
    });

    // Calculate complexity
    const complexity: ComplexityMetrics = {
      cyclomaticComplexity: this.calculateCyclomaticComplexity(code),
      cognitiveComplexity: this.calculateCognitiveComplexity(code),
      linesOfCode: lines.length,
      maintainabilityIndex: this.calculateMaintainabilityIndex(code),
    };

    // Generate suggestions
    if (complexity.cyclomaticComplexity > 10) {
      suggestions.push('Consider breaking down complex functions into smaller ones');
    }
    if (lines.length > 300) {
      suggestions.push('File is large, consider splitting into multiple modules');
    }

    return {
      score: this.calculateScore(issues, securityIssues, complexity),
      issues,
      suggestions,
      securityIssues,
      complexity,
    };
  }

  // Run tests
  async runTests(params: Record<string, any>): Promise<TestResult> {
    const { path, coverage = true } = params;

    // In real implementation, this would execute the test framework
    return {
      passed: 5,
      failed: 0,
      skipped: 1,
      duration: 1234,
      coverage: coverage ? 85 : 0,
      failures: [],
    };
  }

  // Debug code
  async debugCode(code: string, error: string): Promise<{
    analysis: string;
    suggestions: string[];
    fixedCode?: string;
  }> {
    // In real implementation, this would use an LLM to analyze and fix
    return {
      analysis: `Analyzing error: ${error}`,
      suggestions: [
        'Check for null/undefined values',
        'Verify function arguments',
        'Review recent changes',
      ],
    };
  }

  // Refactor code
  async refactorCode(code: string, options: {
    extractFunctions?: boolean;
    renameVariables?: boolean;
    addTypes?: boolean;
    improveNaming?: boolean;
  }): Promise<{ refactoredCode: string; changes: string[] }> {
    const changes: string[] = [];

    // In real implementation, this would use AST transformation
    let refactoredCode = code;

    if (options.extractFunctions) {
      changes.push('Extracted repeated code into functions');
    }
    if (options.renameVariables) {
      changes.push('Renamed variables for clarity');
    }
    if (options.addTypes) {
      changes.push('Added type annotations');
    }
    if (options.improveNaming) {
      changes.push('Improved function and variable names');
    }

    return { refactoredCode, changes };
  }

  // Deploy code
  async deploy(params: Record<string, any>): Promise<DeploymentResult> {
    const { 
      environment = 'development', 
      platform = 'vercel',
      buildCommand,
      startCommand,
    } = params;

    const startTime = Date.now();
    const logs: string[] = [];

    // In real implementation, this would execute deployment commands
    logs.push(`Deploying to ${platform}...`);
    logs.push(`Environment: ${environment}`);
    logs.push('Building application...');
    logs.push('Deployment successful!');

    return {
      success: true,
      url: `https://app-${Date.now()}.${platform}.app`,
      logs,
      duration: Date.now() - startTime,
      environment,
    };
  }

  // Handle general code task
  private async handleGeneralCodeTask(intent: ParsedIntent): Promise<any> {
    const input = intent.rawInput.toLowerCase();

    if (input.includes('review') || input.includes('check')) {
      return {
        message: 'Code review ready',
        instructions: 'Provide the code you want me to review',
      };
    }

    if (input.includes('debug') || input.includes('fix')) {
      return {
        message: 'Debug mode ready',
        instructions: 'Provide the code and error message',
      };
    }

    if (input.includes('refactor')) {
      return {
        message: 'Refactoring ready',
        instructions: 'Provide the code you want to refactor',
      };
    }

    return {
      message: 'Code agent ready',
      suggestions: [
        'Generate code from description',
        'Review code for issues',
        'Debug code with errors',
        'Run tests',
        'Deploy application',
      ],
    };
  }

  // Helper methods
  private getFrameworkDependencies(framework: string, language: string): string[] {
    const deps: Record<string, string[]> = {
      react: ['react', 'react-dom'],
      vue: ['vue'],
      angular: ['@angular/core', '@angular/common'],
      express: ['express'],
      fastify: ['fastify'],
      next: ['next', 'react', 'react-dom'],
      django: ['django'],
      flask: ['flask'],
      fastapi: ['fastapi', 'uvicorn'],
    };

    return deps[framework.toLowerCase()] || [];
  }

  private generateExplanation(files: CodeFile[], description: string): string {
    return `Generated ${files.length} file(s) for: ${description}\n\n` +
      files.map(f => `- ${f.path} (${f.lines} lines)`).join('\n');
  }

  private generateInstructions(files: CodeFile[], dependencies: string[]): string[] {
    const instructions: string[] = [];

    if (dependencies.length > 0) {
      instructions.push(`Install dependencies: npm install ${dependencies.join(' ')}`);
    }
    instructions.push('Review the generated code');
    instructions.push('Run tests to verify functionality');
    instructions.push('Deploy when ready');

    return instructions;
  }

  private calculateCyclomaticComplexity(code: string): number {
    // Simplified calculation
    const keywords = ['if', 'else', 'for', 'while', 'case', 'catch', '&&', '||', '?'];
    let complexity = 1;
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = code.match(regex);
      if (matches) complexity += matches.length;
    });

    return complexity;
  }

  private calculateCognitiveComplexity(code: string): number {
    // Simplified calculation
    return this.calculateCyclomaticComplexity(code) * 1.5;
  }

  private calculateMaintainabilityIndex(code: string): number {
    const lines = code.split('\n').length;
    const complexity = this.calculateCyclomaticComplexity(code);
    
    // Simplified maintainability index (0-100)
    return Math.max(0, Math.min(100, 100 - (complexity * 2) - (lines / 10)));
  }

  private calculateScore(
    issues: CodeIssue[], 
    securityIssues: SecurityIssue[], 
    complexity: ComplexityMetrics
  ): number {
    let score = 100;

    // Deduct for issues
    issues.forEach(issue => {
      if (issue.severity === 'error') score -= 10;
      if (issue.severity === 'warning') score -= 5;
      if (issue.severity === 'info') score -= 1;
    });

    // Deduct for security issues
    securityIssues.forEach(issue => {
      if (issue.severity === 'critical') score -= 30;
      if (issue.severity === 'high') score -= 20;
      if (issue.severity === 'medium') score -= 10;
      if (issue.severity === 'low') score -= 5;
    });

    // Deduct for complexity
    if (complexity.cyclomaticComplexity > 10) score -= 10;
    if (complexity.maintainabilityIndex < 50) score -= 10;

    return Math.max(0, score);
  }

  // Get generated file
  getFile(path: string): CodeFile | undefined {
    return this.generatedFiles.get(path);
  }

  // Get all generated files
  getAllFiles(): CodeFile[] {
    return Array.from(this.generatedFiles.values());
  }

  // Clear generated files
  clearFiles(): void {
    this.generatedFiles.clear();
  }
}

// Export factory function
export function createCodeAgent(config?: Partial<CodeAgentConfig>): CodeAgent {
  return new CodeAgent(config);
}
