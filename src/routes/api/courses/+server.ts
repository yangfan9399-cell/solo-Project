import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { courses } from '$lib/db/schema';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		throw error(401, '未登录');
	}

	const results = await db.select().from(courses);

	return json(results);
};