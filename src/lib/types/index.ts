export interface Emotion {
	id: string;
	name: string;
	emoji: string;
	color: string;
}

export interface CalendarEntry {
	id: string;
	userId: string;
	emotionId: string;
	date: Date;
	comment?: string;
	emotion?: Emotion;
	createdAt: Date;
	updatedAt: Date;
}

export interface TeamMember {
	id: string;
	name: string;
	entries: CalendarEntry[];
}

export interface WeekData {
	weekDays: Date[];
	teamMembers: TeamMember[];
}