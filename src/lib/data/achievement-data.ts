import type { Achievement } from '$lib/types';

export const ACHIEVEMENT_DATA: Omit<Achievement, 'id'>[] = [
	{
		slug: 'first-mood',
		name: 'First Mood Logged',
		description: 'Logged your first ever mood.',
		category: 'activity',
		rule: 'FIRST_MOOD'
	},
	{
		slug: 'mood-count-5',
		name: 'Getting Started',
		description: 'Logged 5 moods.',
		category: 'count',
		rule: 'COUNT',
		requirement: 5
	},
	{
		slug: 'mood-count-10',
		name: 'Mood Explorer',
		description: 'Logged 10 moods.',
		category: 'count',
		rule: 'COUNT',
		requirement: 10
	},
	{
		slug: 'mood-count-25',
		name: 'Committed Logger',
		description: 'Logged 25 moods.',
		category: 'count',
		rule: 'COUNT',
		requirement: 25
	},
	{
		slug: 'mood-count-50',
		name: 'Half Century',
		description: 'Logged 50 moods.',
		category: 'count',
		rule: 'COUNT',
		requirement: 50
	},
	{
		slug: 'mood-count-100',
		name: 'Centurion',
		description: 'Logged 100 moods.',
		category: 'count',
		rule: 'COUNT',
		requirement: 100
	},
	{
		slug: 'anon-5',
		name: 'Anonymous Angel',
		description: 'Logged 5 anonymous moods.',
		category: 'activity',
		rule: 'ANONYMOUS_COUNT',
		requirement: 5
	},
	{
		slug: 'anon-10',
		name: 'Incognito',
		description: 'Logged 10 anonymous moods.',
		category: 'activity',
		rule: 'ANONYMOUS_COUNT',
		requirement: 10
	},
	{
		slug: 'anon-25',
		name: 'Stealth Supporter',
		description: 'Logged 25 anonymous moods.',
		category: 'activity',
		rule: 'ANONYMOUS_COUNT',
		requirement: 25
	},
	{
		slug: 'streak-3',
		name: '3-Day Streak',
		description: 'Logged moods 3 days in a row.',
		category: 'streak',
		rule: 'STREAK',
		requirement: 3
	},
	{
		slug: 'streak-7',
		name: '7-Day Streak',
		description: 'Logged moods 7 days in a row.',
		category: 'streak',
		rule: 'STREAK',
		requirement: 7
	},
	{
		slug: 'streak-14',
		name: 'Fortnight Flow',
		description: 'Logged moods 14 days in a row.',
		category: 'streak',
		rule: 'STREAK',
		requirement: 14
	},
	{
		slug: 'streak-30',
		name: 'Month Momentum',
		description: 'Logged moods 30 days in a row.',
		category: 'streak',
		rule: 'STREAK',
		requirement: 30
	},
	{
		slug: 'streak-90',
		name: 'Seasoned Setter',
		description: 'Logged moods 90 days in a row.',
		category: 'streak',
		rule: 'STREAK',
		requirement: 90
	},
	{
		slug: 'weekend-warrior',
		name: 'Weekend Warrior',
		description: 'Logged moods on both Saturday and Sunday in the same weekend.',
		category: 'activity',
		rule: 'OTHER'
	},
	{
		slug: 'early-bird',
		name: 'Early Bird',
		description: 'Logged a mood before 08:00 local time.',
		category: 'other',
		rule: 'OTHER'
	},
	{
		slug: 'night-owl',
		name: 'Night Owl',
		description: 'Logged a mood after 23:00 local time.',
		category: 'other',
		rule: 'OTHER'
	},
	{
		slug: 'mood-variety-3',
		name: 'Taste Tester',
		description: 'Used 3 different emotions in your logs.',
		category: 'other',
		rule: 'OTHER',
		requirement: 3
	},
	{
		slug: 'mood-variety-6',
		name: 'Emotion Explorer',
		description: 'Used 6 different emotions in your logs.',
		category: 'other',
		rule: 'OTHER',
		requirement: 6
	},
	{
		slug: 'journal-1',
		name: 'First Reflection',
		description: 'Wrote your first comment alongside a mood entry.',
		category: 'activity',
		rule: 'OTHER'
	},
	{
		slug: 'journal-10',
		name: 'Reflective Regular',
		description: 'Wrote 10 comments alongside mood entries.',
		category: 'count',
		rule: 'COUNT',
		requirement: 10
	},
	{
		slug: 'monthly-check-in',
		name: 'Monthly Check-In',
		description: 'Logged at least once every week for 4 consecutive weeks.',
		category: 'streak',
		rule: 'OTHER',
		requirement: 4
	},
	{
		slug: 'mood-score-positive-10',
		name: 'On the Upswing',
		description: 'Maintain an average positive mood over 10 logged days.',
		category: 'other',
		rule: 'OTHER',
		requirement: 10
	},
	{
		slug: 'mood-score-improved-30',
		name: 'Improvement Trend',
		description: 'Show improvement in average mood across 30 days.',
		category: 'other',
		rule: 'OTHER',
		requirement: 30
	},
	{
		slug: 'consistent-mornings-7',
		name: 'Morning Ritual',
		description: 'Logged a mood before 09:00 for 7 days in a row.',
		category: 'streak',
		rule: 'OTHER',
		requirement: 7
	},
	{
		slug: 'year-in-review',
		name: 'Yearly Archivist',
		description: 'Logged at least one mood in 12 different months.',
		category: 'count',
		rule: 'OTHER',
		requirement: 12
	},
	{
		slug: 'team-first-mood-entry',
		name: 'Team Initiator',
		description: 'Logged the first mood for your team.',
		category: 'activity',
		rule: 'OTHER'
	},
	{
		slug: 'team-count-5',
		name: 'Team Builder',
		description: 'Logged 5 moods as part of a team.',
		category: 'activity',
		rule: 'COUNT',
		requirement: 5
	},
	{
		slug: 'team-count-20',
		name: 'Team Contributor',
		description: 'Logged 20 moods as part of a team.',
		category: 'activity',
		rule: 'COUNT',
		requirement: 20
	},
	{
		slug: 'team-count-50',
		name: 'Team Pillar',
		description: 'Logged 50 moods as part of a team.',
		category: 'activity',
		rule: 'COUNT',
		requirement: 50
	},
	{
		slug: 'team-commenter',
		name: 'Team Commenter',
		description: 'Wrote 10 comments on team mood entries.',
		category: 'activity',
		rule: 'COUNT',
		requirement: 10
	},
	{
		slug: 'team-streak-7',
		name: 'Team Streaker',
		description: 'Logged moods for 7 consecutive days as part of a team.',
		category: 'streak',
		rule: 'STREAK',
		requirement: 7
	},
	{
		slug: 'team-joined',
		name: 'Team Player',
		description: 'Joined a team.',
		category: 'activity',
		rule: 'OTHER'
	}
];
