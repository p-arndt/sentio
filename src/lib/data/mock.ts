import type { TeamMember, CalendarEntry, WeekData } from '$lib/types';
import { DEFAULT_EMOTIONS } from './emotions';
import { getWeekDays } from '$lib/utils/date';

// Mock team members
const TEAM_MEMBERS = [
	{ id: '1', name: 'Alex' },
	{ id: '2', name: 'Sam' },
	{ id: '3', name: 'Aldric' },
	{ id: '4', name: 'Sarah' },
	{ id: '5', name: 'Peter' },
	{ id: '6', name: 'Moussa' },
	{ id: '7', name: 'Sana' },
	{ id: '8', name: 'Arthur' },
	{ id: '9', name: 'Harry' },
];

/**
 * Generate mock calendar entries for a team member
 */
function generateMockEntries(memberId: string, weekDays: Date[]): CalendarEntry[] {
	const entries: CalendarEntry[] = [];
	
	weekDays.forEach((date, dayIndex) => {
		// Randomly decide if this member has an entry for this day (80% chance)
		if (Math.random() > 0.2) {
			const randomEmotion = DEFAULT_EMOTIONS[Math.floor(Math.random() * DEFAULT_EMOTIONS.length)];
			const hasComment = Math.random() > 0.7; // 30% chance of comment
			
			entries.push({
				id: `entry-${memberId}-${dayIndex}`,
				userId: memberId,
				emotionId: randomEmotion.id,
				date: new Date(date),
				comment: hasComment ? getRandomComment() : undefined,
				emotion: randomEmotion,
				createdAt: new Date(),
				updatedAt: new Date()
			});
		}
	});
	
	return entries;
}

/**
 * Get a random comment for demo purposes
 */
function getRandomComment(): string {
	const comments = [
		"Great team collaboration today!",
		"Feeling productive and motivated",
		"Had some challenges but overcame them",
		"Really enjoyed the morning standup",
		"Looking forward to the weekend",
		"Code review went well",
		"New feature deployment was smooth",
		"Learning lots from the team",
		"Bit tired but happy with progress",
		"Really clicking with the new framework"
	];
	
	return comments[Math.floor(Math.random() * comments.length)];
}

/**
 * Generate mock team data for a specific week
 */
export function generateMockWeekData(startDate: Date = new Date()): WeekData {
	const weekDays = getWeekDays(startDate);
	
	const teamMembers: TeamMember[] = TEAM_MEMBERS.map(member => ({
		...member,
		entries: generateMockEntries(member.id, weekDays)
	}));
	
	return {
		weekDays,
		teamMembers
	};
}