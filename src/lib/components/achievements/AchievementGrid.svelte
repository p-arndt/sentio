<script lang="ts">
	import AchievementBadge from '$lib/components/achievements/AchievementBadge.svelte';
	import type { Achievement, UserAchievement } from '$lib/types';

	type Props = {
		achievements: Achievement[];
		userAchievements?: UserAchievement[];
	};

	let { achievements, userAchievements = [] }: Props = $props();

	// Derived: set of unlocked achievement slugs for fast lookup
	let unlockedSlugs = $derived.by(() =>
		new Set(userAchievements.map((ua) => ua.achievement?.slug).filter((s): s is string => !!s))
	);

	// Derived: map from achievement slug -> earnedAt timestamp (if any)
	let earnedAtBySlug = $derived.by(() => {
		const m = new Map<string, string | undefined>();
		for (const ua of userAchievements) {
			const slug = ua.achievement?.slug;
			if (slug) m.set(slug, ua.earnedAt.toString());
		}
		return m;
	});

	// Helper: get a numeric value representing an achievement's requirement/weight
	const getRequirementValue = (it: Achievement) => {
		const anyIt = it as any;
		if (typeof anyIt.requirement === 'number') return anyIt.requirement;
		if (typeof anyIt.requirements === 'number') return anyIt.requirements;
		if (Array.isArray(anyIt.requirements)) return anyIt.requirements.length;
		if (typeof anyIt.threshold === 'number') return anyIt.threshold;
		if (typeof anyIt.points === 'number') return anyIt.points;
		return 0;
	};

	// Helper: compare two achievements for ordering
	const compareAchievements = (a: Achievement, b: Achievement) => {
		const aUnlocked = unlockedSlugs.has(a.slug);
		const bUnlocked = unlockedSlugs.has(b.slug);
		if (aUnlocked !== bUnlocked) return aUnlocked ? -1 : 1;

		const reqA = getRequirementValue(a);
		const reqB = getRequirementValue(b);
		if (reqA !== reqB) return reqA - reqB;

		return a.name.localeCompare(b.name);
	};

	// Helper: group achievements by category
	const groupByCategory = (items: Achievement[]) => {
		const groups = new Map<string, Achievement[]>();
		for (const it of items) {
			const cat = (it as any).category ?? 'other';
			const arr = groups.get(cat) ?? [];
			arr.push(it);
			groups.set(cat, arr);
		}
		return groups;
	};

	const CATEGORY_ORDER = ['activity', 'streak', 'count', 'other'];

	let groupedAchievements = $derived.by(() => {
		const groups = groupByCategory(achievements);

		const result = Array.from(groups.entries()).map(([category, items]) => ({
			category,
			items: items.sort(compareAchievements)
		}));

		result.sort((a, b) => {
			const ai = CATEGORY_ORDER.indexOf(a.category);
			const bi = CATEGORY_ORDER.indexOf(b.category);
			if (ai === -1 && bi === -1) return a.category.localeCompare(b.category);
			if (ai === -1) return 1;
			if (bi === -1) return -1;
			return ai - bi;
		});

		return result;
	});

	const CATEGORY_LABELS: Record<string, string> = {
		activity: 'Activity',
		streak: 'Streak',
		count: 'Count',
		other: 'Other'
	};
</script>

{#each groupedAchievements as group}
	<section class="mb-6">
		<div class="mb-2 flex items-center justify-between">
			<h3 class="text-sm font-semibold">{CATEGORY_LABELS[group.category] ?? group.category}</h3>
			<span class="text-xs text-muted-foreground"
				>{group.items.filter((i) => userAchievements.some((ua) => ua.achievement?.slug === i.slug))
					.length}/{group.items.length}</span
			>
		</div>

		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each group.items as a}
				<AchievementBadge
					achievement={a}
					unlocked={userAchievements.some((ua) => ua.achievement?.slug === a.slug)}
					earnedAt={userAchievements.find((ua) => ua.achievement?.slug === a.slug)?.earnedAt}
				/>
			{/each}
		</div>
	</section>
{/each}
