import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import packageJson from '../../../../package.json';

export const GET: RequestHandler = async () => {
	return json({
		version: packageJson.version
	});
};
