// src/lib/server/db/schema.ts
import {
	boolean,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
	uniqueIndex
} from 'drizzle-orm/pg-core';

export const user = pgTable('users', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified')
		.$defaultFn(() => false)
		.notNull(),
	image: text('image'),
	timezone: text('timezone')
		.$defaultFn(() => 'UTC')
		.notNull(),
	isAdmin: boolean('is_admin')
		.$defaultFn(() => false)
		.notNull(),
	personalMode: boolean('personal_mode')
		.$defaultFn(() => false)
		.notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const session = pgTable('sessions', {
	id: uuid('id').defaultRandom().primaryKey(),
	expiresAt: timestamp('expires_at').notNull(),
	token: text('token').notNull().unique(),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' })
});

export const account = pgTable('accounts', {
	id: uuid('id').defaultRandom().primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: timestamp('access_token_expires_at'),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
	scope: text('scope'),
	password: text('password'),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull()
});

export const verification = pgTable('verifications', {
	id: uuid('id').defaultRandom().primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const emotion = pgTable('emotions', {
	id: uuid('id').defaultRandom().primaryKey(),
	teamId: uuid('team_id').references(() => team.id, { onDelete: 'cascade' }), // null for global/default emotions
	name: text('name').notNull(),
	emoji: text('emoji').notNull(),
	color: text('color').notNull(),
	valence: integer('valence')
		.$defaultFn(() => 0)
		.notNull(), // Score from negative to positive (default emotions use -5 to +5)
	description: text('description'), // Optional description to help users understand the emotion
	order: text('order')
		.$defaultFn(() => '0')
		.notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const calendarEntry = pgTable('calendar_entries', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	teamId: uuid('team_id').references(() => team.id, { onDelete: 'cascade' }), // null for personal entries
	emotionId: uuid('emotion_id')
		.notNull()
		.references(() => emotion.id, { onDelete: 'cascade' }),
	date: timestamp('date').notNull(),
	timeOfDay: text('time_of_day'), // 'morning', 'noon', 'evening' - for multiple moods per day
	comment: text('comment'),
	isPrivate: boolean('is_private')
		.$defaultFn(() => false)
		.notNull(),
	isAnonymous: boolean('is_anonymous').default(false).notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const team = pgTable('teams', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
	visibility: text('visibility')
		.$defaultFn(() => 'team')
		.notNull(), // 'public', 'team', 'private'
	allowMultipleMoodsPerDay: boolean('allow_multiple_moods_per_day')
		.$defaultFn(() => false)
		.notNull(),
	requireComment: boolean('require_comment')
		.$defaultFn(() => false)
		.notNull(),
	showWeekends: boolean('show_weekends')
		.$defaultFn(() => true)
		.notNull(),
	createdBy: uuid('created_by')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const teamMember = pgTable('team_members', {
	id: uuid('id').defaultRandom().primaryKey(),
	teamId: uuid('team_id')
		.notNull()
		.references(() => team.id, { onDelete: 'cascade' }),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	role: text('role')
		.$defaultFn(() => 'member')
		.notNull(), // 'admin', 'member'
	joinedAt: timestamp('joined_at').defaultNow().notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const settings = pgTable('settings', {
	id: uuid('id').defaultRandom().primaryKey(),
	key: text('key').notNull().unique(),
	value: text('value').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const userPreferences = pgTable('user_preferences', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' })
		.unique(),
	// Extensible JSONB settings object. Example structure:
	// { "theme": "dark", "defaultView": "week", "enableNotifications": true, "startPage": "/" }
	// New settings can be added without schema changes.
	settings: jsonb('settings')
		.$defaultFn(() => ({
			theme: 'system',
			defaultView: 'week',
			enableNotifications: true,
			startPage: '/'
		}))
		.notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const invitation = pgTable('invitations', {
	id: uuid('id').defaultRandom().primaryKey(),
	email: text('email').notNull(),
	token: text('token').notNull().unique(),
	type: text('type')
		.$defaultFn(() => 'team')
		.notNull(), // 'team' or 'general' (general = instance-wide invitation)
	teamId: uuid('team_id').references(() => team.id, { onDelete: 'cascade' }), // null for general invitations
	createdBy: uuid('created_by')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	acceptedBy: uuid('accepted_by').references(() => user.id, { onDelete: 'set null' }),
	expiresAt: timestamp('expires_at').notNull(),
	acceptedAt: timestamp('accepted_at'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Reward badges for gamification
export const achievement = pgTable('achievements', {
	id: uuid('id').defaultRandom().primaryKey(),
	slug: text('slug').notNull().unique(),
	name: text('name').notNull(),
	description: text('description'),
	category: text('category').notNull().default('activity'),
	requirement: integer('requirement'),
	rule: text('rule').notNull().default('COUNT'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const userAchievement = pgTable(
	'user_achievements',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: uuid('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		achievementId: uuid('achievement_id')
			.notNull()
			.references(() => achievement.id, { onDelete: 'cascade' }),
		earnedAt: timestamp('earned_at').defaultNow().notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => [uniqueIndex('uniq_user_badge').on(table.userId, table.achievementId)]
);

export const achievementProgress = pgTable('achievement_progress', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	achievementId: uuid('achievement_id')
		.notNull()
		.references(() => achievement.id, { onDelete: 'cascade' }),
	progress: integer('progress').notNull().default(0),
	lastUpdated: timestamp('last_updated').defaultNow().notNull()
});

// Push subscriptions for web push notifications
export const pushSubscription = pgTable('push_subscriptions', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	endpoint: text('endpoint').notNull(),
	auth: text('auth').notNull(), // Base64-encoded auth secret
	p256dh: text('p256dh').notNull(), // Base64-encoded P-256 public key
	userAgent: text('user_agent'),
	isActive: boolean('is_active')
		.$defaultFn(() => true)
		.notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Mood reminders for users
export const moodReminder = pgTable('mood_reminders', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	message: text('message').notNull(),
	// Time of day in HH:MM format (e.g., "09:00", "14:30")
	time: text('time').notNull(),
	// Days of week: 0-6 (0 = Sunday), comma-separated or all for daily
	daysOfWeek: text('days_of_week')
		.$defaultFn(() => '0,1,2,3,4,5,6')
		.notNull(),
	isActive: boolean('is_active')
		.$defaultFn(() => true)
		.notNull(),
	lastTriggered: timestamp('last_triggered'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Calendar integration tables
export const calendarAccount = pgTable('calendar_accounts', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	provider: text('provider').notNull(), // 'google', 'microsoft', etc.
	email: text('email').notNull(),
	calendarId: text('calendar_id'), // e.g., 'primary' for Google, resource ID for Outlook
	isEnabled: boolean('is_enabled')
		.$defaultFn(() => true)
		.notNull(),
	lastSyncedAt: timestamp('last_synced_at'),
	nextSyncAt: timestamp('next_sync_at'),
	syncToken: text('sync_token'), // Google Calendar incremental sync token
	metadata: jsonb('metadata')
		.$defaultFn(() => ({}))
		.notNull(), // Provider-specific data (timezone, display name, etc.)
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const calendarEvent = pgTable('calendar_events', {
	id: uuid('id').defaultRandom().primaryKey(),
	calendarAccountId: uuid('calendar_account_id')
		.notNull()
		.references(() => calendarAccount.id, { onDelete: 'cascade' }),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	externalEventId: text('external_event_id').notNull(), // e.g., Google event ID
	provider: text('provider').notNull(), // 'google', 'microsoft'
	title: text('title').notNull(),
	description: text('description'),
	startTime: timestamp('start_time').notNull(),
	endTime: timestamp('end_time').notNull(),
	duration: integer('duration'), // in minutes
	isAllDay: boolean('is_all_day')
		.$defaultFn(() => false)
		.notNull(),
	location: text('location'),
	attendeeCount: integer('attendee_count'),
	moodPromptSent: boolean('mood_prompt_sent')
		.$defaultFn(() => false)
		.notNull(),
	moodPromptSentAt: timestamp('mood_prompt_sent_at'),
	moodLogged: boolean('mood_logged')
		.$defaultFn(() => false)
		.notNull(),
	moodEntryId: uuid('mood_entry_id').references(() => calendarEntry.id, { onDelete: 'set null' }),
	externalMetadata: jsonb('external_metadata')
		.$defaultFn(() => ({}))
		.notNull(), // Full event data from provider
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const calendarSync = pgTable('calendar_syncs', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	calendarAccountId: uuid('calendar_account_id').references(() => calendarAccount.id, { onDelete: 'cascade' }),
	status: text('status')
		.$defaultFn(() => 'pending')
		.notNull(), // 'pending', 'in_progress', 'completed', 'failed'
	error: text('error'),
	eventsImported: integer('events_imported')
		.$defaultFn(() => 0)
		.notNull(),
	eventsUpdated: integer('events_updated')
		.$defaultFn(() => 0)
		.notNull(),
	eventsDeleted: integer('events_deleted')
		.$defaultFn(() => 0)
		.notNull(),
	startedAt: timestamp('started_at').defaultNow().notNull(),
	completedAt: timestamp('completed_at'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});
