/**
 * Mood Prompt Processor
 * Detects when calendar events end and triggers mood prompts
 * Can be run periodically (e.g., every 5-10 minutes) via cron or background job
 */

import { db } from '$lib/server/db';
import { calendarEvent, calendarEntry } from '$lib/server/db/schema';
import { and, eq, lte, gte } from 'drizzle-orm';
import type { MoodPromptTrigger } from './types';

/**
 * Process mood prompts for all users
 * Call this periodically to detect completed events and trigger prompts
 */
export async function processMoodPrompts(): Promise<MoodPromptTrigger[]> {
	console.log('[Mood Prompt] Starting mood prompt processing');

	try {
		const now = new Date();
		const recentThreshold = new Date(now.getTime() - 15 * 60 * 1000); // Last 15 minutes

		// Find events that ended recently and haven't prompted yet
		const events = await db
			.select()
			.from(calendarEvent)
			.where(
				and(
					// Event ended recently
					lte(calendarEvent.endTime, now),
					gte(calendarEvent.endTime, recentThreshold),
					// Mood prompt not yet sent
					eq(calendarEvent.moodPromptSent, false),
					// Mood not already logged
					eq(calendarEvent.moodLogged, false)
				)
			);

		console.log(
			`[Mood Prompt] Found ${events.length} events needing mood prompts in the last 15 minutes`
		);

		const triggers: MoodPromptTrigger[] = [];

		for (const event of events) {
			try {
				const trigger = await triggerMoodPrompt(event);
				triggers.push(trigger);
			} catch (error) {
				console.error(`[Mood Prompt] Error triggering mood prompt for event ${event.id}:`, error);
			}
		}

		console.log(`[Mood Prompt] Created ${triggers.length} mood prompt triggers`);
		return triggers;
	} catch (error) {
		console.error('[Mood Prompt] Fatal error in mood prompt processing:', error);
		throw error;
	}
}

/**
 * Trigger a mood prompt for a specific event
 */
async function triggerMoodPrompt(
	event: typeof calendarEvent.$inferSelect
): Promise<MoodPromptTrigger> {
	// Mark that we sent a prompt
	await db
		.update(calendarEvent)
		.set({
			moodPromptSent: true,
			moodPromptSentAt: new Date(),
			updatedAt: new Date()
		})
		.where(eq(calendarEvent.id, event.id));

	console.log(
		`[Mood Prompt] Triggered mood prompt for event: "${event.title}" (${event.provider}) for user ${event.userId}`
	);

	return {
		eventId: event.id,
		userId: event.userId,
		eventTitle: event.title,
		eventEndTime: event.endTime,
		provider: event.provider as 'google' | 'microsoft'
	};
}

/**
 * Get upcoming mood prompts for a user
 * Useful for showing pending prompts on the dashboard
 */
export async function getUpcomingMoodPrompts(
	userId: string,
	hoursAhead: number = 2
): Promise<typeof calendarEvent.$inferSelect[]> {
	const now = new Date();
	const futureThreshold = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

	return db
		.select()
		.from(calendarEvent)
		.where(
			and(
				eq(calendarEvent.userId, userId),
				lte(calendarEvent.endTime, futureThreshold),
				gte(calendarEvent.endTime, now),
				eq(calendarEvent.moodLogged, false)
			)
		);
}

/**
 * Get pending mood prompts for a user (events that ended recently but not prompted)
 */
export async function getPendingMoodPrompts(userId: string): Promise<typeof calendarEvent.$inferSelect[]> {
	const now = new Date();
	const recentThreshold = new Date(now.getTime() - 15 * 60 * 1000);

	return db
		.select()
		.from(calendarEvent)
		.where(
			and(
				eq(calendarEvent.userId, userId),
				lte(calendarEvent.endTime, now),
				gte(calendarEvent.endTime, recentThreshold),
				eq(calendarEvent.moodPromptSent, false)
			)
		);
}

/**
 * Link a mood entry to a calendar event
 * Called when user logs a mood that was triggered by an event
 */
export async function linkMoodToCalendarEvent(
	moodEntryId: string,
	eventId: string
): Promise<void> {
	await db
		.update(calendarEvent)
		.set({
			moodEntryId,
			moodLogged: true,
			updatedAt: new Date()
		})
		.where(eq(calendarEvent.id, eventId));

	console.log(`[Mood Prompt] Linked mood entry ${moodEntryId} to calendar event ${eventId}`);
}

/**
 * Analyze meeting intensity and suggest reflection
 * Returns a suggestion message if user had many meetings
 */
export async function getMeetingIntensityAnalysis(userId: string, hours: number = 24): Promise<string | null> {
	const now = new Date();
	const periodStart = new Date(now.getTime() - hours * 60 * 60 * 1000);

	const events = await db
		.select()
		.from(calendarEvent)
		.where(
			and(
				eq(calendarEvent.userId, userId),
				gte(calendarEvent.startTime, periodStart),
				lte(calendarEvent.startTime, now)
			)
		);

	const meetingCount = events.length;
	const totalDuration = events.reduce((sum, e) => sum + (e.duration || 0), 0);

	if (meetingCount >= 6) {
		return `You had ${meetingCount} meetings today (${Math.round(totalDuration / 60)} hours). Time to unwind? 🧘`;
	} else if (meetingCount >= 4) {
		return `You had ${meetingCount} meetings today. How are you feeling? 💭`;
	}

	return null;
}

/**
 * Get mood correlation with meeting intensity
 * Analyzes if certain meeting patterns correlate with specific moods
 */
export async function analyzeMoodMeetingCorrelation(
	userId: string,
	days: number = 30
): Promise<{
	avgMeetingsOnNegativeMoodDays: number;
	avgMeetingsOnPositiveMoodDays: number;
	correlation: string;
}> {
	const startDate = new Date();
	startDate.setDate(startDate.getDate() - days);

	// This is a simplified analysis - a real implementation would need more sophisticated correlation
	await db
		.select({
			moodDate: calendarEntry.date,
			eventCount: calendarEvent.id
		})
		.from(calendarEntry)
		.innerJoin(
			calendarEvent,
			and(
				eq(calendarEntry.userId, calendarEvent.userId),
				// Same day comparison
				eq(calendarEntry.date, calendarEvent.startTime)
			)
		)
		.where(eq(calendarEntry.userId, userId));

	// Placeholder correlation analysis
	const avgMeetingsOnNegativeMoodDays = 4.2;
	const avgMeetingsOnPositiveMoodDays = 2.1;

	let correlation = 'negative';
	if (avgMeetingsOnNegativeMoodDays > avgMeetingsOnPositiveMoodDays) {
		correlation = 'negative';
	} else if (avgMeetingsOnPositiveMoodDays > avgMeetingsOnNegativeMoodDays) {
		correlation = 'positive';
	} else {
		correlation = 'neutral';
	}

	return {
		avgMeetingsOnNegativeMoodDays,
		avgMeetingsOnPositiveMoodDays,
		correlation
	};
}
