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

ActiveRecord::Schema[8.1].define(version: 2024_01_01_000006) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "authorizations", force: :cascade do |t|
    t.string "auth_type", null: false
    t.datetime "created_at", null: false
    t.string "file_path", null: false
    t.string "receiver_id_card", null: false
    t.string "receiver_name", null: false
    t.text "remark"
    t.bigint "report_id", null: false
    t.datetime "updated_at", null: false
    t.index ["report_id", "auth_type"], name: "index_authorizations_on_report_id_and_auth_type"
    t.index ["report_id"], name: "index_authorizations_on_report_id"
  end

  create_table "exams", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.date "exam_date", null: false
    t.string "exam_no"
    t.string "exam_type", null: false
    t.bigint "patient_id", null: false
    t.datetime "updated_at", null: false
    t.index ["patient_id", "exam_date"], name: "index_exams_on_patient_id_and_exam_date"
    t.index ["patient_id"], name: "index_exams_on_patient_id"
  end

  create_table "history_records", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "operation", null: false
    t.string "operator", null: false
    t.text "remark"
    t.bigint "report_id", null: false
    t.string "status_after"
    t.string "status_before"
    t.datetime "updated_at", null: false
    t.index ["report_id", "created_at"], name: "index_history_records_on_report_id_and_created_at"
    t.index ["report_id"], name: "index_history_records_on_report_id"
  end

  create_table "patients", force: :cascade do |t|
    t.string "address"
    t.date "birth_date"
    t.datetime "created_at", null: false
    t.string "gender"
    t.string "id_card", null: false
    t.string "name", null: false
    t.string "phone", null: false
    t.datetime "updated_at", null: false
    t.index ["id_card"], name: "index_patients_on_id_card", unique: true
    t.index ["phone"], name: "index_patients_on_phone"
  end

  create_table "reports", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "exam_id", null: false
    t.date "issue_date", null: false
    t.string "pickup_type"
    t.integer "reissue_count", default: 0
    t.text "remark"
    t.string "report_no", null: false
    t.string "status", default: "generated", null: false
    t.datetime "updated_at", null: false
    t.index ["exam_id"], name: "index_reports_on_exam_id"
    t.index ["issue_date"], name: "index_reports_on_issue_date"
    t.index ["report_no"], name: "index_reports_on_report_no", unique: true
    t.index ["status"], name: "index_reports_on_status"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.string "password_digest", null: false
    t.string "role", default: "receptionist", null: false
    t.datetime "updated_at", null: false
    t.string "username", null: false
    t.index ["role"], name: "index_users_on_role"
    t.index ["username"], name: "index_users_on_username", unique: true
  end

  add_foreign_key "authorizations", "reports"
  add_foreign_key "exams", "patients"
  add_foreign_key "history_records", "reports"
  add_foreign_key "reports", "exams"
end
