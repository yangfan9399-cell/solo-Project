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

ActiveRecord::Schema[8.1].define(version: 2026_06_12_223907) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "attachments", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.string "evidence_type"
    t.string "file_name"
    t.string "file_type"
    t.bigint "grade_correction_id", null: false
    t.bigint "processing_node_id", null: false
    t.datetime "updated_at", null: false
    t.index ["grade_correction_id"], name: "index_attachments_on_grade_correction_id"
    t.index ["processing_node_id"], name: "index_attachments_on_processing_node_id"
  end

  create_table "diff_records", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "field_name"
    t.bigint "grade_correction_id", null: false
    t.text "new_value"
    t.text "old_value"
    t.bigint "operator_id", null: false
    t.bigint "processing_node_id", null: false
    t.datetime "updated_at", null: false
    t.index ["grade_correction_id"], name: "index_diff_records_on_grade_correction_id"
    t.index ["operator_id"], name: "index_diff_records_on_operator_id"
    t.index ["processing_node_id"], name: "index_diff_records_on_processing_node_id"
  end

  create_table "grade_corrections", force: :cascade do |t|
    t.decimal "amount"
    t.string "applicant"
    t.date "application_date"
    t.string "application_no"
    t.text "application_reason"
    t.text "block_reason"
    t.text "conclusion"
    t.decimal "corrected_score"
    t.string "course_code"
    t.string "course_name"
    t.datetime "created_at", null: false
    t.datetime "critical_time"
    t.bigint "current_owner_id"
    t.string "evidence_conclusion"
    t.boolean "notification_confirmed"
    t.decimal "original_score"
    t.text "remedy_path"
    t.string "responsible_party"
    t.string "source"
    t.string "status"
    t.string "student_id"
    t.string "student_name"
    t.datetime "updated_at", null: false
    t.index ["current_owner_id"], name: "index_grade_corrections_on_current_owner_id"
  end

  create_table "processing_nodes", force: :cascade do |t|
    t.text "business_record"
    t.text "content"
    t.datetime "created_at", null: false
    t.bigint "grade_correction_id", null: false
    t.string "node_type"
    t.text "on_site_explanation"
    t.bigint "operator_id", null: false
    t.string "status"
    t.datetime "updated_at", null: false
    t.index ["grade_correction_id"], name: "index_processing_nodes_on_grade_correction_id"
    t.index ["operator_id"], name: "index_processing_nodes_on_operator_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name"
    t.string "password_digest"
    t.string "role"
    t.datetime "updated_at", null: false
  end

  add_foreign_key "attachments", "grade_corrections"
  add_foreign_key "attachments", "processing_nodes"
  add_foreign_key "diff_records", "grade_corrections"
  add_foreign_key "diff_records", "processing_nodes"
  add_foreign_key "diff_records", "users", column: "operator_id"
  add_foreign_key "grade_corrections", "users", column: "current_owner_id"
  add_foreign_key "processing_nodes", "grade_corrections"
  add_foreign_key "processing_nodes", "users", column: "operator_id"
end
