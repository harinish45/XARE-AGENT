// Safety Guards - Risk assessment and permission management
// Classifies actions by risk level and enforces safety policies

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface SafetyAssessment {
    id: string;
    action: string;
    riskLevel: RiskLevel;
    score: number; // 0-100, higher = riskier
    reasons: string[];
    requiresApproval: boolean;
    approvalType: 'none' | 'user' | 'admin' | 'mfa';
    mitigations: string[];
    timestamp: Date;
}

export interface SafetyPolicy {
    id: string;
    name: string;
    description: string;
    rules: SafetyRule[];
    enabled: boolean;
    priority: number;
}

export interface SafetyRule {
    id: string;
    condition: RuleCondition;
    action: 'allow' | 'deny' | 'require_approval' | 'log';
    riskLevel: RiskLevel;
    message: string;
}

export interface RuleCondition {
    type: 'action' | 'resource' | 'parameter' | 'context';
    operator: 'equals' | 'contains' | 'matches' | 'greaterThan' | 'lessThan';
    value: any;
}

export interface Permission {
    id: string;
    name: string;
    description: string;
    riskLevel: RiskLevel;
    category: string;
}

export interface Role {
    id: string;
    name: string;
    description: string;
    permissions: string[];
    inherits?: string[];
}

export interface AuditLog {
    id: string;
    action: string;
    userId?: string;
    agentId?: string;
    riskLevel: RiskLevel;
    approved: boolean;
    approver?: string;
    details: Record<string, any>;
    timestamp: Date;
}

export interface SafetyConfig {
    strictMode: boolean;
    requireApprovalForHighRisk: boolean;
    requireMFAForCritical: boolean;
    logAllActions: boolean;
    maxRetries: number;
    cooldownPeriod: number; // ms
}

// Risk patterns for assessment
const riskPatterns: Array<{
    pattern: RegExp;
    riskLevel: RiskLevel;
    score: number;
    reason: string;
}> = [
        // Critical risk patterns
        { pattern: /delete\s+(all|everything|entire)/i, riskLevel: 'critical', score: 95, reason: 'Bulk delete operation' },
        { pattern: /drop\s+(table|database)/i, riskLevel: 'critical', score: 100, reason: 'Database drop operation' },
        { pattern: /format\s+(disk|drive)/i, riskLevel: 'critical', score: 100, reason: 'Disk format operation' },
        { pattern: /rm\s+-rf/i, riskLevel: 'critical', score: 95, reason: 'Recursive force delete' },
        { pattern: /sudo\s+/i, riskLevel: 'critical', score: 90, reason: 'Elevated privileges required' },
        { pattern: /password|secret|api[_-]?key|token/i, riskLevel: 'critical', score: 85, reason: 'Sensitive credential access' },

        // High risk patterns
        { pattern: /delete/i, riskLevel: 'high', score: 70, reason: 'Delete operation' },
        { pattern: /remove/i, riskLevel: 'high', score: 65, reason: 'Remove operation' },
        { pattern: /send\s+(money|payment)/i, riskLevel: 'high', score: 80, reason: 'Financial transaction' },
        { pattern: /deploy/i, riskLevel: 'high', score: 60, reason: 'Deployment operation' },
        { pattern: /publish/i, riskLevel: 'high', score: 55, reason: 'Publishing operation' },
        { pattern: /modify\s+(system|config)/i, riskLevel: 'high', score: 70, reason: 'System modification' },

        // Medium risk patterns
        { pattern: /write/i, riskLevel: 'medium', score: 40, reason: 'Write operation' },
        { pattern: /update/i, riskLevel: 'medium', score: 35, reason: 'Update operation' },
        { pattern: /create/i, riskLevel: 'medium', score: 30, reason: 'Create operation' },
        { pattern: /email/i, riskLevel: 'medium', score: 35, reason: 'Email operation' },
        { pattern: /schedule/i, riskLevel: 'medium', score: 25, reason: 'Scheduling operation' },

        // Low risk patterns
        { pattern: /read/i, riskLevel: 'low', score: 10, reason: 'Read operation' },
        { pattern: /search/i, riskLevel: 'low', score: 5, reason: 'Search operation' },
        { pattern: /list/i, riskLevel: 'low', score: 5, reason: 'List operation' },
        { pattern: /get/i, riskLevel: 'low', score: 5, reason: 'Get operation' },
        { pattern: /analyze/i, riskLevel: 'low', score: 10, reason: 'Analysis operation' },
    ];

// Default permissions
const defaultPermissions: Permission[] = [
    // Low risk
    { id: 'read:files', name: 'Read Files', description: 'Read file contents', riskLevel: 'low', category: 'files' },
    { id: 'read:emails', name: 'Read Emails', description: 'Read email contents', riskLevel: 'low', category: 'email' },
    { id: 'read:calendar', name: 'Read Calendar', description: 'View calendar events', riskLevel: 'low', category: 'calendar' },
    { id: 'search:web', name: 'Search Web', description: 'Search the web', riskLevel: 'low', category: 'browser' },

    // Medium risk
    { id: 'write:files', name: 'Write Files', description: 'Create and modify files', riskLevel: 'medium', category: 'files' },
    { id: 'send:emails', name: 'Send Emails', description: 'Send emails', riskLevel: 'medium', category: 'email' },
    { id: 'create:events', name: 'Create Events', description: 'Create calendar events', riskLevel: 'medium', category: 'calendar' },
    { id: 'execute:code', name: 'Execute Code', description: 'Run code', riskLevel: 'medium', category: 'code' },

    // High risk
    { id: 'delete:files', name: 'Delete Files', description: 'Delete files', riskLevel: 'high', category: 'files' },
    { id: 'modify:system', name: 'Modify System', description: 'Modify system settings', riskLevel: 'high', category: 'system' },
    { id: 'deploy:code', name: 'Deploy Code', description: 'Deploy code to production', riskLevel: 'high', category: 'deployment' },
    { id: 'access:secrets', name: 'Access Secrets', description: 'Access sensitive credentials', riskLevel: 'high', category: 'security' },

    // Critical risk
    { id: 'delete:all', name: 'Delete All', description: 'Bulk delete operations', riskLevel: 'critical', category: 'system' },
    { id: 'admin:full', name: 'Full Admin', description: 'Full administrative access', riskLevel: 'critical', category: 'admin' },
    { id: 'financial:transfer', name: 'Financial Transfer', description: 'Transfer money or payments', riskLevel: 'critical', category: 'financial' },
];

// Default roles
const defaultRoles: Role[] = [
    {
        id: 'viewer',
        name: 'Viewer',
        description: 'Read-only access',
        permissions: ['read:files', 'read:emails', 'read:calendar', 'search:web'],
    },
    {
        id: 'user',
        name: 'User',
        description: 'Standard user access',
        permissions: [
            'read:files', 'read:emails', 'read:calendar', 'search:web',
            'write:files', 'send:emails', 'create:events', 'execute:code',
        ],
    },
    {
        id: 'developer',
        name: 'Developer',
        description: 'Developer access',
        permissions: [
            'read:files', 'read:emails', 'read:calendar', 'search:web',
            'write:files', 'send:emails', 'create:events', 'execute:code',
            'deploy:code',
        ],
    },
    {
        id: 'admin',
        name: 'Administrator',
        description: 'Full administrative access',
        permissions: [
            'read:files', 'read:emails', 'read:calendar', 'search:web',
            'write:files', 'send:emails', 'create:events', 'execute:code',
            'delete:files', 'modify:system', 'deploy:code', 'access:secrets',
        ],
    },
];

export class SafetyGuards {
    private config: SafetyConfig;
    private policies: Map<string, SafetyPolicy> = new Map();
    private permissions: Map<string, Permission> = new Map();
    private roles: Map<string, Role> = new Map();
    private auditLog: AuditLog[] = [];
    private userRoles: Map<string, string[]> = new Map();
    private pendingApprovals: Map<string, SafetyAssessment> = new Map();

    constructor(config?: Partial<SafetyConfig>) {
        this.config = {
            strictMode: config?.strictMode ?? false,
            requireApprovalForHighRisk: config?.requireApprovalForHighRisk ?? true,
            requireMFAForCritical: config?.requireMFAForCritical ?? true,
            logAllActions: config?.logAllActions ?? true,
            maxRetries: config?.maxRetries ?? 3,
            cooldownPeriod: config?.cooldownPeriod ?? 5000,
            ...config,
        };

        // Initialize default permissions
        defaultPermissions.forEach(p => this.permissions.set(p.id, p));

        // Initialize default roles
        defaultRoles.forEach(r => this.roles.set(r.id, r));

        // Initialize default policies
        this.initializeDefaultPolicies();
    }

    // Initialize default safety policies
    private initializeDefaultPolicies(): void {
        const policies: SafetyPolicy[] = [
            {
                id: 'prevent-data-loss',
                name: 'Prevent Data Loss',
                description: 'Prevents accidental data deletion',
                enabled: true,
                priority: 100,
                rules: [
                    {
                        id: 'no-bulk-delete',
                        condition: { type: 'action', operator: 'matches', value: /delete\s+all/i },
                        action: 'require_approval',
                        riskLevel: 'critical',
                        message: 'Bulk delete requires approval',
                    },
                ],
            },
            {
                id: 'protect-credentials',
                name: 'Protect Credentials',
                description: 'Prevents exposure of sensitive credentials',
                enabled: true,
                priority: 90,
                rules: [
                    {
                        id: 'no-password-exposure',
                        condition: { type: 'parameter', operator: 'matches', value: /password|secret|token/i },
                        action: 'deny',
                        riskLevel: 'critical',
                        message: 'Cannot expose sensitive credentials',
                    },
                ],
            },
            {
                id: 'financial-protection',
                name: 'Financial Protection',
                description: 'Protects against unauthorized financial transactions',
                enabled: true,
                priority: 95,
                rules: [
                    {
                        id: 'payment-approval',
                        condition: { type: 'action', operator: 'matches', value: /send\s+(money|payment)/i },
                        action: 'require_approval',
                        riskLevel: 'critical',
                        message: 'Financial transactions require approval',
                    },
                ],
            },
        ];

        policies.forEach(p => this.policies.set(p.id, p));
    }

    // Assess action risk
    assessAction(action: string, context?: Record<string, any>): SafetyAssessment {
        const id = `assess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        let maxScore = 0;
        let riskLevel: RiskLevel = 'low';
        const reasons: string[] = [];
        const mitigations: string[] = [];

        // Check against risk patterns
        for (const pattern of riskPatterns) {
            if (pattern.pattern.test(action)) {
                if (pattern.score > maxScore) {
                    maxScore = pattern.score;
                    riskLevel = pattern.riskLevel;
                }
                reasons.push(pattern.reason);
            }
        }

        // Check against policies
        for (const policy of Array.from(this.policies.values()).sort((a, b) => b.priority - a.priority)) {
            if (!policy.enabled) continue;

            for (const rule of policy.rules) {
                if (this.matchesCondition(action, rule.condition, context)) {
                    if (this.getRiskScore(rule.riskLevel) > maxScore) {
                        maxScore = this.getRiskScore(rule.riskLevel);
                        riskLevel = rule.riskLevel;
                    }
                    reasons.push(rule.message);
                }
            }
        }

        // Determine approval requirements
        const requiresApproval = this.requiresApproval(riskLevel);
        const approvalType = this.getApprovalType(riskLevel);

        // Generate mitigations
        if (riskLevel === 'high' || riskLevel === 'critical') {
            mitigations.push('Review action carefully before proceeding');
            mitigations.push('Consider using a less destructive alternative');
        }
        if (riskLevel === 'critical') {
            mitigations.push('Enable MFA for additional security');
            mitigations.push('Create backup before proceeding');
        }

        const assessment: SafetyAssessment = {
            id,
            action,
            riskLevel,
            score: maxScore,
            reasons: [...new Set(reasons)], // Remove duplicates
            requiresApproval,
            approvalType,
            mitigations,
            timestamp: new Date(),
        };

        // Log assessment
        if (this.config.logAllActions) {
            this.logAudit({
                action,
                riskLevel,
                approved: !requiresApproval,
                details: { assessment, context },
            });
        }

        return assessment;
    }

    // Check if user has permission
    hasPermission(userId: string, permissionId: string): boolean {
        const userRoles = this.userRoles.get(userId) || [];

        for (const roleId of userRoles) {
            const role = this.roles.get(roleId);
            if (role && role.permissions.includes(permissionId)) {
                return true;
            }

            // Check inherited roles
            if (role?.inherits) {
                for (const inheritedId of role.inherits) {
                    const inheritedRole = this.roles.get(inheritedId);
                    if (inheritedRole && inheritedRole.permissions.includes(permissionId)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    // Check if action is allowed
    isActionAllowed(userId: string, action: string, context?: Record<string, any>): {
        allowed: boolean;
        assessment: SafetyAssessment;
        missingPermissions: string[];
    } {
        const assessment = this.assessAction(action, context);
        const missingPermissions: string[] = [];

        // Check permissions based on risk level
        const requiredPermission = this.getRequiredPermission(action, assessment.riskLevel);
        if (requiredPermission && !this.hasPermission(userId, requiredPermission)) {
            missingPermissions.push(requiredPermission);
        }

        const allowed = !assessment.requiresApproval && missingPermissions.length === 0;

        return {
            allowed,
            assessment,
            missingPermissions,
        };
    }

    // Request approval for action
    requestApproval(assessment: SafetyAssessment, userId: string): string {
        const approvalId = `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.pendingApprovals.set(approvalId, assessment);

        // In real implementation, this would notify approvers
        return approvalId;
    }

    // Approve action
    approveAction(approvalId: string, approverId: string): boolean {
        const assessment = this.pendingApprovals.get(approvalId);
        if (!assessment) return false;

        this.logAudit({
            action: assessment.action,
            riskLevel: assessment.riskLevel,
            approved: true,
            approver: approverId,
            details: { assessment },
        });

        this.pendingApprovals.delete(approvalId);
        return true;
    }

    // Deny action
    denyAction(approvalId: string, denierId: string, reason?: string): boolean {
        const assessment = this.pendingApprovals.get(approvalId);
        if (!assessment) return false;

        this.logAudit({
            action: assessment.action,
            riskLevel: assessment.riskLevel,
            approved: false,
            approver: denierId,
            details: { assessment, reason },
        });

        this.pendingApprovals.delete(approvalId);
        return true;
    }

    // Get pending approvals
    getPendingApprovals(): Array<{ id: string; assessment: SafetyAssessment }> {
        return Array.from(this.pendingApprovals.entries()).map(([id, assessment]) => ({
            id,
            assessment,
        }));
    }

    // Assign role to user
    assignRole(userId: string, roleId: string): boolean {
        if (!this.roles.has(roleId)) return false;

        const userRoles = this.userRoles.get(userId) || [];
        if (!userRoles.includes(roleId)) {
            userRoles.push(roleId);
            this.userRoles.set(userId, userRoles);
        }

        return true;
    }

    // Remove role from user
    removeRole(userId: string, roleId: string): boolean {
        const userRoles = this.userRoles.get(userId) || [];
        const index = userRoles.indexOf(roleId);

        if (index > -1) {
            userRoles.splice(index, 1);
            this.userRoles.set(userId, userRoles);
            return true;
        }

        return false;
    }

    // Get user roles
    getUserRoles(userId: string): Role[] {
        const roleIds = this.userRoles.get(userId) || [];
        return roleIds.map(id => this.roles.get(id)).filter(Boolean) as Role[];
    }

    // Get user permissions
    getUserPermissions(userId: string): Permission[] {
        const roles = this.getUserRoles(userId);
        const permissionIds = new Set<string>();

        roles.forEach(role => {
            role.permissions.forEach(p => permissionIds.add(p));
            if (role.inherits) {
                role.inherits.forEach(inheritedId => {
                    const inheritedRole = this.roles.get(inheritedId);
                    inheritedRole?.permissions.forEach(p => permissionIds.add(p));
                });
            }
        });

        return Array.from(permissionIds)
            .map(id => this.permissions.get(id))
            .filter(Boolean) as Permission[];
    }

    // Log audit entry
    private logAudit(entry: Omit<AuditLog, 'id' | 'timestamp'>): void {
        const auditEntry: AuditLog = {
            id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...entry,
            timestamp: new Date(),
        };

        this.auditLog.push(auditEntry);
    }

    // Get audit log
    getAuditLog(filters?: {
        userId?: string;
        agentId?: string;
        riskLevel?: RiskLevel;
        approved?: boolean;
        limit?: number;
    }): AuditLog[] {
        let logs = [...this.auditLog];

        if (filters) {
            if (filters.userId) {
                logs = logs.filter(l => l.userId === filters.userId);
            }
            if (filters.agentId) {
                logs = logs.filter(l => l.agentId === filters.agentId);
            }
            if (filters.riskLevel) {
                logs = logs.filter(l => l.riskLevel === filters.riskLevel);
            }
            if (filters.approved !== undefined) {
                logs = logs.filter(l => l.approved === filters.approved);
            }
        }

        const limit = filters?.limit || 100;
        return logs.slice(-limit);
    }

    // Helper methods
    private matchesCondition(action: string, condition: RuleCondition, context?: Record<string, any>): boolean {
        let value: any;

        switch (condition.type) {
            case 'action':
                value = action;
                break;
            case 'context':
                value = context;
                break;
            default:
                return false;
        }

        switch (condition.operator) {
            case 'equals':
                return value === condition.value;
            case 'contains':
                return String(value).includes(condition.value);
            case 'matches':
                if (condition.value instanceof RegExp) {
                    return condition.value.test(value);
                }
                return new RegExp(condition.value).test(value);
            default:
                return false;
        }
    }

    private getRiskScore(level: RiskLevel): number {
        const scores: Record<RiskLevel, number> = {
            low: 20,
            medium: 40,
            high: 70,
            critical: 95,
        };
        return scores[level];
    }

    private requiresApproval(riskLevel: RiskLevel): boolean {
        if (riskLevel === 'critical') return true;
        if (riskLevel === 'high' && this.config.requireApprovalForHighRisk) return true;
        return false;
    }

    private getApprovalType(riskLevel: RiskLevel): SafetyAssessment['approvalType'] {
        if (riskLevel === 'critical' && this.config.requireMFAForCritical) return 'mfa';
        if (riskLevel === 'critical') return 'admin';
        if (riskLevel === 'high') return 'user';
        return 'none';
    }

    private getRequiredPermission(action: string, riskLevel: RiskLevel): string | null {
        // Map action patterns to permissions
        if (/delete/i.test(action)) return `delete:${this.getActionCategory(action)}`;
        if (/write|create|update/i.test(action)) return `write:${this.getActionCategory(action)}`;
        if (/read|get|list|search/i.test(action)) return `read:${this.getActionCategory(action)}`;
        return null;
    }

    private getActionCategory(action: string): string {
        if (/email|mail/i.test(action)) return 'emails';
        if (/file|document/i.test(action)) return 'files';
        if (/calendar|event|meeting/i.test(action)) return 'calendar';
        if (/code|deploy/i.test(action)) return 'code';
        if (/payment|money|transfer/i.test(action)) return 'financial';
        return 'general';
    }

    // Create custom policy
    createPolicy(policy: Omit<SafetyPolicy, 'id'>): SafetyPolicy {
        const id = `policy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newPolicy = { ...policy, id };
        this.policies.set(id, newPolicy);
        return newPolicy;
    }

    // Update policy
    updatePolicy(policyId: string, updates: Partial<SafetyPolicy>): SafetyPolicy | null {
        const policy = this.policies.get(policyId);
        if (!policy) return null;

        const updated = { ...policy, ...updates };
        this.policies.set(policyId, updated);
        return updated;
    }

    // Delete policy
    deletePolicy(policyId: string): boolean {
        return this.policies.delete(policyId);
    }

    // Get all policies
    getPolicies(): SafetyPolicy[] {
        return Array.from(this.policies.values());
    }

    // Get all permissions
    getPermissions(): Permission[] {
        return Array.from(this.permissions.values());
    }

    // Get all roles
    getRoles(): Role[] {
        return Array.from(this.roles.values());
    }

    // Create custom role
    createRole(role: Omit<Role, 'id'>): Role {
        const id = `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newRole = { ...role, id };
        this.roles.set(id, newRole);
        return newRole;
    }
}

// Export singleton instance
export const safetyGuards = new SafetyGuards();
