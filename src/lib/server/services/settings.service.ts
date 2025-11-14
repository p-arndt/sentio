import { db } from '$lib/server/db';
import { calendarAccount, moodReminder, pushSubscription } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export class SettingsService {
    /**
     * Get mood reminders for a user
     */
    static async getMoodReminders(userId: string) {
        return await db
            .select()
            .from(moodReminder)
            .where(eq(moodReminder.userId, userId))
            .orderBy(moodReminder.time);
    }

    /**
     * Get calendar accounts for a user
     */
    static async getCalendarAccounts(userId: string) {
        return await db.select().from(calendarAccount).where(eq(calendarAccount.userId, userId));
    }

    /**
     * Get the active push subscription (first) for a user or null
     */
    static async getActivePushSubscription(userId: string) {
        const result = await db
            .select()
            .from(pushSubscription)
            .where(and(eq(pushSubscription.userId, userId), eq(pushSubscription.isActive, true)))
            .limit(1);

        return result[0] || null;
    }
}

export default SettingsService;
