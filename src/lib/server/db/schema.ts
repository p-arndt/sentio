// src/lib/server/db/schema.ts
import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const user = pgTable('users', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified')
		.$defaultFn(() => false)
		.notNull(),
	image: text('image'),
	isAdmin: boolean('is_admin')
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
	name: text('name').notNull(),
	emoji: text('emoji').notNull(),
	color: text('color').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const calendarEntry = pgTable('calendar_entries', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	emotionId: uuid('emotion_id')
		.notNull()
		.references(() => emotion.id, { onDelete: 'cascade' }),
	date: timestamp('date').notNull(),
	comment: text('comment'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const team = pgTable('teams', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
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
