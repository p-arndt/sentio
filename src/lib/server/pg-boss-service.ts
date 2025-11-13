/**
 * PgBoss service - PostgreSQL-backed job queue
 * Simple wrapper around PgBoss initialization
 */

import { DATABASE_URL } from '$lib/server/db';
import { PgBoss } from 'pg-boss';

let boss: PgBoss | null = null;

/**
 * Get the PgBoss instance (singleton)
 */
export async function getPgBoss(): Promise<PgBoss> {
	if (boss) {
		return boss;
	}

	boss = new PgBoss(DATABASE_URL);
	await boss.start();

	return boss;
}
