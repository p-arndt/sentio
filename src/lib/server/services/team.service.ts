import { db } from '$lib/server/db';
import { team, teamMember, user } from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import type {
	Team,
	TeamMember,
	TeamWithMembers,
	TeamMemberWithUser,
	TeamCreateInput,
	TeamUpdateInput
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
		const result = await db
			.insert(team)
			.values({
				name: data.name,
				description: data.description || null,
				visibility: data.visibility || 'team',
				allowMultipleMoodsPerDay: data.allowMultipleMoodsPerDay || false,
				requireComment: data.requireComment || false,
				showWeekends: data.showWeekends !== undefined ? data.showWeekends : true,
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
	 * Get all teams (admin only)
	 */
	static async getAllTeams(): Promise<Team[]> {
		return (await db.select().from(team).orderBy(desc(team.createdAt))) as Team[];
	}
}
