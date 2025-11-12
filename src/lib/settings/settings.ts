import type { UserSettings } from '$lib/types';
import { Bell, Calendar, Heart, Palette } from '@lucide/svelte';
import type { Component } from 'svelte';

export type SettingType = 'select' | 'toggle' | 'text';

export interface SettingOption {
	value: string;
	label: string;
}

export interface SettingField {
	id: string;
	type: SettingType;
	label: string;
	description: string;
	defaultValue: string | boolean;
	options?: SettingOption[];
}

export interface SettingSection {
	id: string;
	title: string;
	description: string;
	icon: Component;
	fields: SettingField[];
}

// Define all settings grouped by section
export const SETTINGS_SECTIONS: SettingSection[] = [
	{
		id: 'appearance',
		title: 'Appearance',
		description: 'Customize how the app looks',
		icon: Palette,
		fields: [
			// {
			// 	id: 'theme',
			// 	type: 'select',
			// 	label: 'Theme',
			// 	description: 'Choose your preferred color theme',
			// 	defaultValue: 'system',
			// 	options: [
			// 		{ value: 'light', label: 'Light' },
			// 		{ value: 'dark', label: 'Dark' },
			// 		{ value: 'system', label: 'System' }
			// 	]
			// },
			{
				id: 'startPage',
				type: 'select',
				label: 'Start Page',
				description: 'Choose where the app should open after sign in',
				defaultValue: '/',
				options: [
					{ value: '/', label: 'Dashboard' },
					{ value: '/personal', label: 'Personal' },
					{ value: '/teams', label: 'Teams List' }
				]
			}
		]
	},
	{
		id: 'calendar',
		title: 'Calendar Preferences',
		description: 'Customize your calendar view',
		icon: Calendar,
		fields: [
			{
				id: 'defaultView',
				type: 'select',
				label: 'Default View',
				description: 'Your preferred calendar view when opening the app',
				defaultValue: 'week',
				options: [
					{ value: 'day', label: 'Day View' },
					{ value: 'week', label: 'Week View' },
					{ value: 'month', label: 'Month View' }
				]
			}
		]
	},
	// {
	// 	id: 'notifications',
	// 	title: 'Notifications',
	// 	description: 'Manage your notification preferences',
	// 	icon: Bell,
	// 	fields: [
	// 		{
	// 			id: 'enableNotifications',
	// 			type: 'toggle',
	// 			label: 'Enable Notifications',
	// 			description: 'Receive reminders to log your daily mood',
	// 			defaultValue: true
	// 		}
	// 	]
	// },
	// {
	// 	id: 'personal',
	// 	title: 'Personal Mode',
	// 	description: 'Use the calendar for personal mood tracking',
	// 	icon: Heart,
	// 	fields: [
	// 		{
	// 			id: 'personalMode',
	// 			type: 'toggle',
	// 			label: 'Enable Personal Mode',
	// 			description: 'Track your moods privately without teams',
	// 			defaultValue: false
	// 		}
	// 	]
	// }
];

/**
 * Get a setting field by ID from all sections
 */
export function getSettingField(settingId: string): SettingField | null {
	for (const section of SETTINGS_SECTIONS) {
		const field = section.fields.find((f) => f.id === settingId);
		if (field) return field;
	}
	return null;
}

/**
 * Get the label for a setting value
 */
export function getSettingLabel(settingId: string, value: string | boolean): string {
	if (typeof value === 'boolean') {
		return value ? 'Enabled' : 'Disabled';
	}

	const field = getSettingField(settingId);
	if (!field || !field.options) return String(value);

	const option = field.options.find((opt) => opt.value === value);
	return option?.label || String(value);
}

/**
 * Format start page for display
 */
export function formatStartPageLabel(path: string): string {
	const labels: Record<string, string> = {
		'/': 'Dashboard',
		'/personal': 'Personal',
		'/teams': 'Teams List'
	};

	if (labels[path]) return labels[path];
	if (path.startsWith('/teams/')) return `Team: ${path.replace('/teams/', '')}`;
	return path;
}

export function getDefaultSettings(): Partial<UserSettings> {
	const defaults: Partial<UserSettings> = {};

	for (const section of SETTINGS_SECTIONS) {
		for (const field of section.fields) {
			defaults[field.id as keyof UserSettings] = field.defaultValue as never;
		}
	}

	return defaults;
}
