/**
 * Daily Standup Workflow Template
 * Automates daily standup meeting preparation and follow-up
 */

import { WorkflowTemplate } from '../types';

export const dailyStandupWorkflow: WorkflowTemplate = {
    id: 'daily-standup',
    name: 'Daily Standup Automation',
    description: 'Automates daily standup preparation, note-taking, and task tracking',
    version: '1.0.0',
    category: 'productivity',
    triggers: [
        { type: 'schedule', cron: '0 9 * * 1-5' }, // Weekdays at 9 AM
        { type: 'manual' }
    ],
    steps: [
        {
            id: 'prepare-standup',
            name: 'Prepare Standup Notes',
            type: 'prompt',
            config: {
                prompt: 'Generate my daily standup update based on:\n1. What I completed yesterday\n2. What I plan to do today\n3. Any blockers or challenges',
                connectors: ['jira', 'github', 'slack']
            }
        },
        {
            id: 'fetch-yesterday-tasks',
            name: 'Fetch Completed Tasks',
            type: 'action',
            config: {
                connector: 'jira',
                action: 'getIssues',
                params: {
                    jql: 'assignee = currentUser() AND updated >= -1d AND status != "To Do"'
                }
            }
        },
        {
            id: 'fetch-today-tasks',
            name: 'Fetch Today\'s Tasks',
            type: 'action',
            config: {
                connector: 'jira',
                action: 'getIssues',
                params: {
                    jql: 'assignee = currentUser() AND status = "In Progress"'
                }
            }
        },
        {
            id: 'check-blockers',
            name: 'Check for Blockers',
            type: 'action',
            config: {
                connector: 'slack',
                action: 'searchMessages',
                params: {
                    query: 'blocker OR blocked OR stuck',
                    channels: ['team-dev', 'team-general']
                }
            }
        },
        {
            id: 'post-standup',
            name: 'Post Standup Update',
            type: 'action',
            config: {
                connector: 'slack',
                action: 'sendMessage',
                params: {
                    channel: '#daily-standup',
                    format: 'formatted'
                }
            }
        },
        {
            id: 'create-followup-tasks',
            name: 'Create Follow-up Tasks',
            type: 'conditional',
            config: {
                condition: 'hasBlockers',
                ifTrue: {
                    connector: 'jira',
                    action: 'createIssue',
                    params: {
                        project: 'TEAM',
                        issuetype: 'Task',
                        priority: 'High'
                    }
                }
            }
        }
    ],
    outputs: [
        { name: 'standupNotes', type: 'string' },
        { name: 'completedTasks', type: 'array' },
        { name: 'plannedTasks', type: 'array' },
        { name: 'blockers', type: 'array' }
    ]
};
