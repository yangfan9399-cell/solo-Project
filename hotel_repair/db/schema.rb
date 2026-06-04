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

ActiveRecord::Schema[8.1].define(version: 2026_06_04_000001) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "approval_escalations", force: :cascade do |t|
    t.bigint "approved_by_id"
    t.bigint "compensation_id", null: false
    t.datetime "created_at", null: false
    t.string "level", default: "senior_manager", null: false
    t.text "reason", null: false
    t.bigint "repair_request_id", null: false
    t.text "review_note"
    t.string "status", default: "pending", null: false
    t.decimal "suggested_amount", precision: 10, scale: 2
    t.datetime "updated_at", null: false
    t.index ["approved_by_id"], name: "index_approval_escalations_on_approved_by_id"
    t.index ["compensation_id"], name: "index_approval_escalations_on_compensation_id"
    t.index ["repair_request_id"], name: "index_approval_escalations_on_repair_request_id"
  end

  create_table "compensations", force: :cascade do |t|
    t.decimal "amount", precision: 10, scale: 2, null: false
    t.bigint "approved_by_id"
    t.text "basis", null: false
    t.text "block_reason"
    t.string "compensation_type", default: "room_fee_discount", null: false
    t.datetime "created_at", null: false
    t.decimal "limit_amount", precision: 10, scale: 2, default: "5000.0", null: false
    t.text "rejection_reason"
    t.bigint "repair_request_id", null: false
    t.string "status", default: "pending", null: false
    t.datetime "updated_at", null: false
    t.index ["approved_by_id"], name: "index_compensations_on_approved_by_id"
    t.index ["repair_request_id"], name: "index_compensations_on_repair_request_id"
  end

  create_table "repair_requests", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "customer_feedback"
    t.string "hotel_full_reason"
    t.bigint "manager_id"
    t.boolean "needs_compensation", default: false, null: false
    t.boolean "needs_transfer", default: false, null: false
    t.bigint "new_room_id"
    t.bigint "original_room_id", null: false
    t.string "repair_category", null: false
    t.text "repair_reason", null: false
    t.bigint "reporter_id", null: false
    t.datetime "resolved_at"
    t.string "status", default: "reported", null: false
    t.string "transfer_suggestion"
    t.datetime "updated_at", null: false
    t.index ["manager_id"], name: "index_repair_requests_on_manager_id"
    t.index ["new_room_id"], name: "index_repair_requests_on_new_room_id"
    t.index ["original_room_id"], name: "index_repair_requests_on_original_room_id"
    t.index ["reporter_id"], name: "index_repair_requests_on_reporter_id"
  end

  create_table "rooms", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "floor", null: false
    t.string "room_number", null: false
    t.string "room_type", default: "standard", null: false
    t.string "status", default: "available", null: false
    t.datetime "updated_at", null: false
    t.index ["room_number"], name: "index_rooms_on_room_number", unique: true
  end

  create_table "status_logs", force: :cascade do |t|
    t.bigint "changed_by_id", null: false
    t.datetime "created_at", null: false
    t.string "from_status"
    t.text "note"
    t.bigint "repair_request_id", null: false
    t.string "to_status", null: false
    t.datetime "updated_at", null: false
    t.index ["changed_by_id"], name: "index_status_logs_on_changed_by_id"
    t.index ["repair_request_id"], name: "index_status_logs_on_repair_request_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.string "name", null: false
    t.string "password_digest", null: false
    t.string "role", default: "front_desk", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "approval_escalations", "compensations"
  add_foreign_key "approval_escalations", "repair_requests"
  add_foreign_key "approval_escalations", "users", column: "approved_by_id"
  add_foreign_key "compensations", "repair_requests"
  add_foreign_key "compensations", "users", column: "approved_by_id"
  add_foreign_key "repair_requests", "rooms", column: "new_room_id"
  add_foreign_key "repair_requests", "rooms", column: "original_room_id"
  add_foreign_key "repair_requests", "users", column: "manager_id"
  add_foreign_key "repair_requests", "users", column: "reporter_id"
  add_foreign_key "status_logs", "repair_requests"
  add_foreign_key "status_logs", "users", column: "changed_by_id"
end
