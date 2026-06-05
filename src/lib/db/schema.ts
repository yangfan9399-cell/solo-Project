import { pgTable, serial, text, timestamp, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', ['consultant', 'admin', 'supervisor']);
export const appointmentStatusEnum = pgEnum('appointment_status', [
	'pending_booking',
	'pending_schedule',
	'scheduled',
	'teacher_conflict',
	'completed',
	'no_show',
	'cancelled',
	'rescheduled'
]);
export const conversionStatusEnum = pgEnum('conversion_status', [
	'pending_review',
	'converted',
	'not_converted',
	'returned'
]);
export const sourceChannelEnum = pgEnum('source_channel', [
	'wechat',
	'douyin',
	'baidu',
	'tuiguang',
	'referral',
	'walk_in',
	'other'
]);

export const users = pgTable('users', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').unique().notNull(),
	passwordHash: text('password_hash').notNull(),
	role: userRoleEnum('role').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const teachers = pgTable('teachers', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	phone: text('phone'),
	specialties: text('specialties').array(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const courses = pgTable('courses', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	duration: integer('duration').notNull(),
	description: text('description'),
	price: integer('price'),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const students = pgTable('students', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	phone: text('phone').notNull(),
	age: integer('age'),
	parentName: text('parent_name'),
	sourceChannel: sourceChannelEnum('source_channel').notNull(),
	sourceNote: text('source_note'),
	consultantId: integer('consultant_id').references(() => users.id),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const appointments = pgTable('appointments', {
	id: serial('id').primaryKey(),
	studentId: integer('student_id')
		.references(() => students.id)
		.notNull(),
	courseId: integer('course_id')
		.references(() => courses.id)
		.notNull(),
	teacherId: integer('teacher_id').references(() => teachers.id),
	consultantId: integer('consultant_id')
		.references(() => users.id)
		.notNull(),
	scheduledAt: timestamp('scheduled_at'),
	duration: integer('duration'),
	status: appointmentStatusEnum('status').default('pending_booking').notNull(),
	notes: text('notes'),
	previousAppointmentId: integer('previous_appointment_id').references(() => appointments.id),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const followUps = pgTable('follow_ups', {
	id: serial('id').primaryKey(),
	appointmentId: integer('appointment_id')
		.references(() => appointments.id)
		.notNull(),
	consultantId: integer('consultant_id')
		.references(() => users.id)
		.notNull(),
	content: text('content'),
	studentFeedback: text('student_feedback'),
	interestLevel: integer('interest_level'),
	conversionSuggestion: text('conversion_suggestion'),
	conversionStatus: conversionStatusEnum('conversion_status').default('pending_review'),
	supervisorNote: text('supervisor_note'),
	supervisorId: integer('supervisor_id').references(() => users.id),
	reviewedAt: timestamp('reviewed_at'),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const appointmentChanges = pgTable('appointment_changes', {
	id: serial('id').primaryKey(),
	appointmentId: integer('appointment_id')
		.references(() => appointments.id)
		.notNull(),
	changedBy: integer('changed_by')
		.references(() => users.id)
		.notNull(),
	changeType: text('change_type').notNull(),
	oldValue: text('old_value'),
	newValue: text('new_value'),
	reason: text('reason'),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const usersRelations = relations(users, ({ many }) => ({
	students: many(students, { relationName: 'consultantStudents' }),
	appointments: many(appointments, { relationName: 'consultantAppointments' }),
	followUps: many(followUps, { relationName: 'consultantFollowUps' }),
	supervisedFollowUps: many(followUps, { relationName: 'supervisorFollowUps' }),
	changes: many(appointmentChanges)
}));

export const teachersRelations = relations(teachers, ({ many }) => ({
	appointments: many(appointments)
}));

export const coursesRelations = relations(courses, ({ many }) => ({
	appointments: many(appointments)
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
	consultant: one(users, {
		fields: [students.consultantId],
		references: [users.id],
		relationName: 'consultantStudents'
	}),
	appointments: many(appointments)
}));

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
	student: one(students, {
		fields: [appointments.studentId],
		references: [students.id]
	}),
	course: one(courses, {
		fields: [appointments.courseId],
		references: [courses.id]
	}),
	teacher: one(teachers, {
		fields: [appointments.teacherId],
		references: [teachers.id]
	}),
	consultant: one(users, {
		fields: [appointments.consultantId],
		references: [users.id],
		relationName: 'consultantAppointments'
	}),
	previousAppointment: one(appointments, {
		fields: [appointments.previousAppointmentId],
		references: [appointments.id]
	}),
	followUps: many(followUps),
	changes: many(appointmentChanges)
}));

export const followUpsRelations = relations(followUps, ({ one }) => ({
	appointment: one(appointments, {
		fields: [followUps.appointmentId],
		references: [appointments.id]
	}),
	consultant: one(users, {
		fields: [followUps.consultantId],
		references: [users.id],
		relationName: 'consultantFollowUps'
	}),
	supervisor: one(users, {
		fields: [followUps.supervisorId],
		references: [users.id],
		relationName: 'supervisorFollowUps'
	})
}));

export type User = typeof users.$inferSelect;
export type Teacher = typeof teachers.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type FollowUp = typeof followUps.$inferSelect;
export type AppointmentChange = typeof appointmentChanges.$inferSelect;
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type AppointmentStatus = (typeof appointmentStatusEnum.enumValues)[number];
export type ConversionStatus = (typeof conversionStatusEnum.enumValues)[number];
export type SourceChannel = (typeof sourceChannelEnum.enumValues)[number];