import type { Handle } from '@sveltejs/kit';
import { db } from '$lib/db';
import { users } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get('session_id');

	if (sessionId) {
		const userId = parseInt(sessionId, 10);
		if (!isNaN(userId)) {
			const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
			if (user.length > 0) {
				event.locals.user = user[0];
			}
		}
	}

	const response = await resolve(event);
	return response;
};