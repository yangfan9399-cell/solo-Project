import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import {
	appointments,
	students,
	courses,
	teachers,
	followUps,
	sourceChannelEnum
} from '$lib/db/schema';
import { eq, sql, count, sum, and, desc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		throw error(401, '未登录');
	}

	const channelStats = await db
		.select({
			channel: students.sourceChannel,
			total: count(students.id),
			attended: sql<number>`COUNT(DISTINCT CASE WHEN appointments.status = 'completed' THEN students.id END)`,
			converted: sql<number>`COUNT(DISTINCT CASE WHEN follow_ups.conversion_status = 'converted' THEN students.id END)`
		})
		.from(students)
		.leftJoin(appointments, eq(students.id, appointments.studentId))
		.leftJoin(followUps, eq(appointments.id, followUps.appointmentId))
		.groupBy(students.sourceChannel);

	const courseStats = await db
		.select({
			courseId: courses.id,
			courseName: courses.name,
			total: count(appointments.id),
			attended: sql<number>`COUNT(CASE WHEN appointments.status = 'completed' THEN 1 END)`,
			noShow: sql<number>`COUNT(CASE WHEN appointments.status = 'no_show' THEN 1 END)`,
			converted: sql<number>`COUNT(CASE WHEN follow_ups.conversion_status = 'converted' THEN 1 END)`
		})
		.from(courses)
		.leftJoin(appointments, eq(courses.id, appointments.courseId))
		.leftJoin(followUps, eq(appointments.id, followUps.appointmentId))
		.groupBy(courses.id, courses.name)
		.orderBy(desc(count(appointments.id)));

	const statusStats = await db
		.select({
			status: appointments.status,
			count: count(appointments.id)
		})
		.from(appointments)
		.groupBy(appointments.status);

	const conversionStats = await db
		.select({
			status: followUps.conversionStatus,
			count: count(followUps.id)
		})
		.from(followUps)
		.groupBy(followUps.conversionStatus);

	const missingFeedback = await db
		.select({
			id: appointments.id,
			studentName: sql`students.name`,
			courseName: sql`courses.name`,
			appointmentDate: appointments.scheduledAt,
			consultantId: appointments.consultantId
		})
		.from(appointments)
		.leftJoin(students, eq(appointments.studentId, students.id))
		.leftJoin(courses, eq(appointments.courseId, courses.id))
		.leftJoin(followUps, eq(appointments.id, followUps.appointmentId))
		.where(
			and(
				eq(appointments.status, 'completed'),
				sql`(follow_ups.content IS NULL OR follow_ups.content = '')`
			)
		);

	return json({
		byChannel: channelStats,
		byCourse: courseStats,
		byStatus: statusStats,
		byConversion: conversionStats,
		missingFeedback
	});
};