// Calendar Agent - Handles scheduling, reminders, and time management
// Creates events, sets reminders, finds available time slots

import { ParsedIntent } from './IntentParser';
import { Agent, AgentResult } from './AgentRouter';

export interface CalendarEvent {
    id: string;
    title: string;
    description?: string;
    start: Date;
    end: Date;
    allDay: boolean;
    location?: string;
    attendees: Attendee[];
    reminders: Reminder[];
    recurrence?: RecurrenceRule;
    status: 'confirmed' | 'tentative' | 'cancelled';
    organizer?: string;
    conferenceData?: ConferenceData;
}

export interface Attendee {
    email: string;
    name?: string;
    status: 'accepted' | 'declined' | 'tentative' | 'needsAction';
}

export interface Reminder {
    method: 'email' | 'popup';
    minutes: number;
}

export interface RecurrenceRule {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    count?: number;
    until?: Date;
    byDay?: string[];
    byMonthDay?: number[];
}

export interface ConferenceData {
    type: 'hangoutsMeet' | 'zoom' | 'teams' | 'custom';
    url: string;
    phoneNumber?: string;
}

export interface TimeSlot {
    start: Date;
    end: Date;
    available: boolean;
    reason?: string;
}

export interface CalendarAgentConfig {
    provider: 'google' | 'outlook' | 'apple' | 'caldav';
    defaultTimezone: string;
    workingHours: {
        start: string;
        end: string;
        days: number[];
    };
    defaultReminders: Reminder[];
}

export class CalendarAgent {
    private config: CalendarAgentConfig;
    private events: Map<string, CalendarEvent> = new Map();

    constructor(config?: Partial<CalendarAgentConfig>) {
        this.config = {
            provider: config?.provider || 'google',
            defaultTimezone: config?.defaultTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            workingHours: config?.workingHours || {
                start: '09:00',
                end: '17:00',
                days: [1, 2, 3, 4, 5], // Monday to Friday
            },
            defaultReminders: config?.defaultReminders || [
                { method: 'popup', minutes: 10 },
                { method: 'email', minutes: 60 },
            ],
            ...config,
        };
    }

    // Main execution method
    async execute(intent: ParsedIntent, agent: Agent): Promise<AgentResult> {
        const startTime = Date.now();

        try {
            let result: any;

            switch (intent.primaryIntent) {
                case 'schedule_meeting':
                    result = await this.scheduleMeeting(intent.parameters);
                    break;
                case 'set_reminder':
                    result = await this.setReminder(intent.parameters);
                    break;
                default:
                    result = await this.handleGeneralCalendarTask(intent);
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

    // Create event
    async createEvent(params: {
        title: string;
        description?: string;
        start: Date | string;
        end?: Date | string;
        duration?: number; // in minutes
        location?: string;
        attendees?: string[];
        reminders?: Reminder[];
        recurrence?: RecurrenceRule;
    }): Promise<CalendarEvent> {
        const id = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Parse dates
        const startDate = typeof params.start === 'string'
            ? this.parseDate(params.start)
            : params.start;

        let endDate = params.end
            ? (typeof params.end === 'string' ? this.parseDate(params.end) : params.end)
            : undefined;

        if (!endDate && params.duration) {
            endDate = new Date(startDate.getTime() + params.duration * 60000);
        } else if (!endDate) {
            endDate = new Date(startDate.getTime() + 60 * 60000); // Default 1 hour
        }

        const event: CalendarEvent = {
            id,
            title: params.title,
            description: params.description,
            start: startDate,
            end: endDate,
            allDay: false,
            location: params.location,
            attendees: (params.attendees || []).map(email => ({
                email,
                status: 'needsAction' as const,
            })),
            reminders: params.reminders || this.config.defaultReminders,
            recurrence: params.recurrence,
            status: 'confirmed',
        };

        this.events.set(id, event);

        return event;
    }

    // Schedule meeting
    async scheduleMeeting(params: Record<string, any>): Promise<{
        event: CalendarEvent;
        conflicts: CalendarEvent[];
        suggestions?: TimeSlot[];
    }> {
        const {
            title,
            date,
            time,
            duration = 60,
            attendees,
            location,
            findBestTime = false,
        } = params;

        // Parse date and time
        const startDateTime = this.parseDateTime(date, time);
        const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

        // Check for conflicts
        const conflicts = this.findConflicts(startDateTime, endDateTime);

        // If conflicts exist and findBestTime is true, suggest alternatives
        let suggestions: TimeSlot[] = [];
        if (conflicts.length > 0 && findBestTime) {
            suggestions = await this.findAvailableSlots(startDateTime, duration, 5);
        }

        // Create the event
        const event = await this.createEvent({
            title: title || 'Meeting',
            start: startDateTime,
            duration,
            location,
            attendees,
        });

        return {
            event,
            conflicts,
            suggestions: suggestions.length > 0 ? suggestions : undefined,
        };
    }

    // Set reminder
    async setReminder(params: Record<string, any>): Promise<{
        reminder: CalendarEvent;
        message: string;
    }> {
        const { title, datetime, message, remindBefore = 10 } = params;

        const reminderTime = typeof datetime === 'string'
            ? this.parseDateTime(datetime)
            : datetime;

        const event = await this.createEvent({
            title: title || 'Reminder',
            description: message,
            start: reminderTime,
            duration: 0,
            reminders: [{ method: 'popup', minutes: remindBefore }],
        });

        return {
            reminder: event,
            message: `Reminder set for ${this.formatDateTime(reminderTime)}`,
        };
    }

    // Find available time slots
    async findAvailableSlots(
        startDate: Date,
        durationMinutes: number,
        count: number = 5
    ): Promise<TimeSlot[]> {
        const slots: TimeSlot[] = [];
        let currentDate = new Date(startDate);

        // Search for the next 14 days
        for (let i = 0; i < 14 && slots.length < count; i++) {
            const dayOfWeek = currentDate.getDay();

            // Check if it's a working day
            if (this.config.workingHours.days.includes(dayOfWeek)) {
                const [startHour, startMinute] = this.config.workingHours.start.split(':').map(Number);
                const [endHour, endMinute] = this.config.workingHours.end.split(':').map(Number);

                // Check each hour slot
                for (let hour = startHour; hour < endHour; hour++) {
                    const slotStart = new Date(currentDate);
                    slotStart.setHours(hour, startMinute, 0, 0);

                    const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);

                    // Check if slot is within working hours
                    if (slotEnd.getHours() <= endHour) {
                        const conflicts = this.findConflicts(slotStart, slotEnd);

                        if (conflicts.length === 0) {
                            slots.push({
                                start: slotStart,
                                end: slotEnd,
                                available: true,
                            });

                            if (slots.length >= count) break;
                        }
                    }
                }
            }

            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return slots;
    }

    // Find conflicts
    private findConflicts(start: Date, end: Date): CalendarEvent[] {
        const conflicts: CalendarEvent[] = [];

        this.events.forEach(event => {
            if (event.status === 'cancelled') return;

            // Check for overlap
            if (start < event.end && end > event.start) {
                conflicts.push(event);
            }
        });

        return conflicts;
    }

    // Get events for a date range
    async getEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
        const events: CalendarEvent[] = [];

        this.events.forEach(event => {
            if (event.start >= startDate && event.end <= endDate) {
                events.push(event);
            }
        });

        return events.sort((a, b) => a.start.getTime() - b.start.getTime());
    }

    // Get today's events
    async getTodayEvents(): Promise<CalendarEvent[]> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return this.getEvents(today, tomorrow);
    }

    // Get upcoming events
    async getUpcomingEvents(count: number = 10): Promise<CalendarEvent[]> {
        const now = new Date();
        const events: CalendarEvent[] = [];

        this.events.forEach(event => {
            if (event.start >= now && event.status !== 'cancelled') {
                events.push(event);
            }
        });

        return events
            .sort((a, b) => a.start.getTime() - b.start.getTime())
            .slice(0, count);
    }

    // Update event
    async updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
        const event = this.events.get(eventId);
        if (!event) return null;

        const updatedEvent = { ...event, ...updates };
        this.events.set(eventId, updatedEvent);

        return updatedEvent;
    }

    // Cancel event
    async cancelEvent(eventId: string): Promise<boolean> {
        const event = this.events.get(eventId);
        if (!event) return false;

        event.status = 'cancelled';
        return true;
    }

    // Delete event
    async deleteEvent(eventId: string): Promise<boolean> {
        return this.events.delete(eventId);
    }

    // Add attendee
    async addAttendee(eventId: string, email: string): Promise<boolean> {
        const event = this.events.get(eventId);
        if (!event) return false;

        event.attendees.push({
            email,
            status: 'needsAction',
        });

        return true;
    }

    // Remove attendee
    async removeAttendee(eventId: string, email: string): Promise<boolean> {
        const event = this.events.get(eventId);
        if (!event) return false;

        event.attendees = event.attendees.filter(a => a.email !== email);
        return true;
    }

    // Handle general calendar task
    private async handleGeneralCalendarTask(intent: ParsedIntent): Promise<any> {
        const input = intent.rawInput.toLowerCase();

        if (input.includes('today') || input.includes('agenda')) {
            return this.getTodayEvents();
        }

        if (input.includes('upcoming') || input.includes('next')) {
            return this.getUpcomingEvents();
        }

        if (input.includes('free') || input.includes('available')) {
            const now = new Date();
            return this.findAvailableSlots(now, 60, 5);
        }

        return {
            message: 'Calendar task processed',
            suggestions: [
                'Schedule a meeting',
                'Set a reminder',
                'Check today\'s events',
                'Find available time slots',
            ],
        };
    }

    // Helper methods
    private parseDate(dateStr: string): Date {
        const today = new Date();

        if (dateStr.toLowerCase() === 'today') {
            return today;
        }
        if (dateStr.toLowerCase() === 'tomorrow') {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return tomorrow;
        }

        // Try parsing as date string
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
            return parsed;
        }

        return today;
    }

    private parseDateTime(dateStr: string, timeStr?: string): Date {
        const date = this.parseDate(dateStr);

        if (timeStr) {
            const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
            if (timeMatch) {
                let hours = parseInt(timeMatch[1]);
                const minutes = parseInt(timeMatch[2]);
                const meridiem = timeMatch[3]?.toLowerCase();

                if (meridiem === 'pm' && hours < 12) hours += 12;
                if (meridiem === 'am' && hours === 12) hours = 0;

                date.setHours(hours, minutes, 0, 0);
            }
        }

        return date;
    }

    private formatDateTime(date: Date): string {
        return date.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    }

    // Get config
    getConfig(): CalendarAgentConfig {
        return { ...this.config };
    }

    // Update config
    updateConfig(updates: Partial<CalendarAgentConfig>): void {
        this.config = { ...this.config, ...updates };
    }
}

// Export factory function
export function createCalendarAgent(config?: Partial<CalendarAgentConfig>): CalendarAgent {
    return new CalendarAgent(config);
}
