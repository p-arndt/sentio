import { db } from '$lib/server/db';
import { calendarEntry, emotion, user, invitation, team, teamMember } from '$lib/server/db/schema';
import type { Achievement } from '$lib/types';
import { and, count, gte, eq, desc } from 'drizzle-orm';

type CachedStats = {
	total?: number;
anonTotal?: number;
};

export class AchievementChecker {
    // Count total calendar entries for user
    static async getTotalEntries(userId: string): Promise<number> {
        const [res] = await db.select({ total: count() }).from(calendarEntry).where(eq(calendarEntry.userId, userId)).limit(1);
        return Number(res?.total ?? 0);
    }

    // Count anonymous entries
    static async getAnonymousEntries(userId: string): Promise<number> {
        const [res] = await db
            .select({ total: count() })
            .from(calendarEntry)
            .where(and(eq(calendarEntry.userId, userId), eq(calendarEntry.isAnonymous, true)))
            .limit(1);
        return Number(res?.total ?? 0);
    }

    // Compute current streak (consecutive days up to today with at least one entry)
    static async getCurrentStreak(userId: string, lookbackMax = 30): Promise<number> {
        const cursor = new Date();
        const lookbackDays = Math.max(lookbackMax, 30);
        const startDate = new Date(cursor);
        startDate.setUTCDate(cursor.getUTCDate() - lookbackDays);

        const entries = await db
            .select({ date: calendarEntry.date })
            .from(calendarEntry)
            .where(and(eq(calendarEntry.userId, userId), gte(calendarEntry.date, startDate)));

        const datesWithEntries = new Set(entries.map((e: { date: Date }) => new Date(e.date).toISOString().slice(0, 10)));

        let streak = 0;
        for (let i = 0; i < lookbackDays; i++) {
            const check = new Date(cursor);
            check.setUTCDate(cursor.getUTCDate() - i);
            const key = check.toISOString().slice(0, 10);
            if (datesWithEntries.has(key)) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    }

    // Central matcher: returns true if the user meets the achievement criteria.
    // Accepts optional precomputed stats to avoid repeated DB calls.
    static async matches(
        badge: Achievement,
        userId: string,
        stats?: CachedStats
    ): Promise<boolean> {
        const rule = (badge.rule ?? 'COUNT') as string;
        const req = badge.requirement ?? null;

        // Use cached totals when provided
        const total = stats?.total ?? (await this.getTotalEntries(userId));
        const anonTotal = stats?.anonTotal ?? (await this.getAnonymousEntries(userId));

        if (rule === 'FIRST_MOOD') {
            return total >= 1;
        }

        if (rule === 'COUNT') {
            if (!req) return false;
            return total >= req;
        }

        if (rule === 'ANONYMOUS_COUNT') {
            if (!req) return false;
            return anonTotal >= req;
        }

        if (rule === 'STREAK') {
            if (!req) return false;
            const streak = await this.getCurrentStreak(userId, Math.max(30, req));
            return streak >= req;
        }

        // Implement known OTHER rules by slug
        const slug = badge.slug;

        if (slug === 'weekend-warrior') {
            return this.checkWeekendWarrior(userId);
        }

        if (slug === 'early-bird') {
            return this.checkEarlyBird(userId);
        }

        if (slug === 'night-owl') {
            return this.checkNightOwl(userId);
        }

        if (slug?.startsWith('mood-variety')) {
            if (!req) return false;
            return this.checkMoodVariety(userId, req);
        }

        if (slug?.startsWith('tags-used')) {
            // Tags are not modeled in the current schema; skip.
            return false;
        }

        if (slug?.startsWith('journal')) {
            // Some journal achievements (e.g. `journal-1`) omit `requirement`.
            // Treat missing requirement as 1 so a single journal entry grants the badge.
            const r = req ?? 1;
            return this.checkJournalCount(userId, r);
        }

        if (slug === 'mood-score-positive-10' || slug?.startsWith('mood-score-positive')) {
            if (!req) return false;
            return this.checkMoodScorePositive(userId, req);
        }

        if (slug === 'mood-score-improved-30' || slug?.startsWith('mood-score-improved')) {
            if (!req) return false;
            return this.checkMoodScoreImproved(userId, req);
        }

        if (slug === 'monthly-check-in') {
            // requirement indicates number of consecutive weeks
            const weeksReq = req ?? 4;
            return this.checkMonthlyCheckIn(userId, weeksReq);
        }

        if (slug === 'consistent-mornings-7') {
            const daysReq = req ?? 7;
            return this.checkConsistentMornings(userId, daysReq, 9);
        }

        // Team-related achievements
        if (slug === 'team-created') {
            return this.checkTeamCreated(userId);
        }

        if (slug === 'team-joined') {
            return this.checkTeamJoined(userId);
        }

        if (slug?.startsWith('team-invite')) {
            if (!req) return false;
            return this.checkTeamInvites(userId, req);
        }

        if (slug?.startsWith('team-moods')) {
            if (!req) return false;
            return this.checkTeamMoods(userId, req);
        }

        if (slug?.startsWith('team-streak')) {
            if (!req) return false;
            return this.checkTeamStreak(userId, req);
        }

        if (slug?.startsWith('team-collab')) {
            if (!req) return false;
            return this.checkTeamCollab(userId, req);
        }

        if (slug?.startsWith('invite-friend')) {
            if (!req) return false;
            return this.checkInviteFriends(userId, req);
        }

        // Other slugs not covered here remain false by default.
        return false;
    }

    // Helper: fetch user's timezone
    static async getUserTimezone(userId: string): Promise<string> {
        const [row] = await db.select({ tz: user.timezone }).from(user).where(eq(user.id, userId)).limit(1);
        return row?.tz ?? 'UTC';
    }

    static async checkWeekendWarrior(userId: string): Promise<boolean> {
        // look back 90 days and find a weekend with both Saturday and Sunday entries
        const cursor = new Date();
        const start = new Date(cursor);
        start.setUTCDate(cursor.getUTCDate() - 90);

        const entries = await db
            .select({ date: calendarEntry.date })
            .from(calendarEntry)
            .where(and(eq(calendarEntry.userId, userId), gte(calendarEntry.date, start)));

        const weeks = new Map<string, Set<number>>();
        for (const e of entries) {
            const d = new Date(e.date);
            // weekKey as year-weekNumber
            const wk = this.getISOWeekKey(d);
            const dow = d.getUTCDay(); // 0 = Sunday, 6 = Saturday
            const set = weeks.get(wk) ?? new Set<number>();
            set.add(dow);
            weeks.set(wk, set);
        }

        for (const s of weeks.values()) {
            if (s.has(6) && s.has(0)) return true;
        }

        return false;
    }

    static getISOWeekKey(d: Date): string {
        const copy = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
        // Thursday in current week decides the year.
        copy.setUTCDate(copy.getUTCDate() + 4 - (copy.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(copy.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((copy.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        return `${copy.getUTCFullYear()}-${weekNo}`;
    }

    static async checkEarlyBird(userId: string): Promise<boolean> {
        // any entry before 08:00 in user's timezone
        const tz = await this.getUserTimezone(userId);
        const start = new Date();
        start.setUTCDate(start.getUTCDate() - 365);
        const entries = await db
            .select({ date: calendarEntry.date })
            .from(calendarEntry)
            .where(and(eq(calendarEntry.userId, userId), gte(calendarEntry.date, start)));

        for (const e of entries) {
            const d = new Date(e.date);
            const hour = this.getHourInTimeZone(d, tz);
            if (hour < 8) return true;
        }
        return false;
    }

    static async checkNightOwl(userId: string): Promise<boolean> {
        const tz = await this.getUserTimezone(userId);
        const start = new Date();
        start.setUTCDate(start.getUTCDate() - 365);
        const entries = await db
            .select({ date: calendarEntry.date })
            .from(calendarEntry)
            .where(and(eq(calendarEntry.userId, userId), gte(calendarEntry.date, start)));

        for (const e of entries) {
            const d = new Date(e.date);
            const hour = this.getHourInTimeZone(d, tz);
            if (hour >= 23) return true;
        }
        return false;
    }

    static getHourInTimeZone(d: Date, tz: string): number {
        try {
            const parts = new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: tz }).formatToParts(d);
            const hourPart = parts.find(p => p.type === 'hour');
            return hourPart ? Number(hourPart.value) : d.getUTCHours();
        } catch {
            return d.getUTCHours();
        }
    }

    static async checkMoodVariety(userId: string, requirement: number): Promise<boolean> {
        const rows: Array<{ emotionId: string | null }> = await db
            .select({ emotionId: calendarEntry.emotionId })
            .from(calendarEntry)
            .where(eq(calendarEntry.userId, userId));
        const set = new Set(rows.map((r) => String(r.emotionId)));
        return set.size >= requirement;
    }

    static async checkJournalCount(userId: string, requirement: number): Promise<boolean> {
        const rowsCount: Array<{ total: number | null }> = await db
            .select({ total: count() })
            .from(calendarEntry)
            .where(and(eq(calendarEntry.userId, userId), gte(calendarEntry.comment, '')))
            .limit(1);
        // Note: using gte on text is a rough check for non-null/empty; fallback to fetching and filtering if DB doesn't support it.
        const total = Number(rowsCount?.[0]?.total ?? 0);
        if (total >= requirement) return true;

        // Fallback: fetch entries and count non-empty comments
        const rows2: Array<{ comment: string | null }> = await db
            .select({ comment: calendarEntry.comment })
            .from(calendarEntry)
            .where(eq(calendarEntry.userId, userId));
        const cnt = rows2.filter((r) => r.comment && String(r.comment).trim().length > 0).length;
        return cnt >= requirement;
    }

    static async checkMoodScorePositive(userId: string, requirement: number): Promise<boolean> {
        // average valence over last `requirement` entries > 0
        const rows: Array<{ valence: number | null }> = await db
            .select({ valence: emotion.valence })
            .from(calendarEntry)
            .innerJoin(emotion, eq(calendarEntry.emotionId, emotion.id))
            .where(eq(calendarEntry.userId, userId))
            .orderBy(desc(calendarEntry.date))
            .limit(requirement);

        if (!rows || rows.length < requirement) return false;
        const sum = rows.reduce((s: number, r) => s + Number(r.valence ?? 0), 0);
        const avg = sum / rows.length;
        return avg > 0;
    }

    static async checkMoodScoreImproved(userId: string, requirement: number): Promise<boolean> {
        // Compare older half vs newer half across 2*requirement entries
        const totalNeeded = requirement * 2;
        const rows: Array<{ valence: number | null }> = await db
            .select({ valence: emotion.valence })
            .from(calendarEntry)
            .innerJoin(emotion, eq(calendarEntry.emotionId, emotion.id))
            .where(eq(calendarEntry.userId, userId))
            .orderBy(desc(calendarEntry.date))
            .limit(totalNeeded);

        if (!rows || rows.length < totalNeeded) return false;
        const newer = rows.slice(0, requirement).map((r) => Number(r.valence ?? 0));
        const older = rows.slice(requirement, totalNeeded).map((r) => Number(r.valence ?? 0));
        const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;
        return avg(newer) > avg(older);
    }

    static async checkMonthlyCheckIn(userId: string, weeksRequired: number): Promise<boolean> {
        // Build week buckets for last 12 weeks and check for `weeksRequired` consecutive weeks with at least one entry
        const cursor = new Date();
        const start = new Date(cursor);
        start.setUTCDate(cursor.getUTCDate() - 84); // ~12 weeks

        const entries = await db
            .select({ date: calendarEntry.date })
            .from(calendarEntry)
            .where(and(eq(calendarEntry.userId, userId), gte(calendarEntry.date, start)));

        const weeks = new Map<string, boolean>();
        for (const e of entries) {
            const wk = this.getISOWeekKey(new Date(e.date));
            weeks.set(wk, true);
        }

        // Build ordered list of recent week keys
        const recentWeeks: string[] = [];
        for (let i = 0; i < 12; i++) {
            const d = new Date(cursor);
            d.setUTCDate(cursor.getUTCDate() - i * 7);
            recentWeeks.push(this.getISOWeekKey(d));
        }

        let consec = 0;
        for (const wk of recentWeeks) {
            if (weeks.get(wk)) {
                consec++;
                if (consec >= weeksRequired) return true;
            } else {
                consec = 0;
            }
        }
        return false;
    }

    static async checkConsistentMornings(userId: string, daysRequired: number, beforeHour = 9): Promise<boolean> {
        const cursor = new Date();
        const lookback = Math.max(daysRequired, 30);
        const start = new Date(cursor);
        start.setUTCDate(cursor.getUTCDate() - lookback);

        const tz = await this.getUserTimezone(userId);

        const entries: Array<{ date: Date }> = await db
            .select({ date: calendarEntry.date })
            .from(calendarEntry)
            .where(and(eq(calendarEntry.userId, userId), gte(calendarEntry.date, start)));

        const datesWithEarly = new Set(entries.map((e) => {
            const d = new Date(e.date);
            const hour = this.getHourInTimeZone(d, tz);
            return hour < beforeHour ? d.toISOString().slice(0,10) : null;
        }).filter(Boolean));

        let streak = 0;
        for (let i = 0; i < lookback; i++) {
            const d = new Date(cursor);
            d.setUTCDate(cursor.getUTCDate() - i);
            const key = d.toISOString().slice(0,10);
            if (datesWithEarly.has(key)) streak++; else break;
        }

        return streak >= daysRequired;
    }

    static async checkInviteFriends(userId: string, requirement: number): Promise<boolean> {
        const rows = await db
            .select({ total: count() })
            .from(invitation)
            .where(and(eq(invitation.createdBy, userId), gte(invitation.acceptedAt, new Date(0))))
            .limit(1);
        const total = Number(rows?.[0]?.total ?? 0);
        return total >= requirement;
    }

    // --- Team helpers ---
    static async getUserTeamIds(userId: string): Promise<string[]> {
        const rows: Array<{ teamId: string }> = await db
            .select({ teamId: teamMember.teamId })
            .from(teamMember)
            .where(eq(teamMember.userId, userId));
        return rows.map(r => String(r.teamId));
    }

    static async checkTeamCreated(userId: string): Promise<boolean> {
        const [row] = await db.select({ total: count() }).from(team).where(eq(team.createdBy, userId)).limit(1);
        return Number(row?.total ?? 0) > 0;
    }

    static async checkTeamJoined(userId: string): Promise<boolean> {
        const [row] = await db.select({ total: count() }).from(teamMember).where(eq(teamMember.userId, userId)).limit(1);
        return Number(row?.total ?? 0) > 0;
    }

    static async checkTeamInvites(userId: string, requirement: number): Promise<boolean> {
        const rows = await db
            .select({ total: count() })
            .from(invitation)
            .where(and(eq(invitation.createdBy, userId), eq(invitation.type, 'team'), gte(invitation.acceptedAt, new Date(0))))
            .limit(1);
        const total = Number(rows?.[0]?.total ?? 0);
        return total >= requirement;
    }

    static async checkTeamMoods(userId: string, requirement: number): Promise<boolean> {
        // Count calendar entries for teams the user is a member of by joining
        const rows = await db
            .select({ total: count() })
            .from(calendarEntry)
            .innerJoin(teamMember, eq(calendarEntry.teamId, teamMember.teamId))
            .where(eq(teamMember.userId, userId))
            .limit(1);
        const total = Number(rows?.[0]?.total ?? 0);
        return total >= requirement;
    }

    static async checkTeamStreak(userId: string, requirement: number): Promise<boolean> {
        // For each team the user belongs to, check if that team has a streak
        const teamIds = await this.getUserTeamIds(userId);
        if (!teamIds || teamIds.length === 0) return false;

        const lookback = Math.max(30, requirement);
        const cursor = new Date();
        const start = new Date(cursor);
        start.setUTCDate(cursor.getUTCDate() - lookback);

        for (const tId of teamIds) {
            const entries = await db
                .select({ date: calendarEntry.date })
                .from(calendarEntry)
                .where(and(eq(calendarEntry.teamId, tId), gte(calendarEntry.date, start)));

            const datesWithEntries = new Set(entries.map((e: { date: Date }) => new Date(e.date).toISOString().slice(0, 10)));
            let streak = 0;
            for (let i = 0; i < lookback; i++) {
                const check = new Date(cursor);
                check.setUTCDate(cursor.getUTCDate() - i);
                const key = check.toISOString().slice(0, 10);
                if (datesWithEntries.has(key)) {
                    streak++;
                } else {
                    break;
                }
            }
            if (streak >= requirement) return true;
        }
        return false;
    }

    static async checkTeamCollab(userId: string, requirement: number): Promise<boolean> {
        const teamIds = await this.getUserTeamIds(userId);
        if (!teamIds || teamIds.length === 0) return false;

        // For each team, count distinct users who logged entries for that team
        for (const tId of teamIds) {
            const rows: Array<{ userId: string | null }> = await db
                .select({ userId: calendarEntry.userId })
                .from(calendarEntry)
                .where(eq(calendarEntry.teamId, tId));
            const set = new Set(rows.map(r => String(r.userId)));
            if (set.size >= requirement) return true;
        }
        return false;
    }
}

export default AchievementChecker;
