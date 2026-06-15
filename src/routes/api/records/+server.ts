import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAllGameRecords } from '$lib/store';

export const GET: RequestHandler = async () => {
	const records = getAllGameRecords();
	return json(records);
};
