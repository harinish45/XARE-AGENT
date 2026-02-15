// Intent Parser - Natural Language Understanding for AI Agents
// Parses user commands and extracts intents, entities, and context

export interface ParsedIntent {
  id: string;
  rawInput: string;
  primaryIntent: IntentType;
  confidence: number;
  entities: Entity[];
  context: Context;
  suggestedAgent: string;
  action: string;
  parameters: Record<string, any>;
  followUpNeeded: boolean;
  followUpQuestion?: string;
}

export interface Entity {
  type: EntityType;
  value: string;
  confidence: number;
  position: { start: number; end: number };
}

export interface Context {
  previousIntents: ParsedIntent[];
  userPreferences: Record<string, any>;
  currentSession: SessionContext;
  temporalContext: TemporalContext;
}

export interface SessionContext {
  id: string;
  startTime: Date;
  activeAgent: string | null;
  recentActions: string[];
  workingDirectory?: string;
  openFiles?: string[];
}

export interface TemporalContext {
  currentTime: Date;
  timezone: string;
  dayOfWeek: number;
  isWorkHours: boolean;
}

export type IntentType =
  | 'compose_email'
  | 'send_email'
  | 'schedule_meeting'
  | 'search_files'
  | 'analyze_data'
  | 'generate_code'
  | 'scrape_website'
  | 'create_document'
  | 'organize_files'
  | 'set_reminder'
  | 'query_database'
  | 'deploy_code'
  | 'run_test'
  | 'create_workflow'
  | 'post_social'
  | 'schedule_social'
  | 'cross_post'
  | 'reply_comments'
  | 'social_analytics'
  | 'generate_hashtags'
  | 'generate_caption'
  | 'write_blog'
  | 'create_carousel'
  | 'seo_optimize'
  | 'content_calendar'
  | 'train_agent'
  | 'ask_question'
  | 'general_command';

export type EntityType =
  | 'email_address'
  | 'person_name'
  | 'date'
  | 'time'
  | 'duration'
  | 'file_path'
  | 'url'
  | 'number'
  | 'currency'
  | 'organization'
  | 'topic'
  | 'programming_language'
  | 'database'
  | 'api_endpoint'
  | 'social_platform'
  | 'hashtag';

// Intent patterns for matching
const intentPatterns: Map<IntentType, RegExp[]> = new Map([
  ['compose_email', [
    /(?:compose|write|draft|create)\s+(?:an?\s+)?email/i,
    /(?:email|mail)\s+(?:to\s+)?(.+)/i,
    /send\s+(?:an?\s+)?email\s+to\s+(.+)/i,
  ]],
  ['send_email', [
    /send\s+(?:the\s+)?email/i,
    /deliver\s+(?:the\s+)?message/i,
  ]],
  ['schedule_meeting', [
    /(?:schedule|book|set up|arrange)\s+(?:a\s+)?(?:meeting|call|appointment)/i,
    /meet\s+with\s+(.+)/i,
    /(?:calendar|schedule)\s+(?:for|on)\s+(.+)/i,
  ]],
  ['search_files', [
    /(?:search|find|locate)\s+(?:for\s+)?(?:files?|documents?)/i,
    /where\s+is\s+(?:the\s+)?(?:file\s+)?(.+)/i,
    /look\s+for\s+(.+)/i,
  ]],
  ['analyze_data', [
    /(?:analyze|analyse|examine)\s+(?:the\s+)?(?:data|dataset|statistics)/i,
    /(?:run|perform)\s+(?:an?\s+)?analysis/i,
    /what\s+(?:are\s+)?(?:the\s+)?(?:trends?|patterns?|insights?)/i,
  ]],
  ['generate_code', [
    /(?:generate|create|write)\s+(?:code|function|class|script)/i,
    /code\s+(?:for|that)\s+(.+)/i,
    /(?:implement|build)\s+(.+)/i,
  ]],
  ['scrape_website', [
    /(?:scrape|crawl|extract)\s+(?:data\s+)?(?:from\s+)?(?:website|site|url)/i,
    /get\s+(?:data|info|content)\s+from\s+(.+)/i,
    /fetch\s+(?:the\s+)?(?:page|site)/i,
  ]],
  ['create_document', [
    /(?:create|make|generate)\s+(?:a\s+)?(?:document|doc|pdf|report)/i,
    /write\s+(?:a\s+)?(?:report|summary|article)/i,
  ]],
  ['organize_files', [
    /(?:organize|sort|arrange)\s+(?:files?|folders?)/i,
    /clean\s+up\s+(?:the\s+)?(?:files?|desktop|folder)/i,
    /move\s+(?:files?|everything)\s+to/i,
  ]],
  ['set_reminder', [
    /(?:remind|notify|alert)\s+(?:me\s+)?(?:to|about|at)/i,
    /(?:set|create)\s+(?:a\s+)?reminder/i,
    /don't\s+forget\s+(?:to\s+)?(.+)/i,
  ]],
  ['query_database', [
    /(?:query|search)\s+(?:the\s+)?(?:database|db|table)/i,
    /(?:run|execute)\s+(?:a\s+)?(?:sql|query)/i,
    /(?:select|get)\s+(?:data|rows?|records?)\s+from/i,
  ]],
  ['deploy_code', [
    /(?:deploy|push|release)\s+(?:the\s+)?(?:code|app|application)/i,
    /ship\s+(?:it|the\s+code)/i,
  ]],
  ['run_test', [
    /(?:run|execute)\s+(?:the\s+)?tests?/i,
    /test\s+(?:the\s+)?(?:code|app|feature)/i,
  ]],
  ['create_workflow', [
    /(?:create|build|make)\s+(?:a\s+)?(?:workflow|automation)/i,
    /automate\s+(.+)/i,
  ]],
  ['post_social', [
    /(?:post|publish|share|upload)\s+(?:to\s+)?(?:instagram|youtube|twitter|linkedin|tiktok|social)/i,
    /(?:post|share)\s+(?:my|the|this)?\s*(?:video|photo|image|reel|story)/i,
    /(?:upload|put)\s+(?:this\s+)?(?:on|to)\s+(?:instagram|youtube|twitter|tiktok)/i,
  ]],
  ['schedule_social', [
    /schedule\s+(?:a\s+)?(?:post|tweet|video|reel|story)/i,
    /post\s+(?:this\s+)?(?:at|on|later|tomorrow|next)/i,
  ]],
  ['cross_post', [
    /(?:cross[\-\s]?post|distribute|share)\s+(?:to\s+)?(?:all|every|multiple)\s*(?:platforms?)?/i,
    /(?:post|share)\s+(?:this\s+)?everywhere/i,
    /distribute\s+(?:the\s+)?(?:content|video|post)/i,
  ]],
  ['reply_comments', [
    /(?:reply|respond)\s+(?:to\s+)?(?:comments?|dms?|messages?)/i,
    /(?:manage|handle)\s+(?:the\s+)?comments?/i,
  ]],
  ['social_analytics', [
    /(?:show|get|check)\s+(?:my\s+)?(?:social|instagram|youtube|twitter)?\s*(?:analytics|stats|performance|engagement)/i,
    /how\s+(?:is|are)\s+my\s+(?:posts?|videos?)\s+(?:doing|performing)/i,
  ]],
  ['generate_hashtags', [
    /(?:generate|find|suggest|create)\s+(?:some\s+)?hashtags?/i,
    /(?:best|trending|top)\s+hashtags?\s+for/i,
  ]],
  ['generate_caption', [
    /(?:generate|write|create)\s+(?:a\s+)?caption/i,
    /(?:write|create)\s+(?:a\s+)?description\s+for/i,
    /caption\s+(?:for|about)/i,
  ]],
  ['write_blog', [
    /(?:write|create|generate)\s+(?:a\s+)?(?:blog\s*(?:post)?|article)/i,
    /(?:turn|convert)\s+(?:this\s+)?(?:into|to)\s+(?:a\s+)?(?:blog|article)/i,
  ]],
  ['create_carousel', [
    /(?:create|make|generate)\s+(?:a\s+)?(?:carousel|slides?|infographic)/i,
  ]],
  ['seo_optimize', [
    /(?:optimize|improve)\s+(?:for\s+)?seo/i,
    /seo\s+(?:check|audit|score)/i,
  ]],
  ['content_calendar', [
    /(?:create|generate|plan)\s+(?:a\s+)?(?:content)?\s*calendar/i,
    /(?:plan|schedule)\s+(?:my\s+)?content/i,
  ]],
  ['train_agent', [
    /(?:train|teach|educate)\s+(?:the\s+)?(?:agent|ai|model)/i,
    /learn\s+(?:from|how\s+to)\s+(.+)/i,
  ]],
  ['ask_question', [
    /^(?:what|who|where|when|why|how|which)/i,
    /\?$/,
  ]],
  ['general_command', [
    /.*/ // Fallback
  ]],
]);

// Entity extraction patterns
const entityPatterns: Map<EntityType, RegExp[]> = new Map([
  ['email_address', [
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
  ]],
  ['url', [
    /(https?:\/\/[^\s]+)/gi,
    /(www\.[^\s]+\.[a-zA-Z]{2,})/gi,
  ]],
  ['date', [
    /(\d{1,2}\/\d{1,2}\/\d{2,4})/g,
    /(\d{4}-\d{2}-\d{2})/g,
    /(today|tomorrow|yesterday)/gi,
    /(next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))/gi,
    /(this\s+(?:week|month|year))/gi,
  ]],
  ['time', [
    /(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[ap]m)?)/gi,
    /(\d{1,2}\s*[ap]m)/gi,
    /(noon|midnight|morning|afternoon|evening)/gi,
  ]],
  ['duration', [
    /(\d+)\s*(?:hours?|hrs?|h)/gi,
    /(\d+)\s*(?:minutes?|mins?|m)/gi,
    /(\d+)\s*(?:days?|d)/gi,
    /(\d+)\s*(?:weeks?|w)/gi,
  ]],
  ['file_path', [
    /([A-Za-z]:\\[^\s"']+)/g,
    /(\/[^\s"']+\.[a-zA-Z]{2,4})/g,
    /(["'])([^"']+\.[a-zA-Z]{2,4})\1/g,
  ]],
  ['number', [
    /(\d+(?:\.\d+)?)/g,
  ]],
  ['currency', [
    /(\$[\d,]+(?:\.\d{2})?)/g,
    /(\d+(?:\.\d{2})?\s*(?:dollars?|usd|eur|€|£))/gi,
  ]],
  ['programming_language', [
    /\b(javascript|typescript|python|java|c\+\+|c#|ruby|go|rust|php|swift|kotlin)\b/gi,
  ]],
  ['person_name', [
    /(?:to|for|with|by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g,
  ]],
]);

// Agent mapping based on intent
const intentAgentMap: Map<IntentType, string> = new Map([
  ['compose_email', 'email'],
  ['send_email', 'email'],
  ['schedule_meeting', 'calendar'],
  ['search_files', 'file'],
  ['analyze_data', 'data'],
  ['generate_code', 'code'],
  ['scrape_website', 'browser'],
  ['create_document', 'file'],
  ['organize_files', 'file'],
  ['set_reminder', 'calendar'],
  ['query_database', 'data'],
  ['deploy_code', 'code'],
  ['run_test', 'code'],
  ['create_workflow', 'workflow'],
  ['post_social', 'social_media'],
  ['schedule_social', 'social_media'],
  ['cross_post', 'social_media'],
  ['reply_comments', 'social_media'],
  ['social_analytics', 'social_media'],
  ['generate_hashtags', 'social_media'],
  ['generate_caption', 'content'],
  ['write_blog', 'content'],
  ['create_carousel', 'content'],
  ['seo_optimize', 'content'],
  ['content_calendar', 'content'],
  ['train_agent', 'training'],
  ['ask_question', 'general'],
  ['general_command', 'general'],
]);

export class IntentParser {
  private context: Context;
  private intentHistory: ParsedIntent[] = [];

  constructor(initialContext?: Partial<Context>) {
    this.context = {
      previousIntents: [],
      userPreferences: {},
      currentSession: {
        id: this.generateId(),
        startTime: new Date(),
        activeAgent: null,
        recentActions: [],
      },
      temporalContext: this.getTemporalContext(),
      ...initialContext,
    };
  }

  // Main parsing function
  parse(input: string): ParsedIntent {
    const normalizedInput = input.trim().toLowerCase();

    // Detect primary intent
    const { intent, confidence } = this.detectIntent(normalizedInput);

    // Extract entities
    const entities = this.extractEntities(input);

    // Determine suggested agent
    const suggestedAgent = intentAgentMap.get(intent) || 'general';

    // Extract parameters based on intent and entities
    const parameters = this.extractParameters(intent, entities, input);

    // Determine if follow-up is needed
    const { followUpNeeded, followUpQuestion } = this.checkFollowUp(intent, entities, parameters);

    const parsedIntent: ParsedIntent = {
      id: this.generateId(),
      rawInput: input,
      primaryIntent: intent,
      confidence,
      entities,
      context: this.context,
      suggestedAgent,
      action: this.determineAction(intent, parameters),
      parameters,
      followUpNeeded,
      followUpQuestion,
    };

    // Update context
    this.intentHistory.push(parsedIntent);
    this.context.previousIntents = this.intentHistory.slice(-10);

    return parsedIntent;
  }

  // Detect intent from input
  private detectIntent(input: string): { intent: IntentType; confidence: number } {
    let bestMatch: IntentType = 'general_command';
    let bestConfidence = 0;

    for (const [intentType, patterns] of intentPatterns) {
      for (const pattern of patterns) {
        if (pattern.test(input)) {
          // Calculate confidence based on pattern specificity
          const matchLength = input.match(pattern)?.[0]?.length || 0;
          const confidence = Math.min(0.95, 0.5 + (matchLength / input.length) * 0.45);

          if (confidence > bestConfidence) {
            bestConfidence = confidence;
            bestMatch = intentType;
          }
        }
      }
    }

    return { intent: bestMatch, confidence: bestConfidence };
  }

  // Extract entities from input
  private extractEntities(input: string): Entity[] {
    const entities: Entity[] = [];

    for (const [entityType, patterns] of entityPatterns) {
      for (const pattern of patterns) {
        let match;
        const regex = new RegExp(pattern.source, pattern.flags);

        while ((match = regex.exec(input)) !== null) {
          entities.push({
            type: entityType,
            value: match[1] || match[0],
            confidence: 0.85,
            position: { start: match.index, end: match.index + match[0].length },
          });
        }
      }
    }

    // Remove duplicates
    return this.deduplicateEntities(entities);
  }

  // Extract parameters based on intent
  private extractParameters(
    intent: IntentType,
    entities: Entity[],
    input: string
  ): Record<string, any> {
    const params: Record<string, any> = {};

    switch (intent) {
      case 'compose_email':
        params.to = entities.find(e => e.type === 'email_address')?.value;
        params.subject = this.extractSubject(input);
        params.body = this.extractBody(input);
        break;

      case 'schedule_meeting':
        params.date = entities.find(e => e.type === 'date')?.value;
        params.time = entities.find(e => e.type === 'time')?.value;
        params.duration = entities.find(e => e.type === 'duration')?.value;
        params.attendees = entities.filter(e => e.type === 'person_name').map(e => e.value);
        break;

      case 'search_files':
        params.query = this.extractSearchQuery(input);
        params.path = entities.find(e => e.type === 'file_path')?.value;
        break;

      case 'analyze_data':
        params.dataset = entities.find(e => e.type === 'file_path')?.value;
        params.analysisType = this.detectAnalysisType(input);
        break;

      case 'generate_code':
        params.language = entities.find(e => e.type === 'programming_language')?.value || 'typescript';
        params.description = this.extractCodeDescription(input);
        break;

      case 'scrape_website':
        params.url = entities.find(e => e.type === 'url')?.value;
        params.selector = this.extractSelector(input);
        break;

      case 'query_database':
        params.database = entities.find(e => e.type === 'database')?.value;
        params.query = this.extractSQLQuery(input);
        break;

      default:
        // General parameters
        params.rawInput = input;
        break;
    }

    return params;
  }

  // Check if follow-up is needed
  private checkFollowUp(
    intent: IntentType,
    entities: Entity[],
    params: Record<string, any>
  ): { followUpNeeded: boolean; followUpQuestion?: string } {
    switch (intent) {
      case 'compose_email':
        if (!params.to) {
          return { followUpNeeded: true, followUpQuestion: 'Who should I send this email to?' };
        }
        if (!params.subject) {
          return { followUpNeeded: true, followUpQuestion: 'What should be the subject of the email?' };
        }
        break;

      case 'schedule_meeting':
        if (!params.date) {
          return { followUpNeeded: true, followUpQuestion: 'What date should I schedule the meeting?' };
        }
        if (!params.time) {
          return { followUpNeeded: true, followUpQuestion: 'What time works best for the meeting?' };
        }
        break;

      case 'scrape_website':
        if (!params.url) {
          return { followUpNeeded: true, followUpQuestion: 'Which website would you like me to scrape?' };
        }
        break;

      case 'generate_code':
        if (!params.description) {
          return { followUpNeeded: true, followUpQuestion: 'What would you like me to code?' };
        }
        break;
    }

    return { followUpNeeded: false };
  }

  // Determine action string
  private determineAction(intent: IntentType, params: Record<string, any>): string {
    const actionMap: Record<IntentType, string> = {
      compose_email: `compose_email:${params.to || 'unknown'}`,
      send_email: 'send_email:execute',
      schedule_meeting: `schedule_meeting:${params.date || 'unknown'}`,
      search_files: `search_files:${params.query || 'all'}`,
      analyze_data: `analyze_data:${params.analysisType || 'general'}`,
      generate_code: `generate_code:${params.language || 'typescript'}`,
      scrape_website: `scrape_website:${params.url || 'unknown'}`,
      create_document: 'create_document:execute',
      organize_files: 'organize_files:execute',
      set_reminder: 'set_reminder:execute',
      query_database: 'query_database:execute',
      deploy_code: 'deploy_code:execute',
      run_test: 'run_test:execute',
      create_workflow: 'create_workflow:execute',
      post_social: `post_social:${params.platform || 'instagram'}`,
      schedule_social: `schedule_social:${params.platform || 'instagram'}`,
      cross_post: 'cross_post:all_platforms',
      reply_comments: 'reply_comments:execute',
      social_analytics: `social_analytics:${params.platform || 'all'}`,
      generate_hashtags: `generate_hashtags:${params.topic || 'general'}`,
      generate_caption: `generate_caption:${params.platform || 'instagram'}`,
      write_blog: 'write_blog:execute',
      create_carousel: 'create_carousel:execute',
      seo_optimize: 'seo_optimize:execute',
      content_calendar: 'content_calendar:generate',
      train_agent: 'train_agent:execute',
      ask_question: 'ask_question:process',
      general_command: 'general:process',
    };

    return actionMap[intent] || 'unknown:execute';
  }

  // Helper methods
  private generateId(): string {
    return `intent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getTemporalContext(): TemporalContext {
    const now = new Date();
    const hour = now.getHours();
    return {
      currentTime: now,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      dayOfWeek: now.getDay(),
      isWorkHours: hour >= 9 && hour <= 17,
    };
  }

  private deduplicateEntities(entities: Entity[]): Entity[] {
    const seen = new Set<string>();
    return entities.filter(entity => {
      const key = `${entity.type}:${entity.value}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private extractSubject(input: string): string | undefined {
    const subjectMatch = input.match(/subject[:\s]+["']?([^"'\n]+)["']?/i);
    return subjectMatch?.[1]?.trim();
  }

  private extractBody(input: string): string | undefined {
    const bodyMatch = input.match(/(?:body|content|message)[:\s]+["']?([^"'\n]+)["']?/i);
    return bodyMatch?.[1]?.trim();
  }

  private extractSearchQuery(input: string): string {
    const queryMatch = input.match(/(?:search|find|locate)\s+(?:for\s+)?["']?([^"'\n]+)["']?/i);
    return queryMatch?.[1]?.trim() || input;
  }

  private detectAnalysisType(input: string): string {
    if (/trend/i.test(input)) return 'trend';
    if (/statistic/i.test(input)) return 'statistics';
    if (/pattern/i.test(input)) return 'pattern';
    if (/visuali/i.test(input)) return 'visualization';
    if (/predict/i.test(input)) return 'prediction';
    return 'general';
  }

  private extractCodeDescription(input: string): string {
    // Remove common prefixes
    const cleaned = input
      .replace(/^(?:generate|create|write|implement|build)\s+(?:code|function|class|script)\s+(?:for|that)\s*/i, '')
      .replace(/^(?:in\s+\w+\s*)/i, '')
      .trim();
    return cleaned || input;
  }

  private extractSelector(input: string): string | undefined {
    const selectorMatch = input.match(/(?:selector|element|class|id)[:\s]+["']?([^"'\n]+)["']?/i);
    return selectorMatch?.[1]?.trim();
  }

  private extractSQLQuery(input: string): string | undefined {
    const sqlMatch = input.match(/(?:sql|query)[:\s]+["']?([^"'\n]+)["']?/i);
    return sqlMatch?.[1]?.trim();
  }

  // Update context
  updateContext(updates: Partial<Context>): void {
    this.context = { ...this.context, ...updates };
  }

  // Get current context
  getContext(): Context {
    return this.context;
  }

  // Get intent history
  getHistory(): ParsedIntent[] {
    return [...this.intentHistory];
  }

  // Clear history
  clearHistory(): void {
    this.intentHistory = [];
    this.context.previousIntents = [];
  }
}

// Export singleton instance
export const intentParser = new IntentParser();
