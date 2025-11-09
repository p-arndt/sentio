// src/lib/server/db/schema.ts
import { boolean, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

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
	theme: text('theme')
		.$defaultFn(() => 'system')
		.notNull(), // 'light', 'dark', 'system'
	defaultView: text('default_view')
		.$defaultFn(() => 'week')
		.notNull(), // 'day', 'week', 'month'
	enableNotifications: boolean('enable_notifications')
		.$defaultFn(() => true)
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
