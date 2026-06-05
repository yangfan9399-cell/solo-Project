import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { students, users } from '$lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		throw error(401, '未登录');
	}

	let query = db
		.select({
			student: students,
			consultant: users
		})
		.from(students)
		.leftJoin(users, eq(students.consultantId, users.id))
		.orderBy(desc(students.createdAt));

	if (locals.user.role === 'consultant') {
		query = query.where(eq(students.consultantId, locals.user.id));
	}

	const results = await query;

	return json(results);
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, '未登录');
	}

	if (locals.user.role !== 'consultant') {
		throw error(403, '无权限');
	}

	const data = await request.json();

	const [newStudent] = await db
		.insert(students)
		.values({
			name: data.name,
			phone: data.phone,
			age: data.age,
			parentName: data.parentName,
			sourceChannel: data.sourceChannel,
			sourceNote: data.sourceNote || '',
			consultantId: locals.user.id
		})
		.returning();

	return json(newStudent);
};