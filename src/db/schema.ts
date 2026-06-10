import {
  pgTable,
  serial,
  text,
  varchar,
  date,
  timestamp,
  boolean,
  integer
} from 'drizzle-orm/pg-core'

export const suppliers = pgTable('suppliers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  contact: varchar('contact', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 100 }),
  address: text('address'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

export const partCategories = pgTable('part_categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique()
})

export const parts = pgTable('parts', {
  id: serial('id').primaryKey(),
  partNumber: varchar('part_number', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  categoryId: integer('category_id').references(() => partCategories.id),
  unitPrice: varchar('unit_price', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow()
})

export const defectTypes = pgTable('defect_types', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description')
})

export const batches = pgTable('batches', {
  id: serial('id').primaryKey(),
  batchNumber: varchar('batch_number', { length: 50 }).notNull().unique(),
  partId: integer('part_id').references(() => parts.id).notNull(),
  supplierId: integer('supplier_id').references(() => suppliers.id).notNull(),
  productionDate: date('production_date'),
  quantity: integer('quantity').default(0),
  receivedDate: date('received_date'),
  traceable: boolean('traceable').default(true),
  createdAt: timestamp('created_at').defaultNow()
})

export const claimStatus = ['pending', 'supplier_notified', 'supplier_response', 'under_review', 'approved', 'rejected', 'payment_processing', 'completed'] as const

export type ClaimStatus = typeof claimStatus[number]

export const claims = pgTable('claims', {
  id: serial('id').primaryKey(),
  batchId: integer('batch_id').references(() => batches.id).notNull(),
  defectTypeId: integer('defect_type_id').references(() => defectTypes.id).notNull(),
  quantityDefective: integer('quantity_defective').notNull(),
  claimAmount: varchar('claim_amount', { length: 20 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).$type<ClaimStatus>().default('pending'),
  batchTraceable: boolean('batch_traceable').default(true),
  repairDeadline: date('repair_deadline'),
  repairCompleted: boolean('repair_completed').default(false),
  engineerName: varchar('engineer_name', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

export const claimEvidences = pgTable('claim_evidences', {
  id: serial('id').primaryKey(),
  claimId: integer('claim_id').references(() => claims.id).notNull(),
  type: varchar('type', { length: 50 }),
  url: text('url'),
  description: text('description'),
  uploadedAt: timestamp('uploaded_at').defaultNow()
})

export const claimHistory = pgTable('claim_history', {
  id: serial('id').primaryKey(),
  claimId: integer('claim_id').references(() => claims.id).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  comment: text('comment'),
  operator: varchar('operator', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow()
})

export const supplierResponses = pgTable('supplier_responses', {
  id: serial('id').primaryKey(),
  claimId: integer('claim_id').references(() => claims.id).notNull().unique(),
  responseType: varchar('response_type', { length: 50 }).notNull(),
  comment: text('comment'),
  evidenceUrl: text('evidence_url'),
  createdAt: timestamp('created_at').defaultNow()
})
