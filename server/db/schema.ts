import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  boolean,
  decimal,
  json,
  pgEnum,
  foreignKey,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'assigned',
  'in_progress',
  'completed',
  'inspection_passed',
  'inspection_failed',
  'rework',
  'rework_completed',
  'rework_timeout',
  'compensation_pending',
  'compensation_approved',
  'compensation_rejected',
  'closed',
]);

export const serviceTypeEnum = pgEnum('service_type', [
  'daily_cleaning',
  'deep_cleaning',
  'move_in_out',
  'office_cleaning',
  'kitchen_cleaning',
  'bathroom_cleaning',
]);

export const roleEnum = pgEnum('role', [
  'customer_service',
  'cleaner',
  'inspector',
  'supervisor',
]);

export const reworkReasonEnum = pgEnum('rework_reason', [
  'photo_missing',
  'poor_quality',
  'item_damaged',
  'missed_area',
  'other',
]);

export const compensationRuleTypeEnum = pgEnum('compensation_rule_type', [
  'item_damage',
  'rework_timeout',
  'customer_complaint',
  'photo_missing',
]);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').unique(),
  role: roleEnum('role').notNull(),
  avatar: text('avatar'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  address: text('address').notNull(),
  city: text('city').notNull(),
  district: text('district'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const cleaners = pgTable('cleaners', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  level: text('level').default('junior'),
  city: text('city').notNull(),
  rating: decimal('rating', { precision: 2, scale: 1 }).default('5.0'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNo: text('order_no').unique().notNull(),
  customerId: integer('customer_id').references(() => customers.id).notNull(),
  cleanerId: integer('cleaner_id').references(() => cleaners.id),
  serviceType: serviceTypeEnum('service_type').notNull(),
  city: text('city').notNull(),
  address: text('address').notNull(),
  scheduledTime: timestamp('scheduled_time').notNull(),
  duration: integer('duration').default(120),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  status: orderStatusEnum('status').default('pending').notNull(),
  remark: text('remark'),
  assignedBy: integer('assigned_by').references(() => users.id),
  assignedAt: timestamp('assigned_at'),
  completedAt: timestamp('completed_at'),
  inspectedBy: integer('inspected_by').references(() => users.id),
  inspectedAt: timestamp('inspected_at'),
  inspectionRemark: text('inspection_remark'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const photos = pgTable('photos', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id).notNull(),
  url: text('url').notNull(),
  type: text('type').default('completion'),
  uploadedBy: integer('uploaded_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const complaints = pgTable('complaints', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id).notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  evidencePhotos: json('evidence_photos').default(sql`'[]'::json`),
  raisedBy: integer('raised_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const reworks = pgTable('reworks', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id).notNull(),
  reason: reworkReasonEnum('reason').notNull(),
  description: text('description'),
  deadline: timestamp('deadline').notNull(),
  assignedCleanerId: integer('assigned_cleaner_id').references(() => cleaners.id),
  completedAt: timestamp('completed_at'),
  isTimeout: boolean('is_timeout').default(false),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const compensations = pgTable('compensations', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  reason: text('reason').notNull(),
  ruleType: compensationRuleTypeEnum('rule_type').notNull(),
  status: text('status').default('pending'),
  reviewedBy: integer('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at'),
  reviewRemark: text('review_remark'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const compensationRules = pgTable('compensation_rules', {
  id: serial('id').primaryKey(),
  type: compensationRuleTypeEnum('type').unique().notNull(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  baseAmount: decimal('base_amount', { precision: 10, scale: 2 }).notNull(),
  multiplier: decimal('multiplier', { precision: 3, scale: 2 }).default('1.00'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const orderLogs = pgTable('order_logs', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id).notNull(),
  action: text('action').notNull(),
  description: text('description'),
  operatorId: integer('operator_id').references(() => users.id),
  operatorName: text('operator_name'),
  fromStatus: orderStatusEnum('from_status'),
  toStatus: orderStatusEnum('to_status'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Cleaner = typeof cleaners.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Photo = typeof photos.$inferSelect;
export type Complaint = typeof complaints.$inferSelect;
export type Rework = typeof reworks.$inferSelect;
export type Compensation = typeof compensations.$inferSelect;
export type CompensationRule = typeof compensationRules.$inferSelect;
export type OrderLog = typeof orderLogs.$inferSelect;
