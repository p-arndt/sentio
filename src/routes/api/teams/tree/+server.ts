import { json } from '@sveltejs/kit';
import { TeamService } from '$lib/server/services/team.service';

export async function GET({ locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Get all teams the user is a member of
	const userTeams = await TeamService.getUserTeams(locals.user.id);
	
	// Find unique roots for these teams
	const rootIds = new Set<string>();
	const roots = [];

	for (const team of userTeams) {
		// If team has no parent, it is a root
		if (!team.parentId) {
			if (!rootIds.has(team.id)) {
				rootIds.add(team.id);
				roots.push(team);
			}
			continue;
		}

		// If team has parent, find its root
		const ancestors = await TeamService.getTeamAncestors(team.id);
		if (ancestors.length > 0) {
			const root = ancestors[0]; // Ancestors are ordered root -> parent
			if (!rootIds.has(root.id)) {
				rootIds.add(root.id);
				roots.push(root);
			}
		}
	}

	// Build tree for each root
	// Note: This might expose siblings the user is not a member of if the root is shared.
	// This is acceptable for "Organization Structure" visibility usually.
	const tree = await Promise.all(roots.map(root => TeamService.getTeamTree(root.id)));

	return json(tree.filter(t => t !== null));
}

