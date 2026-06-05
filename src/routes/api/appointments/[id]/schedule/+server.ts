import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { appointments, teachers, appointmentChanges, students, courses } from '$lib/db/schema';
import { eq, and, sql, or, lt, gt } from 'drizzle-orm';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		throw error(401, '未登录');
	}

	if (locals.user.role !== 'admin') {
		throw error(403, '无权限');
	}

	const appointmentId = parseInt(params.id);
	const data = await request.json();

	const [existing] = await db.select().from(appointments).where(eq(appointments.id, appointmentId));

	if (!existing) {
		throw error(404, '预约不存在');
	}

	const scheduledAt = new Date(data.scheduledAt);
	const duration = data.duration || existing.duration || 60;
	const teacherId = data.teacherId || existing.teacherId;

	if (!teacherId) {
		throw error(400, '必须指定老师');
	}

	const conflictCheck = await checkTeacherConflict(teacherId, scheduledAt, duration, appointmentId);

	if (conflictCheck.hasConflict) {
		await db
			.update(appointments)
			.set({ status: 'teacher_conflict', updatedAt: new Date() })
			.where(eq(appointments.id, appointmentId));

		const oldValues = { status: existing.status };
		const newValues = { status: 'teacher_conflict' };
		const conflictStudentName = conflictCheck.conflictingAppointments?.[0]?.student?.name || '其他学员';

		await db.insert(appointmentChanges).values({
			appointmentId,
			changedBy: locals.user.id,
			changeType: 'conflict_detected',
			oldValue: JSON.stringify(oldValues),
			newValue: JSON.stringify(newValues),
			reason: `检测到老师时间冲突：${conflictStudentName} 的课程`
		});

		return json(
			{
				success: false,
				conflict: true,
				message: '老师时间冲突',
				conflictingAppointments: conflictCheck.conflictingAppointments,
				conflictTeacher: conflictCheck.conflictTeacher,
				alternativeTeachers: conflictCheck.alternativeTeachers,
				suggestedTimeSlots: conflictCheck.suggestedTimeSlots
			},
			{ status: 409 }
		);
	}

	const [updated] = await db
		.update(appointments)
		.set({
			teacherId,
			scheduledAt,
			duration,
			status: 'scheduled',
			updatedAt: new Date()
		})
		.where(eq(appointments.id, appointmentId))
		.returning();

	const oldValues = {
		status: existing.status,
		teacherId: existing.teacherId,
		scheduledAt: existing.scheduledAt
	};
	const newValues = {
		status: 'scheduled',
		teacherId,
		scheduledAt
	};

	await db.insert(appointmentChanges).values({
		appointmentId,
		changedBy: locals.user.id,
		changeType: 'schedule_confirmed',
		oldValue: JSON.stringify(oldValues),
		newValue: JSON.stringify(newValues),
		reason: '教务确认排课'
	});

	return json({ success: true, appointment: updated });
};

async function checkTeacherConflict(
	teacherId: number,
	scheduledAt: Date,
	duration: number,
	excludeAppointmentId?: number
) {
	const newStartTime = scheduledAt;
	const newEndTime = new Date(scheduledAt.getTime() + duration * 60 * 1000);

	const conflicting = await db
		.select({
			appointment: appointments,
			student: students,
			course: courses
		})
		.from(appointments)
		.leftJoin(students, eq(appointments.studentId, students.id))
		.leftJoin(courses, eq(appointments.courseId, courses.id))
		.where(
			and(
				eq(appointments.teacherId, teacherId),
				or(
					eq(appointments.status, 'scheduled'),
					eq(appointments.status, 'pending_schedule')
				),
				excludeAppointmentId ? sql`appointments.id != ${excludeAppointmentId}` : sql`TRUE`,
				lt(appointments.scheduledAt, newEndTime),
				gt(sql`appointments.scheduled_at + (appointments.duration || 60) * interval '1 minute'`, newStartTime)
			)
		);

	if (conflicting.length > 0) {
		const [currentTeacher] = await db
			.select()
			.from(teachers)
			.where(eq(teachers.id, teacherId));

		const allTeachers = await db.select().from(teachers);
		const alternativeTeachers = allTeachers
			.filter((t) => t.id !== teacherId)
			.map((t) => ({
				...t,
				matchSpecialties: currentTeacher?.specialties
					? t.specialties?.filter((s) => currentTeacher.specialties?.includes(s)).length || 0
					: 0
			}))
			.sort((a, b) => b.matchSpecialties - a.matchSpecialties);

		const suggestedTimeSlots = generateSuggestedSlots(
			newStartTime,
			duration,
			conflicting.map((c) => ({
				start: new Date(c.appointment.scheduledAt!),
				end: new Date(
					new Date(c.appointment.scheduledAt!).getTime() +
						(c.appointment.duration || 60) * 60 * 1000
				)
			}))
		);

		return {
			hasConflict: true,
			conflictingAppointments: conflicting,
			conflictTeacher: currentTeacher,
			alternativeTeachers,
			suggestedTimeSlots
		};
	}

	return { hasConflict: false };
}

function generateSuggestedSlots(
	preferredTime: Date,
	duration: number,
	conflicts: Array<{ start: Date; end: Date }>
) {
	const suggestions: Array<{ date: string; time: string }> = [];
	const daysToCheck = 7;
	const hoursToCheck = [9, 10, 11, 14, 15, 16, 17, 19, 20];

	for (let dayOffset = 0; dayOffset < daysToCheck; dayOffset++) {
		for (const hour of hoursToCheck) {
			const candidateTime = new Date(preferredTime);
			candidateTime.setDate(candidateTime.getDate() + dayOffset);
			candidateTime.setHours(hour, 0, 0, 0);

			const candidateEnd = new Date(candidateTime.getTime() + duration * 60 * 1000);

			const hasConflict = conflicts.some(
				(c) => candidateTime < c.end && candidateEnd > c.start
			);

			if (!hasConflict && candidateTime > new Date()) {
				suggestions.push({
					date: candidateTime.toLocaleDateString('zh-CN'),
					time: `${hour.toString().padStart(2, '0')}:00`
				});
				if (suggestions.length >= 5) break;
			}
		}
		if (suggestions.length >= 5) break;
	}

	return suggestions;
}