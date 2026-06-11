import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
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

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  role: text('role').$type<UserRole>().notNull(),
  email: text('email').notNull().unique(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const customers = sqliteTable('customers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  contactPerson: text('contact_person').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  address: text('address'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderNo: text('order_no').notNull().unique(),
  customerId: integer('customer_id').notNull().references(() => customers.id),
  productName: text('product_name').notNull(),
  category: text('category').$type<ProductCategory>().notNull(),
  quantity: integer('quantity').notNull(),
  paperType: text('paper_type').notNull(),
  paperWeight: text('paper_weight'),
  size: text('size').notNull(),
  craft: text('craft').notNull(),
  colorMode: text('color_mode').notNull(),
  description: text('description'),
  status: text('status').$type<OrderStatus>().default('draft').notNull(),
  deliveryDate: text('delivery_date').notNull(),
  originalDeliveryDate: text('original_delivery_date'),
  salesId: integer('sales_id').notNull().references(() => users.id),
  designerId: integer('designer_id').references(() => users.id),
  rejectReason: text('reject_reason').$type<RejectReason>(),
  rejectRemark: text('reject_remark'),
  returnReason: text('return_reason'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const proofs = sqliteTable('proofs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id').notNull().references(() => orders.id),
  version: integer('version').notNull().default(1),
  imageUrl: text('image_url').notNull(),
  remark: text('remark'),
  uploadedBy: integer('uploaded_by').notNull().references(() => users.id),
  colorDeviation: text('color_deviation'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const orderHistory = sqliteTable('order_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id').notNull().references(() => orders.id),
  status: text('status').$type<OrderStatus>().notNull(),
  operatorId: integer('operator_id').references(() => users.id),
  operatorName: text('operator_name').notNull(),
  remark: text('remark'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});
