import { pgTable, text, integer, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export type UserRole = 'sales' | 'designer' | 'customer' | 'production_manager';
export type OrderStatus =
  | 'draft'
  | 'submitted'
  | 'proof_uploaded'
  | 'customer_confirmed'
  | 'customer_rejected'
  | 'production_review'
  | 'order_placed'
  | 'order_returned';
export type RejectReason = 'color_deviation' | 'design_issue' | 'content_error' | 'other';
export type ProductCategory = 'business_card' | 'flyer' | 'brochure' | 'poster' | 'packaging' | 'booklet';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  role: text('role').$type<UserRole>().notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  contactPerson: varchar('contact_person', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 50 }).notNull(),
  email: varchar('email', { length: 255 }),
  address: text('address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNo: varchar('order_no', { length: 50 }).notNull().unique(),
  customerId: integer('customer_id').notNull().references(() => customers.id),
  productName: varchar('product_name', { length: 200 }).notNull(),
  category: text('category').$type<ProductCategory>().notNull(),
  quantity: integer('quantity').notNull(),
  paperType: varchar('paper_type', { length: 100 }).notNull(),
  paperWeight: varchar('paper_weight', { length: 50 }),
  size: varchar('size', { length: 100 }).notNull(),
  craft: varchar('craft', { length: 200 }).notNull(),
  colorMode: varchar('color_mode', { length: 50 }).notNull(),
  description: text('description'),
  status: text('status').$type<OrderStatus>().default('draft').notNull(),
  deliveryDate: timestamp('delivery_date').notNull(),
  originalDeliveryDate: timestamp('original_delivery_date'),
  salesId: integer('sales_id').notNull().references(() => users.id),
  designerId: integer('designer_id').references(() => users.id),
  rejectReason: text('reject_reason').$type<RejectReason>(),
  rejectRemark: text('reject_remark'),
  returnReason: text('return_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const proofs = pgTable('proofs', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => orders.id),
  version: integer('version').notNull().default(1),
  imageUrl: varchar('image_url', { length: 500 }).notNull(),
  remark: text('remark'),
  uploadedBy: integer('uploaded_by').notNull().references(() => users.id),
  colorDeviation: varchar('color_deviation', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const orderHistory = pgTable('order_history', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => orders.id),
  status: text('status').$type<OrderStatus>().notNull(),
  operatorId: integer('operator_id').references(() => users.id),
  operatorName: varchar('operator_name', { length: 100 }).notNull(),
  remark: text('remark'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
