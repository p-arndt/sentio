import { db } from '$lib/server/db';
import { team, teamMember, user } from '$lib/server/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import type {
	Team,
	TeamMember,
	TeamWithMembers,
	TeamMemberWithUser,
	TeamCreateInput,
	TeamUpdateInput,
	TeamWithHierarchy
} from '$lib/types';
import type { User } from '$lib/types';

export class TeamService {
	/**
	 * Get team by ID
	 */
	static async getTeamById(teamId: string): Promise<Team | null> {
		const result = await db.select().from(team).where(eq(team.id, teamId)).limit(1);
		if (!result[0]) return null;
		return result[0] as Team;
	}

	/**
	 * Get team with members
	 */
	static async getTeamWithMembers(teamId: string): Promise<TeamWithMembers | null> {
		const teamData = await this.getTeamById(teamId);
		if (!teamData) return null;

		const members = await db
			.select({
				id: teamMember.id,
				teamId: teamMember.teamId,
				userId: teamMember.userId,
				role: teamMember.role,
				joinedAt: teamMember.joinedAt,
				createdAt: teamMember.createdAt,
				updatedAt: teamMember.updatedAt,
				user: {
					id: user.id,
					name: user.name,
					email: user.email,
					emailVerified: user.emailVerified,
					image: user.image,
					timezone: user.timezone,
					isAdmin: user.isAdmin,
					personalMode: user.personalMode,
					createdAt: user.createdAt,
					updatedAt: user.updatedAt
				}
			})
			.from(teamMember)
			.innerJoin(user, eq(teamMember.userId, user.id))
			.where(eq(teamMember.teamId, teamId));

		return {
			...teamData,
			members: members as (TeamMember & { user: User })[],
			memberCount: members.length
		};
	}

	/**
	 * Get all teams for a user
	 */
	static async getUserTeams(userId: string): Promise<Team[]> {
		const userTeams = await db
			.select({
				id: team.id,
				name: team.name,
				description: team.description,
				visibility: team.visibility,
				allowMultipleMoodsPerDay: team.allowMultipleMoodsPerDay,
				requireComment: team.requireComment,
				showWeekends: team.showWeekends,
				isContainer: team.isContainer,
				createdBy: team.createdBy,
				createdAt: team.createdAt,
				updatedAt: team.updatedAt
			})
			.from(teamMember)
			.innerJoin(team, eq(teamMember.teamId, team.id))
			.where(eq(teamMember.userId, userId))
			.orderBy(desc(team.createdAt));

		return userTeams as Team[];
	}

	/**
	 * Create a new team
	 */
	static async createTeam(createdBy: string, data: TeamCreateInput): Promise<Team> {
		// Calculate default order if not provided
		let order = data.order;
		if (order === undefined || order === null) {
			if (data.parentId) {
				// Get max order of existing siblings
				const siblings = await db
					.select({ order: team.order })
					.from(team)
					.where(eq(team.parentId, data.parentId));
				const maxOrder = siblings
					.map((s) => s.order)
					.filter((o): o is number => o !== null)
					.reduce((max, o) => Math.max(max, o), -1);
				order = maxOrder + 1;
			} else {
				// Root teams default to 0
				order = 0;
			}
		}

		const result = await db
			.insert(team)
			.values({
				name: data.name,
				description: data.description || null,
				visibility: data.visibility || 'team',
				allowMultipleMoodsPerDay: data.allowMultipleMoodsPerDay || false,
				requireComment: data.requireComment || false,
				showWeekends: data.showWeekends !== undefined ? data.showWeekends : true,
				parentId: data.parentId || null,
				order: order,
				isContainer: data.isContainer || false,
				createdBy
			})
			.returning();

		const newTeam = result[0];

		// Add creator as admin member
		await db.insert(teamMember).values({
			teamId: newTeam.id,
			userId: createdBy,
			role: 'admin'
		});

		return newTeam as Team;
	}

	/**
	 * Update team
	 */
	static async updateTeam(teamId: string, data: TeamUpdateInput): Promise<Team | null> {
		const result = await db
			.update(team)
			.set({
				...data,
				updatedAt: new Date()
			})
			.where(eq(team.id, teamId))
			.returning();

		if (!result[0]) return null;
		return result[0] as Team;
	}

	/**
	 * Delete team
	 */
	static async deleteTeam(teamId: string): Promise<boolean> {
		await db.delete(team).where(eq(team.id, teamId));
		return true;
	}

	/**
	 * Add member to team
	 */
	static async addMemberToTeam(
		teamId: string,
		userId: string,
		role: 'admin' | 'member' = 'member'
	): Promise<TeamMember> {
		const result = await db
			.insert(teamMember)
			.values({
				teamId,
				userId,
				role
			})
			.returning();

		return result[0] as TeamMember;
	}

	/**
	 * Remove member from team
	 */
	static async removeMemberFromTeam(teamId: string, userId: string): Promise<boolean> {
		await db.delete(teamMember).where(and(eq(teamMember.teamId, teamId), eq(teamMember.userId, userId)));
		return true;
	}

	/**
	 * Update member role
	 */
	static async updateMemberRole(
		teamId: string,
		userId: string,
		role: 'admin' | 'member'
	): Promise<TeamMember | null> {
		const result = await db
			.update(teamMember)
			.set({
				role,
				updatedAt: new Date()
			})
			.where(and(eq(teamMember.teamId, teamId), eq(teamMember.userId, userId)))
			.returning();

		return (result[0] as TeamMember) || null;
	}

	/**
	 * Check if user is member of team
	 */
	static async isUserMember(teamId: string, userId: string): Promise<boolean> {
		const result = await db
			.select()
			.from(teamMember)
			.where(and(eq(teamMember.teamId, teamId), eq(teamMember.userId, userId)))
			.limit(1);

		return result.length > 0;
	}

	/**
	 * Check if user is admin of team
	 */
	static async isUserTeamAdmin(teamId: string, userId: string): Promise<boolean> {
		const result = await db
			.select()
			.from(teamMember)
			.where(
				and(
					eq(teamMember.teamId, teamId),
					eq(teamMember.userId, userId),
					eq(teamMember.role, 'admin')
				)
			)
			.limit(1);

		return result.length > 0;
	}

	/**
	 * Get team members
	 */
	static async getTeamMembers(teamId: string): Promise<TeamMemberWithUser[]> {
		const members = await db
			.select({
				id: teamMember.id,
				teamId: teamMember.teamId,
				userId: teamMember.userId,
				role: teamMember.role,
				joinedAt: teamMember.joinedAt,
				createdAt: teamMember.createdAt,
				updatedAt: teamMember.updatedAt,
				user: {
					id: user.id,
					name: user.name,
					email: user.email,
					emailVerified: user.emailVerified,
					image: user.image,
					timezone: user.timezone,
					isAdmin: user.isAdmin,
					personalMode: user.personalMode,
					createdAt: user.createdAt,
					updatedAt: user.updatedAt
				}
			})
			.from(teamMember)
			.innerJoin(user, eq(teamMember.userId, user.id))
			.where(eq(teamMember.teamId, teamId));

		return members as TeamMemberWithUser[];
	}

	/**
	 * Get direct children of a team
	 */
	static async getTeamChildren(teamId: string): Promise<Team[]> {
		return (await db
			.select()
			.from(team)
			.where(eq(team.parentId, teamId))
			.orderBy(
				sql`COALESCE(${team.order}, 2147483647)`,
				team.name
			)) as Team[];
	}

	/**
	 * Get parent team
	 */
	static async getTeamParent(teamId: string): Promise<Team | null> {
		const currentTeam = await this.getTeamById(teamId);
		if (!currentTeam?.parentId) return null;
		return this.getTeamById(currentTeam.parentId);
	}

	/**
	 * Get all ancestors (for breadcrumbs)
	 * Returns array ordered from root to immediate parent
	 */
	static async getTeamAncestors(teamId: string): Promise<Team[]> {
		const ancestors: Team[] = [];
		let currentTeam = await this.getTeamById(teamId);

		// Max depth safety
		let depth = 0;
		while (currentTeam?.parentId && depth < 20) {
			const parent = await this.getTeamById(currentTeam.parentId);
			if (!parent) break;
			// Prevent infinite loops if cycle exists
			if (ancestors.find((t) => t.id === parent.id)) break;

			ancestors.unshift(parent);
			currentTeam = parent;
			depth++;
		}

		return ancestors;
	}

	/**
	 * Get full team tree (recursive)
	 */
	static async getTeamTree(teamId: string): Promise<TeamWithHierarchy | null> {
		const root = await this.getTeamById(teamId);
		if (!root) return null;

		const children = await this.getTeamChildren(teamId);
		const childrenWithHierarchy = await Promise.all(
			children.map((child) => this.getTeamTree(child.id))
		);

		return {
			...root,
			children: childrenWithHierarchy.filter((c): c is TeamWithHierarchy => c !== null)
		};
	}

	/**
	 * Get all root teams (no parent)
	 */
	static async getRootTeams(): Promise<Team[]> {
		return (await db
			.select()
			.from(team)
			.where(sql`${team.parentId} IS NULL`)
			.orderBy(team.name)) as Team[];
	}

	/**
	 * Validate team move to prevent circular references
	 */
	static async validateTeamMove(teamId: string, newParentId: string | null): Promise<boolean> {
		if (!newParentId) return true;
		if (teamId === newParentId) return false;

		const ancestors = await this.getTeamAncestors(newParentId);
		// If the team we are moving is an ancestor of the new parent, that would create a cycle
		if (ancestors.some((a) => a.id === teamId)) return false;

		return true;
	}

	/**
	 * Check if user can access team (including via parent admin rights)
	 */
	static async canUserAccessTeam(userId: string, teamId: string): Promise<boolean> {
		// 1. Direct membership
		const isMember = await this.isUserMember(teamId, userId);
		if (isMember) return true;

		// 2. Check parent teams (recursive up to root)
		const ancestors = await this.getTeamAncestors(teamId);
		for (const ancestor of ancestors) {
			const isParentAdmin = await this.isUserTeamAdmin(ancestor.id, userId);
			if (isParentAdmin) return true;
		}

		return false;
	}

	/**
	 * Check if user can manage team (direct admin or ancestor admin)
	 */
	static async canUserManageTeam(userId: string, teamId: string): Promise<boolean> {
		// 1. Direct admin
		const isAdmin = await this.isUserTeamAdmin(teamId, userId);
		if (isAdmin) return true;

		// 2. Ancestor admin
		const ancestors = await this.getTeamAncestors(teamId);
		for (const ancestor of ancestors) {
			const isParentAdmin = await this.isUserTeamAdmin(ancestor.id, userId);
			if (isParentAdmin) return true;
		}

		return false;
	}

	/**
	 * Get inherited settings
	 */
	static async getInheritedSettings(teamId: string): Promise<Partial<Team>> {
		const ancestors = await this.getTeamAncestors(teamId);
		let settings: Partial<Team> = {};

		// Merge settings from root down to parent
		for (const ancestor of ancestors) {
			settings = {
				...settings,
				allowMultipleMoodsPerDay: ancestor.allowMultipleMoodsPerDay,
				requireComment: ancestor.requireComment,
				showWeekends: ancestor.showWeekends,
				visibility: ancestor.visibility
			};
		}

		return settings;
	}

	/**
	 * Get trees of teams the user has access to
	 */
	static async getUserTeamTrees(userId: string): Promise<TeamWithHierarchy[]> {
		const userTeams = await this.getUserTeams(userId);
		const rootIds = new Set<string>();
		const roots: Team[] = [];

		for (const team of userTeams) {
			if (!team.parentId) {
				if (!rootIds.has(team.id)) {
					rootIds.add(team.id);
					roots.push(team);
				}
				continue;
			}

			const ancestors = await this.getTeamAncestors(team.id);
			if (ancestors.length > 0) {
				const root = ancestors[0];
				if (!rootIds.has(root.id)) {
					rootIds.add(root.id);
					roots.push(root);
				}
			}
		}

		const trees = await Promise.all(roots.map((root) => this.getTeamTree(root.id)));
		return trees.filter((t): t is TeamWithHierarchy => t !== null);
	}

	/**
	 * Get all teams (admin only)
	 */
	static async getAllTeams(): Promise<Team[]> {
		return (await db.select().from(team).orderBy(desc(team.createdAt))) as Team[];
	}
}
