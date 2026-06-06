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

ActiveRecord::Schema[8.1].define(version: 2024_01_01_000007) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "borrow_records", force: :cascade do |t|
    t.bigint "applicant_id"
    t.bigint "auditor_id"
    t.datetime "checked_out_at"
    t.datetime "confirmed_at"
    t.bigint "confirmer_id"
    t.datetime "created_at", null: false
    t.bigint "crew_id", null: false
    t.text "damage_description"
    t.integer "damage_type"
    t.date "expected_end_date", null: false
    t.date "expected_start_date", null: false
    t.bigint "prop_id", null: false
    t.text "purpose"
    t.text "return_notes"
    t.datetime "returned_at"
    t.integer "status", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["applicant_id"], name: "index_borrow_records_on_applicant_id"
    t.index ["auditor_id"], name: "index_borrow_records_on_auditor_id"
    t.index ["confirmer_id"], name: "index_borrow_records_on_confirmer_id"
    t.index ["crew_id"], name: "index_borrow_records_on_crew_id"
    t.index ["prop_id", "expected_start_date", "expected_end_date"], name: "index_borrow_records_on_prop_and_dates"
    t.index ["prop_id"], name: "index_borrow_records_on_prop_id"
    t.index ["status"], name: "index_borrow_records_on_status"
  end

  create_table "compensations", force: :cascade do |t|
    t.decimal "amount", precision: 10, scale: 2, null: false
    t.text "basis"
    t.bigint "borrow_record_id", null: false
    t.datetime "created_at", null: false
    t.text "dispute_reason"
    t.datetime "disputed_at"
    t.bigint "handler_id"
    t.datetime "paid_at"
    t.text "resolution"
    t.datetime "resolved_at"
    t.integer "status", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["borrow_record_id"], name: "index_compensations_on_borrow_record_id"
    t.index ["handler_id"], name: "index_compensations_on_handler_id"
    t.index ["status"], name: "index_compensations_on_status"
  end

  create_table "crews", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.date "end_date"
    t.bigint "leader_id"
    t.string "name", null: false
    t.string "play_name"
    t.date "start_date"
    t.datetime "updated_at", null: false
    t.index ["leader_id"], name: "index_crews_on_leader_id"
  end

  create_table "inspection_records", force: :cascade do |t|
    t.bigint "borrow_record_id", null: false
    t.integer "condition", null: false
    t.datetime "created_at", null: false
    t.integer "inspection_type", null: false
    t.bigint "inspector_id"
    t.text "issues_found"
    t.text "notes"
    t.datetime "updated_at", null: false
    t.index ["borrow_record_id"], name: "index_inspection_records_on_borrow_record_id"
    t.index ["inspection_type"], name: "index_inspection_records_on_inspection_type"
    t.index ["inspector_id"], name: "index_inspection_records_on_inspector_id"
  end

  create_table "props", force: :cascade do |t|
    t.string "category", null: false
    t.string "code"
    t.datetime "created_at", null: false
    t.integer "damage_count", default: 0
    t.text "description"
    t.string "name", null: false
    t.text "notes"
    t.string "photo_url"
    t.integer "status", default: 0, null: false
    t.integer "total_borrow_count", default: 0
    t.datetime "updated_at", null: false
    t.decimal "value", precision: 10, scale: 2
    t.index ["category"], name: "index_props_on_category"
    t.index ["status"], name: "index_props_on_status"
  end

  create_table "repair_records", force: :cascade do |t|
    t.bigint "borrow_record_id"
    t.decimal "cost", precision: 10, scale: 2
    t.datetime "created_at", null: false
    t.text "damage_description"
    t.date "expected_finish_date"
    t.date "finished_date"
    t.bigint "handler_id"
    t.bigint "prop_id", null: false
    t.text "repair_method"
    t.date "start_date"
    t.integer "status", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["borrow_record_id"], name: "index_repair_records_on_borrow_record_id"
    t.index ["handler_id"], name: "index_repair_records_on_handler_id"
    t.index ["prop_id"], name: "index_repair_records_on_prop_id"
    t.index ["status"], name: "index_repair_records_on_status"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email"
    t.string "name", null: false
    t.string "phone"
    t.integer "role", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["role"], name: "index_users_on_role"
  end

  add_foreign_key "borrow_records", "crews"
  add_foreign_key "borrow_records", "props"
  add_foreign_key "borrow_records", "users", column: "applicant_id"
  add_foreign_key "borrow_records", "users", column: "auditor_id"
  add_foreign_key "borrow_records", "users", column: "confirmer_id"
  add_foreign_key "compensations", "borrow_records"
  add_foreign_key "compensations", "users", column: "handler_id"
  add_foreign_key "crews", "users", column: "leader_id"
  add_foreign_key "inspection_records", "borrow_records"
  add_foreign_key "inspection_records", "users", column: "inspector_id"
  add_foreign_key "repair_records", "borrow_records"
  add_foreign_key "repair_records", "props"
  add_foreign_key "repair_records", "users", column: "handler_id"
end
