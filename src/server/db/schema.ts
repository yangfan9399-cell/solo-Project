import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  decimal,
  date,
  timestamp,
} from 'drizzle-orm/pg-core'

export const departments = pgTable('departments', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 20 }).unique().notNull(),
})

export const assetCategories = pgTable('asset_categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 20 }).unique().notNull(),
})

export const assets = pgTable('assets', {
  id: serial('id').primaryKey(),
  assetNo: varchar('asset_no', { length: 50 }).unique().notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  categoryId: integer('category_id')
    .notNull()
    .references(() => assetCategories.id),
  departmentId: integer('department_id')
    .notNull()
    .references(() => departments.id),
  location: varchar('location', { length: 200 }),
  userId: varchar('user_id', { length: 50 }),
  userName: varchar('user_name', { length: 100 }),
  purchaseDate: date('purchase_date').notNull(),
  purchasePrice: decimal('purchase_price', { precision: 12, scale: 2 }).notNull(),
  bookValue: decimal('book_value', { precision: 12, scale: 2 }).notNull(),
  tagNumber: varchar('tag_number', { length: 50 }).unique(),
  status: varchar('status', { length: 20 })
    .notNull()
    .default('in_use'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const discrepancyTypes = pgTable('discrepancy_types', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  code: varchar('code', { length: 20 }).unique().notNull(),
  description: text('description'),
})

export const inventoryRecords = pgTable('inventory_records', {
  id: serial('id').primaryKey(),
  assetId: integer('asset_id')
    .notNull()
    .references(() => assets.id),
  inventoryDate: date('inventory_date').notNull(),
  discrepancyTypeId: integer('discrepancy_type_id').references(
    () => discrepancyTypes.id
  ),
  actualStatus: varchar('actual_status', { length: 50 }),
  actualLocation: varchar('actual_location', { length: 200 }),
  actualUser: varchar('actual_user', { length: 100 }),
  photoUrl: varchar('photo_url', { length: 500 }),
  remarks: text('remarks'),
  recorderId: varchar('recorder_id', { length: 50 }).notNull(),
  recorderName: varchar('recorder_name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const disposalProcess = pgTable('disposal_process', {
  id: serial('id').primaryKey(),
  inventoryRecordId: integer('inventory_record_id')
    .notNull()
    .references(() => inventoryRecords.id),
  processType: varchar('process_type', { length: 20 }).notNull(),
  departmentRemark: text('department_remark'),
  departmentApprovedAt: timestamp('department_approved_at'),
  departmentApproverId: varchar('department_approver_id', { length: 50 }),
  departmentApproverName: varchar('department_approver_name', { length: 100 }),
  financeRemark: text('finance_remark'),
  financeApprovedAt: timestamp('finance_approved_at'),
  financeApproverId: varchar('finance_approver_id', { length: 50 }),
  financeApproverName: varchar('finance_approver_name', { length: 100 }),
  supervisorRemark: text('supervisor_remark'),
  supervisorApprovedAt: timestamp('supervisor_approved_at'),
  supervisorApproverId: varchar('supervisor_approver_id', { length: 50 }),
  supervisorApproverName: varchar('supervisor_approver_name', { length: 100 }),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const transferRecords = pgTable('transfer_records', {
  id: serial('id').primaryKey(),
  disposalProcessId: integer('disposal_process_id')
    .notNull()
    .references(() => disposalProcess.id),
  fromDepartmentId: integer('from_department_id')
    .notNull()
    .references(() => departments.id),
  toDepartmentId: integer('to_department_id')
    .notNull()
    .references(() => departments.id),
  transferDate: date('transfer_date'),
  remarks: text('remarks'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const accountabilityRecords = pgTable('accountability_records', {
  id: serial('id').primaryKey(),
  inventoryRecordId: integer('inventory_record_id')
    .notNull()
    .references(() => inventoryRecords.id),
  responsibleUserId: varchar('responsible_user_id', { length: 50 }).notNull(),
  responsibleUserName: varchar('responsible_user_name', { length: 100 }).notNull(),
  investigationResult: text('investigation_result'),
  compensationAmount: decimal('compensation_amount', { precision: 12, scale: 2 }),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})