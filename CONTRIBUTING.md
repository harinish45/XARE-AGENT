# Contributing to AI Automation Suite

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Adding New Connectors](#adding-new-connectors)
- [Creating Workflow Templates](#creating-workflow-templates)

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Collaborate openly

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/repo.git`
3. Add upstream remote: `git remote add upstream https://github.com/ORIGINAL_OWNER/repo.git`
4. Create a branch: `git checkout -b feature/your-feature-name`

## Development Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Installing Dependencies

```bash
# Root dependencies
npm install

# AI Desktop Agent
cd ai-desktop-agent && npm install

# Chrome Extension
cd my-ai-extension && npm install

# Antigravity Web Platform
cd antigravity && npm install
```

## Project Structure

```
/workspace
├── ai-desktop-agent/      # Electron desktop application
│   ├── src/
│   │   ├── agent/         # Core AI agent logic
│   │   ├── automation/    # Automation workflows
│   │   ├── controllers/   # System controllers
│   │   ├── services/      # Background services
│   │   └── renderer/      # React UI components
│   └── __tests__/         # Unit and e2e tests
├── my-ai-extension/       # Chrome extension
│   └── src/
│       ├── lib/
│       │   ├── connectors/ # External service integrations
│       │   ├── llm/        # LLM providers
│       │   └── templates/  # Workflow templates
│       └── background/     # Service worker
└── antigravity/           # Next.js web platform
    └── src/
        ├── app/           # App router pages
        └── lib/           # Shared utilities
```

## Coding Standards

### JavaScript/TypeScript

- Use ES6+ features
- Prefer async/await over callbacks
- Use TypeScript for new code in extension
- Follow existing code style

### Naming Conventions

- Classes: PascalCase (`AirtableConnector`)
- Functions/variables: camelCase (`getUserInfo`)
- Constants: UPPER_SNAKE_CASE (`API_BASE_URL`)
- Files: Match exported class/function name

### Documentation

- JSDoc comments for public APIs
- Inline comments for complex logic
- README updates for new features

## Testing

### Running Tests

```bash
# AI Desktop Agent
cd ai-desktop-agent
npm test                    # Unit tests
npm run test:e2e           # End-to-end tests
npm run test:coverage      # Coverage report

# Chrome Extension
cd my-ai-extension
npm test
```

### Writing Tests

- Test critical paths first
- Mock external dependencies
- Aim for >80% coverage on new code
- Include both positive and negative cases

Example test:
```javascript
describe('MyService', () => {
    let service;

    beforeEach(() => {
        service = new MyService();
    });

    it('should do something', async () => {
        const result = await service.doSomething();
        expect(result).toBe(expected);
    });
});
```

## Pull Request Process

1. **Create PR**: From your feature branch to `main`
2. **Title Format**: `type(scope): description`
   - Types: feat, fix, docs, style, refactor, test, chore
   - Example: `feat(connectors): add Linear integration`
3. **Description**: Include what, why, and how
4. **Tests**: Ensure all tests pass
5. **Review**: Address feedback promptly
6. **Merge**: Squash and merge after approval

### PR Checklist

- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No linting errors
- [ ] Changelog entry (if applicable)

## Adding New Connectors

1. Create directory: `my-ai-extension/src/lib/connectors/<service>/`
2. Extend `BaseConnector`:

```typescript
import { BaseConnector } from '../BaseConnector';

export class MyConnector extends BaseConnector {
    constructor() {
        super('my-service');
    }

    async authenticate(credentials: any): Promise<void> {
        // Implementation
    }

    // Add service-specific methods
}
```

3. Add TypeScript interfaces for API responses
4. Implement error handling
5. Add tests in `__tests__/connectors/`
6. Update connector registry
7. Document in CONNECTORS.md

## Creating Workflow Templates

1. Create file: `my-ai-extension/src/lib/templates/workflows/<name>.ts`
2. Define workflow structure:

```typescript
export const myWorkflow: WorkflowTemplate = {
    id: 'my-workflow',
    name: 'My Workflow',
    description: 'What it does',
    triggers: [...],
    steps: [...],
    outputs: [...]
};
```

3. Test with various inputs
4. Add to template index
5. Document use cases

## Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(connectors): add Stripe payment integration

- Implement StripeConnector class
- Add payment processing methods
- Include webhook handling
- Add comprehensive tests

Closes #123
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Tests
- `chore`: Maintenance

## Questions?

Open an issue with the "question" label or reach out in discussions.

## License

By contributing, you agree that your contributions will be licensed under the project's license.
