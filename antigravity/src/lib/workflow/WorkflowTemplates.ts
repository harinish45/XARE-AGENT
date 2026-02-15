// Workflow Templates — Pre-built Automation Packs
// Content Creator, E-commerce, Developer, Business

import { WorkflowTemplate } from './WorkflowEngine';

// ─── Content Creator Pack ─────────────────────────────────────────────────────

const contentCreatorTemplates: WorkflowTemplate[] = [
    {
        id: 'tmpl_youtube_distribute',
        name: 'YouTube → Everywhere',
        description: 'Automatically distribute a YouTube video to all platforms with optimized content',
        category: 'content_creator',
        tags: ['youtube', 'distribution', 'cross-post', 'social'],
        nodes: [
            { id: 'detect', type: 'trigger', name: 'YouTube Upload', config: { trigger: 'youtube_upload' }, position: { x: 0, y: 0 } },
            { id: 'download', type: 'action', name: 'Download Video', config: { agent: 'browser', action: 'download_video' }, position: { x: 200, y: 0 } },
            { id: 'clip_tiktok', type: 'action', name: 'TikTok Clip', config: { agent: 'content', action: 'create_short_clip', platform: 'tiktok' }, position: { x: 400, y: -100 } },
            { id: 'clip_reels', type: 'action', name: 'Reels Clip', config: { agent: 'content', action: 'create_short_clip', platform: 'instagram' }, position: { x: 400, y: 0 } },
            { id: 'transcript', type: 'action', name: 'Transcribe', config: { agent: 'content', action: 'transcribe_video' }, position: { x: 400, y: 100 } },
            { id: 'blog', type: 'action', name: 'Blog Post', config: { agent: 'content', action: 'transcript_to_blog' }, position: { x: 600, y: 100 } },
            { id: 'tweets', type: 'action', name: 'Key Quotes', config: { agent: 'content', action: 'extract_key_quotes' }, position: { x: 600, y: -100 } },
            { id: 'post_all', type: 'action', name: 'Cross-Post', config: { agent: 'social_media', action: 'cross_post' }, position: { x: 800, y: 0 } },
            { id: 'analytics', type: 'action', name: 'Track Analytics', config: { agent: 'social_media', action: 'track_analytics' }, position: { x: 1000, y: 0 } },
        ],
        edges: [
            { id: 'e1', source: 'detect', target: 'download' },
            { id: 'e2', source: 'download', target: 'clip_tiktok' },
            { id: 'e3', source: 'download', target: 'clip_reels' },
            { id: 'e4', source: 'download', target: 'transcript' },
            { id: 'e5', source: 'transcript', target: 'blog' },
            { id: 'e6', source: 'transcript', target: 'tweets' },
            { id: 'e7', source: 'clip_tiktok', target: 'post_all' },
            { id: 'e8', source: 'clip_reels', target: 'post_all' },
            { id: 'e9', source: 'blog', target: 'post_all' },
            { id: 'e10', source: 'tweets', target: 'post_all' },
            { id: 'e11', source: 'post_all', target: 'analytics' },
        ],
        estimatedDuration: 1800000,
    },
    {
        id: 'tmpl_blog_to_social',
        name: 'Blog → Social Media',
        description: 'Convert a blog post into platform-optimized social media content',
        category: 'content_creator',
        tags: ['blog', 'social', 'repurpose'],
        nodes: [
            { id: 'trigger', type: 'trigger', name: 'New Blog Post', config: { trigger: 'new_blog_post' }, position: { x: 0, y: 0 } },
            { id: 'summarize', type: 'action', name: 'Summarize', config: { agent: 'content', action: 'summarize' }, position: { x: 200, y: 0 } },
            { id: 'twitter_thread', type: 'action', name: 'Twitter Thread', config: { agent: 'social_media', action: 'create_thread', platform: 'twitter' }, position: { x: 400, y: -50 } },
            { id: 'linkedin_post', type: 'action', name: 'LinkedIn Post', config: { agent: 'social_media', action: 'create_post', platform: 'linkedin' }, position: { x: 400, y: 50 } },
            { id: 'instagram_carousel', type: 'action', name: 'IG Carousel', config: { agent: 'content', action: 'create_carousel' }, position: { x: 400, y: 150 } },
            { id: 'schedule', type: 'action', name: 'Schedule Posts', config: { agent: 'social_media', action: 'schedule_posts' }, position: { x: 600, y: 0 } },
        ],
        edges: [
            { id: 'e1', source: 'trigger', target: 'summarize' },
            { id: 'e2', source: 'summarize', target: 'twitter_thread' },
            { id: 'e3', source: 'summarize', target: 'linkedin_post' },
            { id: 'e4', source: 'summarize', target: 'instagram_carousel' },
            { id: 'e5', source: 'twitter_thread', target: 'schedule' },
            { id: 'e6', source: 'linkedin_post', target: 'schedule' },
            { id: 'e7', source: 'instagram_carousel', target: 'schedule' },
        ],
        estimatedDuration: 600000,
    },
    {
        id: 'tmpl_newsletter',
        name: 'Newsletter Automation',
        description: 'Compile weekly content into a newsletter and send to subscribers',
        category: 'content_creator',
        tags: ['newsletter', 'email', 'weekly'],
        nodes: [
            { id: 'trigger', type: 'trigger', name: 'Weekly Schedule', config: { trigger: 'schedule', cron: '0 9 * * 1' }, position: { x: 0, y: 0 } },
            { id: 'gather', type: 'action', name: 'Gather Content', config: { agent: 'data', action: 'collect_weekly_content' }, position: { x: 200, y: 0 } },
            { id: 'draft', type: 'action', name: 'Draft Newsletter', config: { agent: 'content', action: 'write_newsletter' }, position: { x: 400, y: 0 } },
            { id: 'send', type: 'action', name: 'Send Newsletter', config: { agent: 'email', action: 'send_newsletter' }, position: { x: 600, y: 0 } },
        ],
        edges: [
            { id: 'e1', source: 'trigger', target: 'gather' },
            { id: 'e2', source: 'gather', target: 'draft' },
            { id: 'e3', source: 'draft', target: 'send' },
        ],
        estimatedDuration: 300000,
    },
    {
        id: 'tmpl_analytics_report',
        name: 'Weekly Analytics Report',
        description: 'Generate and send weekly engagement analytics across all platforms',
        category: 'content_creator',
        tags: ['analytics', 'report', 'weekly'],
        nodes: [
            { id: 'trigger', type: 'trigger', name: 'Friday Schedule', config: { trigger: 'schedule', cron: '0 8 * * 5' }, position: { x: 0, y: 0 } },
            { id: 'pull_data', type: 'action', name: 'Pull Analytics', config: { agent: 'social_media', action: 'get_analytics' }, position: { x: 200, y: 0 } },
            { id: 'analyze', type: 'action', name: 'Analyze Data', config: { agent: 'data', action: 'analyze_engagement' }, position: { x: 400, y: 0 } },
            { id: 'report', type: 'action', name: 'Generate Report', config: { agent: 'content', action: 'generate_report' }, position: { x: 600, y: 0 } },
            { id: 'notify', type: 'action', name: 'Send Report', config: { agent: 'email', action: 'send_report' }, position: { x: 800, y: 0 } },
        ],
        edges: [
            { id: 'e1', source: 'trigger', target: 'pull_data' },
            { id: 'e2', source: 'pull_data', target: 'analyze' },
            { id: 'e3', source: 'analyze', target: 'report' },
            { id: 'e4', source: 'report', target: 'notify' },
        ],
        estimatedDuration: 600000,
    },
];

// ─── E-commerce Pack ──────────────────────────────────────────────────────────

const ecommerceTemplates: WorkflowTemplate[] = [
    {
        id: 'tmpl_order_processing',
        name: 'Order Processing Pipeline',
        description: 'Automatically process new orders: confirm, prepare, ship, notify',
        category: 'ecommerce',
        tags: ['orders', 'processing', 'automation'],
        nodes: [
            { id: 'trigger', type: 'trigger', name: 'New Order', config: { trigger: 'new_order' }, position: { x: 0, y: 0 } },
            { id: 'validate', type: 'action', name: 'Validate Order', config: { agent: 'data', action: 'validate_order' }, position: { x: 200, y: 0 } },
            { id: 'confirm_email', type: 'action', name: 'Confirm Email', config: { agent: 'email', action: 'send_confirmation' }, position: { x: 400, y: -50 } },
            { id: 'update_inventory', type: 'action', name: 'Update Inventory', config: { agent: 'data', action: 'update_inventory' }, position: { x: 400, y: 50 } },
            { id: 'shipping', type: 'action', name: 'Create Shipping', config: { agent: 'data', action: 'create_shipping_label' }, position: { x: 600, y: 0 } },
            { id: 'ship_notify', type: 'action', name: 'Notify Shipped', config: { agent: 'email', action: 'send_shipping_notification' }, position: { x: 800, y: 0 } },
        ],
        edges: [
            { id: 'e1', source: 'trigger', target: 'validate' },
            { id: 'e2', source: 'validate', target: 'confirm_email' },
            { id: 'e3', source: 'validate', target: 'update_inventory' },
            { id: 'e4', source: 'update_inventory', target: 'shipping' },
            { id: 'e5', source: 'shipping', target: 'ship_notify' },
        ],
        estimatedDuration: 120000,
    },
    {
        id: 'tmpl_review_request',
        name: 'Post-Purchase Review Request',
        description: 'Send review request emails 7 days after purchase',
        category: 'ecommerce',
        tags: ['reviews', 'email', 'engagement'],
        nodes: [
            { id: 'trigger', type: 'trigger', name: 'After Delivery', config: { trigger: 'schedule', delay: '7d', event: 'order_delivered' }, position: { x: 0, y: 0 } },
            { id: 'check', type: 'condition', name: 'Customer Active?', config: { condition: 'customer_active' }, position: { x: 200, y: 0 } },
            { id: 'draft', type: 'action', name: 'Draft Email', config: { agent: 'content', action: 'write_review_email' }, position: { x: 400, y: 0 } },
            { id: 'send', type: 'action', name: 'Send Email', config: { agent: 'email', action: 'send_email' }, position: { x: 600, y: 0 } },
        ],
        edges: [
            { id: 'e1', source: 'trigger', target: 'check' },
            { id: 'e2', source: 'check', target: 'draft' },
            { id: 'e3', source: 'draft', target: 'send' },
        ],
        estimatedDuration: 60000,
    },
    {
        id: 'tmpl_marketing_automation',
        name: 'Marketing Campaign Automation',
        description: 'Run multi-channel marketing campaigns with A/B testing',
        category: 'ecommerce',
        tags: ['marketing', 'campaign', 'ads'],
        nodes: [
            { id: 'trigger', type: 'trigger', name: 'Manual Start', config: { trigger: 'manual' }, position: { x: 0, y: 0 } },
            { id: 'audience', type: 'action', name: 'Segment Audience', config: { agent: 'data', action: 'segment_audience' }, position: { x: 200, y: 0 } },
            { id: 'copy_a', type: 'action', name: 'Copy Variant A', config: { agent: 'content', action: 'generate_ad_copy', variant: 'A' }, position: { x: 400, y: -50 } },
            { id: 'copy_b', type: 'action', name: 'Copy Variant B', config: { agent: 'content', action: 'generate_ad_copy', variant: 'B' }, position: { x: 400, y: 50 } },
            { id: 'deploy', type: 'action', name: 'Deploy Campaign', config: { agent: 'social_media', action: 'run_campaign' }, position: { x: 600, y: 0 } },
            { id: 'analyze', type: 'action', name: 'Analyze Results', config: { agent: 'data', action: 'analyze_campaign' }, position: { x: 800, y: 0 } },
        ],
        edges: [
            { id: 'e1', source: 'trigger', target: 'audience' },
            { id: 'e2', source: 'audience', target: 'copy_a' },
            { id: 'e3', source: 'audience', target: 'copy_b' },
            { id: 'e4', source: 'copy_a', target: 'deploy' },
            { id: 'e5', source: 'copy_b', target: 'deploy' },
            { id: 'e6', source: 'deploy', target: 'analyze' },
        ],
        estimatedDuration: 3600000,
    },
];

// ─── Developer Pack ───────────────────────────────────────────────────────────

const developerTemplates: WorkflowTemplate[] = [
    {
        id: 'tmpl_code_deploy',
        name: 'CI/CD Pipeline',
        description: 'Test, review, build, and deploy code changes automatically',
        category: 'developer',
        tags: ['cicd', 'deployment', 'testing'],
        nodes: [
            { id: 'trigger', type: 'trigger', name: 'Git Push', config: { trigger: 'git_push' }, position: { x: 0, y: 0 } },
            { id: 'test', type: 'action', name: 'Run Tests', config: { agent: 'code', action: 'run_tests' }, position: { x: 200, y: 0 } },
            { id: 'review', type: 'action', name: 'Code Review', config: { agent: 'code', action: 'review_code' }, position: { x: 400, y: 0 } },
            { id: 'build', type: 'action', name: 'Build', config: { agent: 'code', action: 'build' }, position: { x: 600, y: 0 } },
            { id: 'deploy', type: 'action', name: 'Deploy', config: { agent: 'code', action: 'deploy' }, position: { x: 800, y: 0 } },
            { id: 'notify', type: 'action', name: 'Notify Team', config: { agent: 'email', action: 'send_deployment_notification' }, position: { x: 1000, y: 0 } },
        ],
        edges: [
            { id: 'e1', source: 'trigger', target: 'test' },
            { id: 'e2', source: 'test', target: 'review' },
            { id: 'e3', source: 'review', target: 'build' },
            { id: 'e4', source: 'build', target: 'deploy' },
            { id: 'e5', source: 'deploy', target: 'notify' },
        ],
        estimatedDuration: 900000,
    },
    {
        id: 'tmpl_bug_tracker',
        name: 'Bug Report Automation',
        description: 'Capture, triage, assign, and track bug reports automatically',
        category: 'developer',
        tags: ['bugs', 'tracking', 'triage'],
        nodes: [
            { id: 'trigger', type: 'trigger', name: 'New Issue', config: { trigger: 'new_issue' }, position: { x: 0, y: 0 } },
            { id: 'classify', type: 'action', name: 'Classify Bug', config: { agent: 'code', action: 'classify_bug' }, position: { x: 200, y: 0 } },
            { id: 'assign', type: 'action', name: 'Auto-Assign', config: { agent: 'code', action: 'auto_assign' }, position: { x: 400, y: 0 } },
            { id: 'notify_dev', type: 'action', name: 'Notify Developer', config: { agent: 'email', action: 'notify_developer' }, position: { x: 600, y: 0 } },
        ],
        edges: [
            { id: 'e1', source: 'trigger', target: 'classify' },
            { id: 'e2', source: 'classify', target: 'assign' },
            { id: 'e3', source: 'assign', target: 'notify_dev' },
        ],
        estimatedDuration: 60000,
    },
    {
        id: 'tmpl_doc_gen',
        name: 'Documentation Generator',
        description: 'Auto-generate API docs, READMEs, and changelogs from code',
        category: 'developer',
        tags: ['docs', 'documentation', 'api'],
        nodes: [
            { id: 'trigger', type: 'trigger', name: 'Manual / Release', config: { trigger: 'manual_or_release' }, position: { x: 0, y: 0 } },
            { id: 'scan', type: 'action', name: 'Scan Codebase', config: { agent: 'code', action: 'scan_codebase' }, position: { x: 200, y: 0 } },
            { id: 'api_docs', type: 'action', name: 'API Docs', config: { agent: 'code', action: 'generate_api_docs' }, position: { x: 400, y: -50 } },
            { id: 'readme', type: 'action', name: 'README', config: { agent: 'content', action: 'generate_readme' }, position: { x: 400, y: 50 } },
            { id: 'publish', type: 'action', name: 'Publish Docs', config: { agent: 'code', action: 'publish_docs' }, position: { x: 600, y: 0 } },
        ],
        edges: [
            { id: 'e1', source: 'trigger', target: 'scan' },
            { id: 'e2', source: 'scan', target: 'api_docs' },
            { id: 'e3', source: 'scan', target: 'readme' },
            { id: 'e4', source: 'api_docs', target: 'publish' },
            { id: 'e5', source: 'readme', target: 'publish' },
        ],
        estimatedDuration: 300000,
    },
];

// ─── Business Pack ────────────────────────────────────────────────────────────

const businessTemplates: WorkflowTemplate[] = [
    {
        id: 'tmpl_lead_gen',
        name: 'Lead Generation Pipeline',
        description: 'Capture leads from email, qualify them, and add to CRM',
        category: 'business',
        tags: ['leads', 'crm', 'sales'],
        nodes: [
            { id: 'trigger', type: 'trigger', name: 'Lead Email', config: { trigger: 'new_email', filter: 'keywords:interested,pricing,demo' }, position: { x: 0, y: 0 } },
            { id: 'extract', type: 'action', name: 'Extract Info', config: { agent: 'email', action: 'extract_contact_info' }, position: { x: 200, y: 0 } },
            { id: 'qualify', type: 'action', name: 'Qualify Lead', config: { agent: 'data', action: 'qualify_lead' }, position: { x: 400, y: 0 } },
            { id: 'add_crm', type: 'action', name: 'Add to CRM', config: { agent: 'data', action: 'add_to_crm' }, position: { x: 600, y: -50 } },
            { id: 'auto_reply', type: 'action', name: 'Auto Reply', config: { agent: 'email', action: 'send_auto_response' }, position: { x: 600, y: 50 } },
            { id: 'notify_sales', type: 'action', name: 'Notify Sales', config: { agent: 'email', action: 'notify_sales_team' }, position: { x: 800, y: 0 } },
        ],
        edges: [
            { id: 'e1', source: 'trigger', target: 'extract' },
            { id: 'e2', source: 'extract', target: 'qualify' },
            { id: 'e3', source: 'qualify', target: 'add_crm' },
            { id: 'e4', source: 'qualify', target: 'auto_reply' },
            { id: 'e5', source: 'add_crm', target: 'notify_sales' },
        ],
        estimatedDuration: 120000,
    },
    {
        id: 'tmpl_invoice_automation',
        name: 'Invoice Automation',
        description: 'Generate, send, and track invoices automatically',
        category: 'business',
        tags: ['invoice', 'billing', 'accounting'],
        nodes: [
            { id: 'trigger', type: 'trigger', name: 'Monthly Schedule', config: { trigger: 'schedule', cron: '0 9 1 * *' }, position: { x: 0, y: 0 } },
            { id: 'gather', type: 'action', name: 'Gather Billing', config: { agent: 'data', action: 'gather_billing_data' }, position: { x: 200, y: 0 } },
            { id: 'generate', type: 'action', name: 'Generate Invoice', config: { agent: 'data', action: 'generate_invoice' }, position: { x: 400, y: 0 } },
            { id: 'send', type: 'action', name: 'Send Invoice', config: { agent: 'email', action: 'send_invoice' }, position: { x: 600, y: 0 } },
            { id: 'followup', type: 'action', name: 'Schedule Reminder', config: { agent: 'email', action: 'schedule_reminder', delay: '14d' }, position: { x: 800, y: 0 } },
        ],
        edges: [
            { id: 'e1', source: 'trigger', target: 'gather' },
            { id: 'e2', source: 'gather', target: 'generate' },
            { id: 'e3', source: 'generate', target: 'send' },
            { id: 'e4', source: 'send', target: 'followup' },
        ],
        estimatedDuration: 300000,
    },
    {
        id: 'tmpl_meeting_scheduler',
        name: 'Smart Meeting Scheduler',
        description: 'Find optimal times, send invites, and prepare agendas',
        category: 'business',
        tags: ['meetings', 'scheduling', 'productivity'],
        nodes: [
            { id: 'trigger', type: 'trigger', name: 'Manual Start', config: { trigger: 'manual' }, position: { x: 0, y: 0 } },
            { id: 'find_time', type: 'action', name: 'Find Time', config: { agent: 'calendar', action: 'find_optimal_time' }, position: { x: 200, y: 0 } },
            { id: 'agenda', type: 'action', name: 'Generate Agenda', config: { agent: 'content', action: 'generate_agenda' }, position: { x: 400, y: 0 } },
            { id: 'invite', type: 'action', name: 'Send Invite', config: { agent: 'calendar', action: 'send_invite' }, position: { x: 600, y: 0 } },
            { id: 'remind', type: 'action', name: 'Set Reminder', config: { agent: 'calendar', action: 'set_reminder', before: '15m' }, position: { x: 800, y: 0 } },
        ],
        edges: [
            { id: 'e1', source: 'trigger', target: 'find_time' },
            { id: 'e2', source: 'find_time', target: 'agenda' },
            { id: 'e3', source: 'agenda', target: 'invite' },
            { id: 'e4', source: 'invite', target: 'remind' },
        ],
        estimatedDuration: 60000,
    },
    {
        id: 'tmpl_report_gen',
        name: 'Weekly Business Report',
        description: 'Compile data, create charts, and email weekly business report',
        category: 'business',
        tags: ['report', 'analytics', 'weekly'],
        nodes: [
            { id: 'trigger', type: 'trigger', name: 'Monday Schedule', config: { trigger: 'schedule', cron: '0 8 * * 1' }, position: { x: 0, y: 0 } },
            { id: 'collect', type: 'action', name: 'Collect Metrics', config: { agent: 'data', action: 'collect_metrics' }, position: { x: 200, y: 0 } },
            { id: 'analyze', type: 'action', name: 'Analyze Data', config: { agent: 'data', action: 'analyze_data' }, position: { x: 400, y: 0 } },
            { id: 'write', type: 'action', name: 'Write Report', config: { agent: 'content', action: 'write_report' }, position: { x: 600, y: 0 } },
            { id: 'email', type: 'action', name: 'Email Report', config: { agent: 'email', action: 'send_report' }, position: { x: 800, y: 0 } },
        ],
        edges: [
            { id: 'e1', source: 'trigger', target: 'collect' },
            { id: 'e2', source: 'collect', target: 'analyze' },
            { id: 'e3', source: 'analyze', target: 'write' },
            { id: 'e4', source: 'write', target: 'email' },
        ],
        estimatedDuration: 600000,
    },
];

// ─── Template Registry ────────────────────────────────────────────────────────

export const ALL_WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
    ...contentCreatorTemplates,
    ...ecommerceTemplates,
    ...developerTemplates,
    ...businessTemplates,
];

export function getTemplatesByCategory(category: string): WorkflowTemplate[] {
    return ALL_WORKFLOW_TEMPLATES.filter(t => t.category === category);
}

export function getTemplateById(id: string): WorkflowTemplate | undefined {
    return ALL_WORKFLOW_TEMPLATES.find(t => t.id === id);
}

export function searchTemplates(query: string): WorkflowTemplate[] {
    const lower = query.toLowerCase();
    return ALL_WORKFLOW_TEMPLATES.filter(t =>
        t.name.toLowerCase().includes(lower) ||
        t.description.toLowerCase().includes(lower) ||
        (t.tags ?? []).some(tag => tag.includes(lower))
    );
}

export const TEMPLATE_CATEGORIES = [
    { id: 'content_creator', name: 'Content Creator', icon: '🎬', count: contentCreatorTemplates.length },
    { id: 'ecommerce', name: 'E-Commerce', icon: '🛒', count: ecommerceTemplates.length },
    { id: 'developer', name: 'Developer', icon: '💻', count: developerTemplates.length },
    { id: 'business', name: 'Business', icon: '💼', count: businessTemplates.length },
];
