/**
 * Calendar Integration Types
 */

// ==================== GOOGLE CALENDAR API TYPES ====================

/**
 * Google Calendar Event Resource
 * https://developers.google.com/workspace/calendar/api/v3/reference/events
 */
export interface GoogleCalendarEvent {
	kind?: 'calendar#event';
	etag?: string;
	id: string;
	status?: 'confirmed' | 'tentative' | 'cancelled';
	htmlLink?: string;
	created?: string; // RFC3339 datetime
	updated?: string; // RFC3339 datetime
	summary?: string;
	description?: string;
	location?: string;
	colorId?: string;
	creator?: GoogleCalendarPerson;
	organizer?: GoogleCalendarPerson;
	start: GoogleCalendarDateTime;
	end: GoogleCalendarDateTime;
	endTimeUnspecified?: boolean;
	recurrence?: string[];
	recurringEventId?: string;
	originalStartTime?: GoogleCalendarDateTime;
	transparency?: 'opaque' | 'transparent';
	visibility?: 'default' | 'public' | 'private' | 'confidential';
	iCalUID?: string;
	sequence?: number;
	attendees?: GoogleCalendarAttendee[];
	attendeesOmitted?: boolean;
	extendedProperties?: {
		private?: Record<string, string>;
		shared?: Record<string, string>;
	};
	hangoutLink?: string;
	conferenceData?: GoogleCalendarConferenceData;
	gadget?: GoogleCalendarGadget;
	anyoneCanAddSelf?: boolean;
	guestsCanInviteOthers?: boolean;
	guestsCanModify?: boolean;
	guestsCanSeeOtherGuests?: boolean;
	privateCopy?: boolean;
	locked?: boolean;
	reminders?: GoogleCalendarReminders;
	source?: GoogleCalendarSource;
	attachments?: GoogleCalendarAttachment[];
	eventType?: 'default' | 'birthday' | 'focusTime' | 'fromGmail' | 'outOfOffice' | 'workingLocation';
	workingLocationProperties?: GoogleCalendarWorkingLocationProperties;
	outOfOfficeProperties?: GoogleCalendarOutOfOfficeProperties;
	focusTimeProperties?: GoogleCalendarFocusTimeProperties;
	birthdayProperties?: GoogleCalendarBirthdayProperties;
}

/**
 * Google Calendar Person (Creator, Organizer, Attendee)
 */
export interface GoogleCalendarPerson {
	id?: string;
	email?: string;
	displayName?: string;
	self?: boolean;
}

/**
 * Google Calendar Date/DateTime
 */
export interface GoogleCalendarDateTime {
	date?: string; // YYYY-MM-DD format for all-day events
	dateTime?: string; // RFC3339 datetime
	timeZone?: string; // IANA Time Zone Database name (e.g., "Europe/Zurich")
}

/**
 * Google Calendar Attendee
 */
export interface GoogleCalendarAttendee {
	id?: string;
	email: string;
	displayName?: string;
	organizer?: boolean;
	self?: boolean;
	resource?: boolean;
	optional?: boolean;
	responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
	comment?: string;
	additionalGuests?: number;
}

/**
 * Google Calendar Conference Data
 */
export interface GoogleCalendarConferenceData {
	createRequest?: GoogleCalendarCreateRequest;
	entryPoints?: GoogleCalendarEntryPoint[];
	conferenceSolution?: GoogleCalendarConferenceSolution;
	conferenceId?: string;
	signature?: string;
	notes?: string;
}

export interface GoogleCalendarCreateRequest {
	requestId: string;
	conferenceSolutionKey?: {
		type: 'eventHangout' | 'eventNamedHangout' | 'hangoutsMeet' | 'addOn';
	};
	status?: {
		statusCode: 'pending' | 'success' | 'failure';
	};
}

export interface GoogleCalendarEntryPoint {
	entryPointType: 'video' | 'phone' | 'sip' | 'more';
	uri: string;
	label?: string;
	pin?: string;
	accessCode?: string;
	meetingCode?: string;
	passcode?: string;
	password?: string;
}

export interface GoogleCalendarConferenceSolution {
	key?: {
		type: 'eventHangout' | 'eventNamedHangout' | 'hangoutsMeet' | 'addOn';
	};
	name?: string;
	iconUri?: string;
}

/**
 * Google Calendar Gadget (deprecated)
 */
export interface GoogleCalendarGadget {
	type?: string;
	title?: string;
	link?: string;
	iconLink?: string;
	width?: number;
	height?: number;
	display?: 'icon' | 'chip';
	preferences?: Record<string, string>;
}

/**
 * Google Calendar Reminders
 */
export interface GoogleCalendarReminders {
	useDefault?: boolean;
	overrides?: GoogleCalendarReminder[];
}

export interface GoogleCalendarReminder {
	method: 'email' | 'popup';
	minutes: number;
}

/**
 * Google Calendar Source
 */
export interface GoogleCalendarSource {
	url?: string;
	title?: string;
}

/**
 * Google Calendar Attachment
 */
export interface GoogleCalendarAttachment {
	fileUrl?: string;
	title?: string;
	mimeType?: string;
	iconLink?: string;
	fileId?: string;
}

/**
 * Google Calendar Working Location Properties
 */
export interface GoogleCalendarWorkingLocationProperties {
	type: 'homeOffice' | 'officeLocation' | 'customLocation';
	homeOffice?: Record<string, unknown>;
	officeLocation?: {
		buildingId?: string;
		floorId?: string;
		floorSectionId?: string;
		deskId?: string;
		label?: string;
	};
	customLocation?: {
		label?: string;
	};
}

/**
 * Google Calendar Out of Office Properties
 */
export interface GoogleCalendarOutOfOfficeProperties {
	autoDeclineMode?: 'declineNone' | 'declineAllConflictingInvitations' | 'declineOnlyNewConflictingInvitations';
	declineMessage?: string;
}

/**
 * Google Calendar Focus Time Properties
 */
export interface GoogleCalendarFocusTimeProperties {
	autoDeclineMode?: 'declineNone' | 'declineAllConflictingInvitations' | 'declineOnlyNewConflictingInvitations';
	declineMessage?: string;
	chatStatus?: 'available' | 'doNotDisturb';
}

/**
 * Google Calendar Birthday Properties
 */
export interface GoogleCalendarBirthdayProperties {
	contact?: string; // Format: "people/c12345"
	type?: 'anniversary' | 'birthday' | 'custom' | 'other' | 'self';
	customTypeName?: string;
}

/**
 * Google Calendar Events List Response
 */
export interface GoogleCalendarEventsListResponse {
	kind?: 'calendar#events';
	etag?: string;
	summary?: string;
	updated?: string; // RFC3339 datetime
	timeZone?: string;
	accessRole?: 'owner' | 'writer' | 'reader' | 'freeBusyReader';
	defaultReminders?: GoogleCalendarReminder[];
	nextPageToken?: string;
	nextSyncToken?: string;
	items: GoogleCalendarEvent[];
}

// ==================== INTERNAL TYPES ====================

export interface CalendarAccount {
	id: string;
	userId: string;
	provider: 'google' | 'microsoft';
	email: string;
	calendarId?: string;
	isEnabled: boolean;
	lastSyncedAt?: Date;
	nextSyncAt?: Date;
	syncToken?: string;
	metadata: Record<string, unknown>;
	createdAt: Date;
	updatedAt: Date;
}

export interface CalendarEvent {
	id?: string;
	calendarAccountId?: string;
	userId?: string;
	externalEventId: string;
	provider: 'google' | 'microsoft';
	title: string;
	description?: string;
	startTime: Date;
	endTime: Date;
	duration?: number;
	isAllDay: boolean;
	location?: string;
	attendeeCount?: number;
	moodPromptSent?: boolean;
	moodPromptSentAt?: Date;
	moodLogged?: boolean;
	moodEntryId?: string;
	externalMetadata: Record<string, unknown>;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface CalendarSync {
	id: string;
	userId: string;
	calendarAccountId?: string;
	status: 'pending' | 'in_progress' | 'completed' | 'failed';
	error?: string;
	eventsImported: number;
	eventsUpdated: number;
	eventsDeleted: number;
	startedAt: Date;
	completedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

export interface MoodPromptTrigger {
	eventId: string;
	userId: string;
	eventTitle: string;
	eventEndTime: Date;
	provider: 'google' | 'microsoft';
}
