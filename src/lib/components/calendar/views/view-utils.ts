import type { MoodEntryWithDetails, TeamMemberWithUser } from '$lib/types';
import { isAnonymousUser, toDateString } from '$lib/utils';

export function sortTeamMembers(currentUserId: string | undefined, members: TeamMemberWithUser[]) {
  const sorted = [...members];
  sorted.sort((a, b) => {
    if (currentUserId) {
      if (a.userId === currentUserId) return -1;
      if (b.userId === currentUserId) return 1;
    }
    const aAnon = isAnonymousUser(a.userId);
    const bAnon = isAnonymousUser(b.userId);
    if (aAnon && !bAnon) return 1;
    if (!aAnon && bAnon) return -1;
    return a.user.name.localeCompare(b.user.name);
  });
  return sorted;
}

export function filterTeamMembers(
  currentUserId: string | undefined,
  members: TeamMemberWithUser[],
  moods: MoodEntryWithDetails[],
  displayDays: Date[]
) {
  const daySet = new Set(displayDays.map((d) => toDateString(d)));
  const sorted = sortTeamMembers(currentUserId, members);
  return sorted.filter(
    (m) => m.userId === currentUserId || moods.some((e) => e.userId === m.userId && daySet.has(toDateString(e.date)))
  );
}

export function getMoodsForMember(
  entries: MoodEntryWithDetails[],
  userId: string,
  date: Date | string
) {
  const dateStr = typeof date === 'string' ? date : toDateString(date);
  return entries.filter((e) => e.userId === userId && toDateString(e.date) === dateStr);
}

export default {
  sortTeamMembers,
  filterTeamMembers,
  getMoodsForMember
};
