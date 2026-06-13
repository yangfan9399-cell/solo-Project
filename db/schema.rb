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

ActiveRecord::Schema[8.1].define(version: 2026_06_13_183000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.bigint "record_id", null: false
    t.string "record_type", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.string "content_type"
    t.datetime "created_at", null: false
    t.string "filename", null: false
    t.string "key", null: false
    t.text "metadata"
    t.string "service_name", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "correction_records", force: :cascade do |t|
    t.text "business_record"
    t.text "correction_measure"
    t.text "correction_result"
    t.datetime "correction_time"
    t.datetime "created_at", null: false
    t.bigint "handler_id"
    t.bigint "inspection_record_id"
    t.string "operator"
    t.text "remark"
    t.text "site_description"
    t.datetime "updated_at", null: false
    t.bigint "workflow_node_id"
    t.index ["handler_id"], name: "index_correction_records_on_handler_id"
    t.index ["inspection_record_id"], name: "index_correction_records_on_inspection_record_id"
    t.index ["workflow_node_id"], name: "index_correction_records_on_workflow_node_id"
  end

  create_table "evidence_attachments", force: :cascade do |t|
    t.string "attachment_type"
    t.datetime "created_at", null: false
    t.text "description"
    t.string "file_name"
    t.bigint "file_size"
    t.bigint "inspection_record_id"
    t.string "operator"
    t.string "shoot_location"
    t.datetime "shoot_time"
    t.datetime "updated_at", null: false
    t.bigint "uploader_id"
    t.bigint "workflow_node_id"
    t.index ["inspection_record_id"], name: "index_evidence_attachments_on_inspection_record_id"
    t.index ["uploader_id"], name: "index_evidence_attachments_on_uploader_id"
    t.index ["workflow_node_id"], name: "index_evidence_attachments_on_workflow_node_id"
  end

  create_table "inspection_records", force: :cascade do |t|
    t.datetime "accepted_at"
    t.decimal "amount"
    t.datetime "archived_at"
    t.text "basis"
    t.text "block_reason"
    t.text "conclusion"
    t.string "contact_phone"
    t.datetime "created_at", null: false
    t.string "current_state"
    t.datetime "deadline"
    t.text "defect_description"
    t.string "defect_level"
    t.string "defect_type"
    t.string "department"
    t.text "description"
    t.jsonb "diff_fields"
    t.string "evidence_conclusion"
    t.decimal "fine_amount", default: "0.0"
    t.bigint "handler_id"
    t.datetime "inspection_time"
    t.datetime "processing_at"
    t.string "record_no"
    t.datetime "rejected_at"
    t.text "remedy_path"
    t.string "responsible_party"
    t.string "responsible_person"
    t.string "responsible_unit"
    t.text "review_comment"
    t.datetime "review_pending_at"
    t.bigint "reviewer_id"
    t.datetime "reviewing_at"
    t.decimal "reward_amount", default: "0.0"
    t.string "sample_type"
    t.integer "score_after"
    t.integer "score_before"
    t.string "source"
    t.string "toilet_address"
    t.string "toilet_name"
    t.datetime "updated_at", null: false
    t.index ["handler_id"], name: "index_inspection_records_on_handler_id"
    t.index ["record_no"], name: "index_inspection_records_on_record_no"
    t.index ["reviewer_id"], name: "index_inspection_records_on_reviewer_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "department"
    t.string "email"
    t.string "name"
    t.string "password_digest"
    t.string "phone"
    t.string "role"
    t.datetime "updated_at", null: false
    t.string "username", null: false
    t.index ["username"], name: "index_users_on_username", unique: true
  end

  create_table "versions", force: :cascade do |t|
    t.datetime "created_at"
    t.string "event", null: false
    t.bigint "item_id", null: false
    t.string "item_type", null: false
    t.text "object"
    t.string "whodunnit"
    t.index ["item_type", "item_id"], name: "index_versions_on_item_type_and_item_id"
  end

  create_table "workflow_nodes", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.jsonb "diff_fields"
    t.string "event"
    t.string "from_state"
    t.bigint "inspection_record_id"
    t.string "node_type"
    t.bigint "operator_id"
    t.text "remark"
    t.string "to_state"
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["inspection_record_id"], name: "index_workflow_nodes_on_inspection_record_id"
    t.index ["operator_id"], name: "index_workflow_nodes_on_operator_id"
    t.index ["user_id"], name: "index_workflow_nodes_on_user_id"
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
end
