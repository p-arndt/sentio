// ==================== USER UTILITIES ====================

/**
 * Get user initials from full name (max 2 characters)
 * @example getUserInitials("John Doe") => "JD"
 * @example getUserInitials("Alice") => "AL"
 */
export function getUserInitials(name: string): string {
	if (!name || typeof name !== 'string') return '';
	
	return name
		.split(' ')
		.map((part) => part[0])
		.join('')
		.toUpperCase()
		.slice(0, 2);
}

/**
 * Format user name for display
 */
export function formatUserName(firstName?: string, lastName?: string): string {
	if (!firstName && !lastName) return 'Unknown User';
	if (!lastName) return firstName || '';
	if (!firstName) return lastName || '';
	return `${firstName} ${lastName}`;
}


export const isAnonymousUser = (userId: string): boolean => {
	return userId.startsWith('anon-');
}
