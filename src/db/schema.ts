import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  date,
  timestamp,
  boolean,
  json,
  pgEnum,
} from 'drizzle-orm/pg-core'

export const inspectionStatusEnum = pgEnum('inspection_status', [
  'pending',
  'completed',
  'rejected',
])

export const hazardLevelEnum = pgEnum('hazard_level', ['low', 'medium', 'high', 'critical'])

export const hazardTypeEnum = pgEnum('hazard_type', [
  'hose_aging',
  'leak',
  'nozzle_damage',
  'vent_blockage',
  'illegal_modification',
  'other',
])

export const rectificationStatusEnum = pgEnum('rectification_status', [
  'pending',
  'scheduled',
  'in_progress',
  'completed',
  'overdue',
  'stopped',
])

export const appointmentStatusEnum = pgEnum('appointment_status', [
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
])

export const residents = pgTable('residents', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  address: varchar('address', { length: 255 }).notNull(),
  community: varchar('community', { length: 100 }).notNull(),
  building: varchar('building', { length: 20 }).notNull(),
  floor: integer('floor').notNull(),
  room: varchar('room', { length: 10 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

export const meters = pgTable('meters', {
  id: serial('id').primaryKey(),
  residentId: integer('resident_id').references(() => residents.id),
  meterNumber: varchar('meter_number', { length: 50 }).notNull().unique(),
  installationDate: date('installation_date').notNull(),
  location: varchar('location', { length: 100 }),
  status: varchar('status', { length: 20 }).default('active'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const inspections = pgTable('inspections', {
  id: serial('id').primaryKey(),
  residentId: integer('resident_id').references(() => residents.id).notNull(),
  meterId: integer('meter_id').references(() => meters.id),
  inspectorName: varchar('inspector_name', { length: 100 }).notNull(),
  inspectionDate: date('inspection_date').notNull(),
  status: inspectionStatusEnum('status').default('pending'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const hazards = pgTable('hazards', {
  id: serial('id').primaryKey(),
  inspectionId: integer('inspection_id').references(() => inspections.id).notNull(),
  type: hazardTypeEnum('type').notNull(),
  level: hazardLevelEnum('level').notNull(),
  description: text('description').notNull(),
  photos: json('photos').default([]),
  createdAt: timestamp('created_at').defaultNow(),
})

export const rectifications = pgTable('rectifications', {
  id: serial('id').primaryKey(),
  hazardId: integer('hazard_id').references(() => hazards.id).notNull(),
  status: rectificationStatusEnum('status').default('pending'),
  repairmanName: varchar('repairman_name', { length: 100 }),
  repairDate: date('repair_date'),
  description: text('description'),
  beforePhotos: json('before_photos').default([]),
  afterPhotos: json('after_photos').default([]),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const appointments = pgTable('appointments', {
  id: serial('id').primaryKey(),
  inspectionId: integer('inspection_id').references(() => inspections.id).notNull(),
  residentId: integer('resident_id').references(() => residents.id).notNull(),
  servicePersonName: varchar('service_person_name', { length: 100 }).notNull(),
  scheduledDate: date('scheduled_date').notNull(),
  status: appointmentStatusEnum('status').default('pending'),
  notes: text('notes'),
  isSecondAttempt: boolean('is_second_attempt').default(false),
  createdAt: timestamp('created_at').defaultNow(),
})

export const historyNodes = pgTable('history_nodes', {
  id: serial('id').primaryKey(),
  inspectionId: integer('inspection_id').references(() => inspections.id).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  operator: varchar('operator', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})
