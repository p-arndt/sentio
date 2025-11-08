import { defineConfig } from 'drizzle-kit';
import { env } from 'process';

const DATABASE_URL = `postgres://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}@${env.POSTGRES_HOST}:5432/${env.POSTGRES_DB}`;
export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	dialect: 'postgresql',
	dbCredentials: { url: DATABASE_URL },
	verbose: true,
	strict: true
});
