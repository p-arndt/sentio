/**
 * Database initialization script
 * Run this after applying migrations to set up default data
 * 
 * Usage: npx tsx scripts/init-db.ts
 */

import { EmotionService } from '../src/lib/server/services/emotion.service';

async function initializeDatabase() {
	console.log('🚀 Initializing database...\n');

	try {
		// Initialize default emotions
		console.log('📊 Creating default emotions...');
		await EmotionService.initializeDefaultEmotions();
		console.log('✅ Default emotions created!\n');

		const emotions = await EmotionService.getGlobalEmotions();
		console.log('Created emotions:');
		emotions.forEach((emotion) => {
			console.log(`  ${emotion.emoji} ${emotion.name} (${emotion.color})`);
		});

		console.log('\n✨ Database initialization complete!');
		process.exit(0);
	} catch (error) {
		console.error('❌ Error initializing database:', error);
		process.exit(1);
	}
}

initializeDatabase();
