# Connectors Documentation

This document provides an overview of all available connectors in the AI Automation Suite.

## Available Connectors

### Cloud Storage
- **GoogleDrive** - Google Drive file management
- **Dropbox** - Dropbox cloud storage
- **OneDrive** - Microsoft OneDrive integration

### Communication
- **Slack** - Team messaging and collaboration
- **Gmail** - Email management and automation

### Project Management
- **Notion** - Workspace and database management
- **GitHub** - Repository and issue tracking
- **Jira** - Issue tracking and project management (NEW)
- **Trello** - Kanban boards and task management (NEW)
- **Asana** - Task and project tracking (NEW)
- **Linear** - Issue tracking for software teams (NEW)

### Database
- **MongoDB** - NoSQL database operations
- **PostgreSQL** - Relational database (NEW)
- **MySQL** - Relational database (NEW)

### CRM & Business
- **Salesforce** - Customer relationship management (NEW)
- **Airtable** - Database-spreadsheet hybrid (NEW)
- **Stripe** - Payment processing (NEW)

### Calendar
- **Google Calendar** - Scheduling and events

## Connector Interface

All connectors extend the `BaseConnector` class and implement:

```typescript
abstract class BaseConnector {
    isAuthenticated: boolean;
    getServiceName(): string;
    isConnected(): boolean;
    disconnect(): Promise<void>;
}
```

## Usage Example

```typescript
import { AirtableConnector } from './connectors/airtable/AirtableConnector';

const connector = new AirtableConnector();
await connector.authenticate(API_KEY, BASE_ID);

// List records
const records = await connector.listRecords('Tasks');

// Create record
const newRecord = await connector.createRecord('Tasks', {
    Name: 'New Task',
    Status: 'Pending'
});
```

## Adding New Connectors

See [CONTRIBUTING.md](../../../CONTRIBUTING.md) for guidelines on adding new connectors.

## Authentication

Each connector handles authentication differently:
- OAuth 2.0 (Google, Dropbox, etc.)
- API Keys (Airtable, Stripe, etc.)
- Token-based (Slack, Notion, etc.)
- Basic Auth (Jira, databases)

Refer to individual connector documentation for specific authentication requirements.
