# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_06_12_155201) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "diff_snapshots", force: :cascade do |t|
    t.text "after_value"
    t.text "before_value"
    t.datetime "created_at", null: false
    t.integer "diff_type", default: 0
    t.bigint "fault_record_id", null: false
    t.string "field_name", null: false
    t.datetime "updated_at", null: false
    t.bigint "workflow_node_id", null: false
    t.index ["diff_type"], name: "index_diff_snapshots_on_diff_type"
    t.index ["fault_record_id"], name: "index_diff_snapshots_on_fault_record_id"
    t.index ["field_name"], name: "index_diff_snapshots_on_field_name"
    t.index ["workflow_node_id"], name: "index_diff_snapshots_on_workflow_node_id"
  end

  create_table "evidence_attachments", force: :cascade do |t|
    t.integer "attachment_type", default: 0
    t.string "content_type"
    t.datetime "created_at", null: false
    t.text "description"
    t.bigint "fault_record_id", null: false
    t.string "file_name"
    t.bigint "file_size"
    t.datetime "updated_at", null: false
    t.integer "uploaded_by_id"
    t.bigint "workflow_node_id"
    t.index ["attachment_type"], name: "index_evidence_attachments_on_attachment_type"
    t.index ["fault_record_id"], name: "index_evidence_attachments_on_fault_record_id"
    t.index ["uploaded_by_id"], name: "index_evidence_attachments_on_uploaded_by_id"
    t.index ["workflow_node_id"], name: "index_evidence_attachments_on_workflow_node_id"
  end

  create_table "fault_records", force: :cascade do |t|
    t.integer "abnormal_type", default: 0
    t.decimal "actual_cost", precision: 12, scale: 2, default: "0.0"
    t.datetime "actual_end_at"
    t.datetime "actual_start_at"
    t.text "basis_doc"
    t.text "blocking_reason"
    t.text "business_record"
    t.text "conclusion"
    t.datetime "created_at", null: false
    t.integer "current_owner_id"
    t.integer "current_status", default: 0, null: false
    t.decimal "estimated_cost", precision: 12, scale: 2, default: "0.0"
    t.text "fault_description"
    t.integer "fault_level", default: 0
    t.integer "fault_type", default: 0
    t.boolean "handler_qualified", default: true
    t.boolean "is_archived", default: false, null: false
    t.string "line_name"
    t.datetime "maintenance_window_end"
    t.datetime "maintenance_window_start"
    t.boolean "notified_confirmation", default: false
    t.text "on_site_description"
    t.string "platform_door_no"
    t.text "remediation_path"
    t.datetime "reported_at"
    t.integer "reported_by_id"
    t.string "responsible_person"
    t.string "responsible_unit"
    t.integer "source_type", default: 0, null: false
    t.string "station_name"
    t.string "ticket_no", null: false
    t.datetime "updated_at", null: false
    t.index ["abnormal_type"], name: "index_fault_records_on_abnormal_type"
    t.index ["current_owner_id"], name: "index_fault_records_on_current_owner_id"
    t.index ["current_status"], name: "index_fault_records_on_current_status"
    t.index ["is_archived"], name: "index_fault_records_on_is_archived"
    t.index ["line_name", "station_name"], name: "index_fault_records_on_line_name_and_station_name"
    t.index ["reported_at"], name: "index_fault_records_on_reported_at"
    t.index ["reported_by_id"], name: "index_fault_records_on_reported_by_id"
    t.index ["ticket_no"], name: "index_fault_records_on_ticket_no", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.string "name", null: false
    t.string "password_digest"
    t.integer "role", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["role"], name: "index_users_on_role"
  end

  create_table "workflow_nodes", force: :cascade do |t|
    t.integer "action_type", default: 0
    t.text "comment"
    t.datetime "created_at", null: false
    t.bigint "fault_record_id", null: false
    t.integer "from_status"
    t.integer "node_type", default: 0, null: false
    t.integer "operator_id"
    t.datetime "processed_at"
    t.jsonb "snapshot_data", default: {}
    t.integer "to_status"
    t.datetime "updated_at", null: false
    t.index ["fault_record_id"], name: "index_workflow_nodes_on_fault_record_id"
    t.index ["node_type"], name: "index_workflow_nodes_on_node_type"
    t.index ["operator_id"], name: "index_workflow_nodes_on_operator_id"
    t.index ["processed_at"], name: "index_workflow_nodes_on_processed_at"
    t.index ["snapshot_data"], name: "index_workflow_nodes_on_snapshot_data", using: :gin
    t.index ["to_status"], name: "index_workflow_nodes_on_to_status"
  end

  add_foreign_key "diff_snapshots", "fault_records"
  add_foreign_key "diff_snapshots", "workflow_nodes"
  add_foreign_key "evidence_attachments", "fault_records"
  add_foreign_key "evidence_attachments", "workflow_nodes"
  add_foreign_key "workflow_nodes", "fault_records"
end
