import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { appointments, appointmentChanges, students, courses, teachers, followUps } from '$lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		throw error(401, '未登录');
	}

	const status = url.searchParams.get('status');
	const studentId = url.searchParams.get('studentId');

	let query = db
		.select({
			appointment: appointments,
			student: students,
			course: courses,
			teacher: teachers
		})
		.from(appointments)
		.leftJoin(students, eq(appointments.studentId, students.id))
		.leftJoin(courses, eq(appointments.courseId, courses.id))
		.leftJoin(teachers, eq(appointments.teacherId, teachers.id))
		.orderBy(desc(appointments.createdAt));

	if (status) {
		query = query.where(eq(appointments.status, status as any));
	}

	if (studentId) {
		query = query.where(eq(appointments.studentId, parseInt(studentId)));
	}

	if (locals.user.role === 'consultant') {
		query = query.where(eq(appointments.consultantId, locals.user.id));
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

	const [newAppointment] = await db
		.insert(appointments)
		.values({
			studentId: data.studentId,
			courseId: data.courseId,
			teacherId: data.teacherId || null,
			consultantId: locals.user.id,
			scheduledAt: data.scheduledAt || null,
			duration: data.duration || null,
			status: data.teacherId && data.scheduledAt ? 'pending_schedule' : 'pending_booking',
			notes: data.notes || ''
		})
		.returning();

	await db.insert(followUps).values({
		appointmentId: newAppointment.id,
		consultantId: locals.user.id
	});

	return json(newAppointment);
};