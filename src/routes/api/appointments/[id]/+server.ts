import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import {
	appointments,
	appointmentChanges,
	students,
	courses,
	teachers,
	users,
	followUps
} from '$lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		throw error(401, '未登录');
	}

	const appointmentId = parseInt(params.id);

	const [result] = await db
		.select({
			appointment: appointments,
			student: students,
			course: courses,
			teacher: teachers,
			consultant: users
		})
		.from(appointments)
		.leftJoin(students, eq(appointments.studentId, students.id))
		.leftJoin(courses, eq(appointments.courseId, courses.id))
		.leftJoin(teachers, eq(appointments.teacherId, teachers.id))
		.leftJoin(users, eq(appointments.consultantId, users.id))
		.where(eq(appointments.id, appointmentId));

	if (!result) {
		throw error(404, '预约不存在');
	}

	const changes = await db
		.select({
			change: appointmentChanges,
			changedBy: users
		})
		.from(appointmentChanges)
		.leftJoin(users, eq(appointmentChanges.changedBy, users.id))
		.where(eq(appointmentChanges.appointmentId, appointmentId))
		.orderBy(desc(appointmentChanges.createdAt));

	const followUpRecords = await db
		.select({
			followUp: followUps,
			consultant: {
				id: sql<number>`fu_consultant.id`,
				name: sql<string>`fu_consultant.name`,
				email: sql<string>`fu_consultant.email`,
				role: sql<string>`fu_consultant.role`
			},
			supervisor: {
				id: sql<number>`fu_supervisor.id`,
				name: sql<string>`fu_supervisor.name`,
				email: sql<string>`fu_supervisor.email`,
				role: sql<string>`fu_supervisor.role`
			}
		})
		.from(followUps)
		.leftJoin(sql`users AS fu_consultant`, sql`fu_consultant.id = follow_ups.consultant_id`)
		.leftJoin(sql`users AS fu_supervisor`, sql`fu_supervisor.id = follow_ups.supervisor_id`)
		.where(eq(followUps.appointmentId, appointmentId))
		.orderBy(desc(followUps.createdAt));

	return json({
		...result,
		changes,
		followUps: followUpRecords
	});
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		throw error(401, '未登录');
	}

	const appointmentId = parseInt(params.id);
	const data = await request.json();

	const [existing] = await db.select().from(appointments).where(eq(appointments.id, appointmentId));

	if (!existing) {
		throw error(404, '预约不存在');
	}

	const oldValues: Record<string, any> = {};
	const newValues: Record<string, any> = {};

	if (data.scheduledAt && existing.scheduledAt?.toISOString() !== data.scheduledAt) {
		oldValues.scheduledAt = existing.scheduledAt;
		newValues.scheduledAt = data.scheduledAt;
	}

	if (data.teacherId && existing.teacherId !== data.teacherId) {
		oldValues.teacherId = existing.teacherId;
		newValues.teacherId = data.teacherId;
	}

	if (data.status && existing.status !== data.status) {
		oldValues.status = existing.status;
		newValues.status = data.status;
	}

	const [updated] = await db
		.update(appointments)
		.set({
			...data,
			updatedAt: new Date()
		})
		.where(eq(appointments.id, appointmentId))
		.returning();

	if (Object.keys(oldValues).length > 0) {
		await db.insert(appointmentChanges).values({
			appointmentId,
			changedBy: locals.user.id,
			changeType: data.changeType || 'update',
			oldValue: JSON.stringify(oldValues),
			newValue: JSON.stringify(newValues),
			reason: data.reason || ''
		});
	}

	return json(updated);
};