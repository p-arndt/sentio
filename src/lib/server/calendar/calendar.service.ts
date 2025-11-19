/**
 * Calendar Service
 * Handles OAuth token management and API calls to Google Calendar and Microsoft Graph
 */

import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { CalendarEvent, GoogleCalendarEvent } from './types';

export type RefreshTokenResult = {
	accessToken: string;
	refreshToken?: string;
	expiresIn?: number;
};

/**
 * Refresh OAuth token if expired
 */
export async function refreshAccessToken(
	refreshToken: string,
	provider: 'google' | 'microsoft'
): Promise<RefreshTokenResult> {
	if (provider === 'google') {
		return refreshGoogleToken(refreshToken);
	} else if (provider === 'microsoft') {
		return refreshMicrosoftToken(refreshToken);
	}

	throw new Error(`Unsupported provider: ${provider}`);
}

/**
 * Refresh Google OAuth token
 */
async function refreshGoogleToken(refreshToken: string): Promise<RefreshTokenResult> {
	const response = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: new URLSearchParams({
			client_id: env.GOOGLE_CLIENT_ID || '',
			client_secret: env.GOOGLE_CLIENT_SECRET || '',
			refresh_token: refreshToken,
			grant_type: 'refresh_token'
		})
	});

	if (!response.ok) {
		throw new Error(`Failed to refresh Google token: ${response.statusText}`);
	}

	const data = (await response.json()) as {
		access_token: string;
		refresh_token?: string;
		expires_in: number;
	};

	return {
		accessToken: data.access_token,
		refreshToken: data.refresh_token,
		expiresIn: data.expires_in
	};
}

/**
 * Refresh Microsoft OAuth token
 */
async function refreshMicrosoftToken(refreshToken: string): Promise<RefreshTokenResult> {
	const tenant = env.MICROSOFT_TENANT_ID || publicEnv.PUBLIC_MICROSOFT_TENANT_ID || 'common';
	const tokenUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;

	const response = await fetch(tokenUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: new URLSearchParams({
			client_id: env.MICROSOFT_CLIENT_ID || publicEnv.PUBLIC_MICROSOFT_CLIENT_ID || '',
			client_secret: env.MICROSOFT_CLIENT_SECRET || '',
			refresh_token: refreshToken,
			grant_type: 'refresh_token',
			scope: 'Calendars.Read'
		})
	});

	if (!response.ok) {
		throw new Error(`Failed to refresh Microsoft token: ${response.statusText}`);
	}

	const data = (await response.json()) as {
		access_token: string;
		refresh_token?: string;
		expires_in: number;
	};

	return {
		accessToken: data.access_token,
		refreshToken: data.refresh_token,
		expiresIn: data.expires_in
	};
}

/**
 * Fetch events from Google Calendar
 */
export async function fetchGoogleCalendarEvents(
	accessToken: string,
	calendarId: string = 'primary',
	timeMin?: Date,
	maxResults: number = 20
): Promise<CalendarEvent[]> {
	const params = new URLSearchParams({
		maxResults: maxResults.toString(),
		singleEvents: 'true',
		orderBy: 'startTime'
	});

	params.append('timeMin', new Date().toISOString());

	const response = await fetch(
		`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
				Accept: 'application/json'
			}
		}
	);

	if (!response.ok) {
		throw new Error(`Failed to fetch Google Calendar events: ${response.statusText}`);
	}

	const data = (await response.json()) as {
		items: GoogleCalendarEvent[];
		nextSyncToken?: string;
	};

	// filter birthday events
	const filteredItems = data.items?.filter((event) => {
		return event.eventType !== 'birthday';
	});

	return (filteredItems || []).map(
		(event: GoogleCalendarEvent): CalendarEvent => ({
			externalEventId: event.id,
			provider: 'google' as const,
			title: event.summary || '(No title)',
			description: event.description,
			startTime: event.start?.dateTime
				? new Date(event.start.dateTime)
				: new Date(event.start?.date || ''),
			endTime: event.end?.dateTime ? new Date(event.end.dateTime) : new Date(event.end?.date || ''),
			isAllDay: !event.start?.dateTime,
			location: event.location,
			attendeeCount: event.attendees?.length || 0,
			externalMetadata: event as unknown as Record<string, unknown>
		})
	);
}

/**
 * Fetch events from Microsoft Graph (Outlook)
 */
export async function fetchMicrosoftCalendarEvents(
	accessToken: string,
	timeMin?: Date,
	maxResults: number = 20
): Promise<CalendarEvent[]> {
	const filter = timeMin ? `&$filter=start/dateTime ge '${timeMin.toISOString()}'` : '';

	const response = await fetch(
		`https://graph.microsoft.com/v1.0/me/events?$top=${maxResults}&$orderby=start/dateTime${filter}`,
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
				Accept: 'application/json',
				Prefer: 'outlook.timezone="UTC"'
			}
		}
	);

	if (!response.ok) {
		throw new Error(`Failed to fetch Microsoft Calendar events: ${response.statusText}`);
	}

	const data = (await response.json()) as {
		value: Array<{
			id: string;
			subject?: string;
			bodyPreview?: string;
			start?: { dateTime?: string };
			end?: { dateTime?: string };
			isAllDay?: boolean;
			location?: { displayName?: string };
			attendees?: Array<{ emailAddress?: { address: string } }>;
		}>;
	};

	return (data.value || []).map((event) => ({
		externalEventId: event.id,
		provider: 'microsoft',
		title: event.subject || '(No title)',
		description: event.bodyPreview,
		startTime: event.start?.dateTime ? new Date(event.start.dateTime) : new Date(),
		endTime: event.end?.dateTime ? new Date(event.end.dateTime) : new Date(),
		isAllDay: event.isAllDay || false,
		location: event.location?.displayName,
		attendeeCount: event.attendees?.length || 0,
		externalMetadata: event
	}));
}

/**
 * Calculate event duration in minutes
 */
export function calculateEventDuration(startTime: Date, endTime: Date): number {
	return Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
}

/**
 * Detect meeting intensity (number of meetings in a given period)
 */
export function detectMeetingIntensity(
	events: CalendarEvent[],
	durationHours: number = 24
): number {
	const now = new Date();
	const periodStart = new Date(now.getTime() - durationHours * 60 * 60 * 1000);

	return events.filter((event) => {
		return event.startTime >= periodStart && event.startTime <= now;
	}).length;
}

/**
 * Check if an event ended recently (within lastMinutes)
 */
export function hasEventEndedRecently(event: CalendarEvent, lastMinutes: number = 10): boolean {
	const now = new Date();
	const minutesSinceEnd = (now.getTime() - event.endTime.getTime()) / (1000 * 60);

	return minutesSinceEnd > 0 && minutesSinceEnd <= lastMinutes;
}
