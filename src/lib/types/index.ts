// ==================== USER TYPES ====================
export interface User {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	image?: string | null;
	timezone: string;
	isAdmin: boolean;
	personalMode: boolean;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * User settings stored as JSONB. Structure is flexible to support any future settings.
 * Current known settings:
 * - theme: 'light' | 'dark' | 'system' (default: 'system')
 * - defaultView: 'day' | 'week' | 'month' (default: 'week')
 * - startPage: string, path like '/', '/personal', '/teams', '/teams/<id>' (default: '/')
 * - enableNotifications: boolean (default: true)
 * - lastQuickMoodTargets: { personal: boolean, teamIds: string[] } - Last selected targets for quick mood entry
 */
export interface UserSettings {
	theme?: 'light' | 'dark' | 'system';
	defaultView?: 'day' | 'week' | 'month';
	startPage?: string;
	enableNotifications?: boolean;
	lastQuickMoodTargets?: {
		personal: boolean;
		teamIds: string[];
	};
	[key: string]: string | number | boolean | object | undefined;
}

export interface UserPreferences {
	id: string;
	userId: string;
	settings: UserSettings;
	createdAt: Date;
	updatedAt: Date;
}

export type Visibility = 'public' | 'team' | 'private';

// ==================== TEAM TYPES ====================
export interface Team {
	id: string;
	name: string;
	description?: string | null;
	visibility: Visibility;
	allowMultipleMoodsPerDay: boolean;
	requireComment: boolean;
	showWeekends: boolean;
	createdBy: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface TeamMember {
	id: string;
	teamId: string;
	userId: string;
	role: 'admin' | 'member';
	joinedAt: Date;
	createdAt: Date;
	updatedAt: Date;
}

export interface TeamWithMembers extends Team {
	members: (TeamMember & { user: User })[];
	memberCount: number;
}

export interface TeamMemberWithUser extends TeamMember {
	user: User;
}

// ==================== EMOTION TYPES ====================
export interface Emotion {
	id: string;
	teamId?: string | null;
	name: string;
	emoji: string;
	color: string;
	valence: number; // Score representing positive/negative sentiment (default emotions use -5 to +5)
	description?: string | null; // Optional description to explain the emotion's meaning
	order: string;
	createdAt: Date;
	updatedAt: Date;
}

// ==================== MOOD ENTRY TYPES ====================
export interface MoodEntry {
	id: string;
	userId: string;
	teamId?: string | null;
	emotionId: string;
	date: Date;
	timeOfDay?: 'morning' | 'noon' | 'evening' | null;
	comment?: string | null;
	isPrivate: boolean;
	createdAt: Date;
	updatedAt: Date;
}

// Serialized version (when coming from API/SvelteKit load functions)
export interface MoodEntrySerialized {
	id: string;
	userId: string;
	teamId?: string | null;
	emotionId: string;
	date: string; // ISO string
	timeOfDay?: 'morning' | 'noon' | 'evening' | null;
	comment?: string | null;
	isPrivate: boolean;
	createdAt: string; // ISO string
	updatedAt: string; // ISO string
}

export interface MoodEntryWithDetails extends MoodEntry {
	emotion: Emotion;
	user: User;
}

export interface MoodEntryWithDetailsSerialized {
	id: string;
	userId: string;
	teamId?: string | null;
	emotionId: string;
	date: string; // ISO string
	timeOfDay?: 'morning' | 'noon' | 'evening' | null;
	comment?: string | null;
	isPrivate: boolean;
	createdAt: string; // ISO string
	updatedAt: string; // ISO string
	emotion: Emotion;
	user: User;
}

export interface MoodEntryCreate {
	userId: string;
	teamId?: string | null;
	emotionId: string;
	date: Date;
	timeOfDay?: 'morning' | 'noon' | 'evening' | null;
	comment?: string;
	isPrivate?: boolean;
}

export interface MoodEntryUpdate {
	emotionId?: string;
	comment?: string;
	isPrivate?: boolean;
	timeOfDay?: 'morning' | 'noon' | 'evening' | null;
}

// ==================== CALENDAR VIEW TYPES ====================
export interface CalendarDay {
	date: Date;
	isToday: boolean;
	isWeekend: boolean;
	isCurrentMonth: boolean;
}

export interface CalendarEntry {
	id: string;
	userId: string;
	emotionId: string;
	date: Date;
	comment?: string;
	emotion?: Emotion;
	createdAt: Date;
	updatedAt: Date;
}

export interface TeamMemberRow {
	id: string;
	name: string;
	entries: CalendarEntry[];
}

export interface WeekData {
	weekDays: Date[];
	teamMembers: TeamMemberRow[];
}

export interface MonthData {
	weeks: CalendarDay[][];
	entries: MoodEntryWithDetails[];
}

// ==================== ANALYTICS TYPES ====================
export interface MoodStatistics {
	totalEntries: number;
	averageMoodScore: number;
	moodDistribution: {
		emotionId: string;
		emotionName: string;
		count: number;
		percentage: number;
	}[];
	trendData: {
		date: Date;
		averageScore: number;
		entryCount: number;
	}[];
}

export interface TeamStatistics {
	teamId: string;
	teamName: string;
	memberCount: number;
	totalMoodEntries: number;
	averageMoodScore: number;
	activeMembersToday: number;
	activeMembersThisWeek: number;
}

// ==================== SETTINGS TYPES ====================
export interface Settings {
	id: string;
	key: string;
	value: string;
	createdAt: Date;
	updatedAt: Date;
}

// ==================== FORM/ACTION TYPES ====================
export interface TeamCreateInput {
	name: string;
	description?: string;
	visibility?: 'public' | 'team' | 'private';
	allowMultipleMoodsPerDay?: boolean;
	requireComment?: boolean;
	showWeekends?: boolean;
}

export interface TeamUpdateInput {
	name?: string;
	description?: string;
	visibility?: 'public' | 'team' | 'private';
	allowMultipleMoodsPerDay?: boolean;
	requireComment?: boolean;
	showWeekends?: boolean;
}

export interface UserProfileUpdate {
	name?: string;
	image?: string;
	timezone?: string;
}

export interface EmotionCreateInput {
	teamId?: string | null;
	name: string;
	emoji: string;
	color: string;
	valence?: number; // Defaults to 0 if not provided
	description?: string;
	order?: string;
}

export interface EmotionUpdateInput {
	name?: string;
	emoji?: string;
	color?: string;
	valence?: number;
	description?: string;
	order?: string;
}

// ==================== PUSH NOTIFICATION TYPES ====================
export interface PushSubscription {
	id: string;
	userId: string;
	endpoint: string;
	auth: string;
	p256dh: string;
	userAgent?: string | null;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface PushSubscriptionInput {
	endpoint: string;
	keys: {
		auth: string;
		p256dh: string;
	};
}

export interface VapidKeys {
	publicKey: string;
	privateKey: string;
}

// ==================== MOOD REMINDER TYPES ====================
export interface MoodReminder {
	id: string;
	userId: string;
	title: string;
	message: string;
	time: string; // HH:MM format
	daysOfWeek: string; // Comma-separated days (0-6) or 'all'
	isActive: boolean;
	lastTriggered?: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface MoodReminderCreate {
	title: string;
	message: string;
	time: string; // HH:MM in user's local time
	daysOfWeek?: string;
}

export interface MoodReminderUpdate {
	title?: string;
	message?: string;
	time?: string; // HH:MM in user's local time
	daysOfWeek?: string;
	isActive?: boolean;
}

export interface MoodReminderWithDetails extends MoodReminder {
	nextTrigger?: Date; // Client-side calculated
}

// ==================== API RESPONSE TYPES ====================
export interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}

export interface PaginatedResponse<T> {
	data: T[];
	total: number;
	page: number;
	pageSize: number;
	hasMore: boolean;
}
