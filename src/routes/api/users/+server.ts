import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma';

export const GET: RequestHandler = async () => {
	try {
		const users = await prisma.user.findMany({
			orderBy: { createdAt: 'asc' }
		});
		return json(users);
	} catch (error) {
		return json({ error: 'Failed to fetch users' }, { status: 500 });
	}
};
