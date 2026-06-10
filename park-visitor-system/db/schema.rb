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

ActiveRecord::Schema[8.1].define(version: 202406100010) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "blacklists", force: :cascade do |t|
    t.datetime "added_at", null: false
    t.bigint "added_by_id", null: false
    t.datetime "created_at", null: false
    t.boolean "is_active", default: true
    t.string "license_plate", null: false
    t.text "reason", null: false
    t.datetime "updated_at", null: false
    t.index ["added_by_id"], name: "index_blacklists_on_added_by_id"
    t.index ["is_active"], name: "index_blacklists_on_is_active"
    t.index ["license_plate"], name: "index_blacklists_on_license_plate"
  end

  create_table "departments", force: :cascade do |t|
    t.string "code", null: false
    t.datetime "created_at", null: false
    t.string "description"
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.index ["code"], name: "index_departments_on_code", unique: true
  end

  create_table "employees", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "department_id", null: false
    t.string "email"
    t.string "employee_number", null: false
    t.boolean "is_security_guard", default: false
    t.boolean "is_security_supervisor", default: false
    t.string "name", null: false
    t.string "phone"
    t.string "position"
    t.datetime "updated_at", null: false
    t.index ["department_id"], name: "index_employees_on_department_id"
    t.index ["employee_number"], name: "index_employees_on_employee_number", unique: true
  end

  create_table "entrances", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "gate_type", default: "main"
    t.boolean "is_active", default: true
    t.string "location"
    t.string "name", null: false
    t.datetime "updated_at", null: false
  end

  create_table "history_nodes", force: :cascade do |t|
    t.string "action", null: false
    t.bigint "actor_id", null: false
    t.string "actor_type", null: false
    t.datetime "created_at", null: false
    t.text "notes"
    t.datetime "updated_at", null: false
    t.bigint "visit_record_id", null: false
    t.index ["actor_type", "actor_id"], name: "index_history_nodes_on_actor"
    t.index ["created_at"], name: "index_history_nodes_on_created_at"
    t.index ["visit_record_id"], name: "index_history_nodes_on_visit_record_id"
  end

  create_table "reservations", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "entrance_id", null: false
    t.bigint "host_id", null: false
    t.text "host_notes"
    t.text "purpose", null: false
    t.datetime "scheduled_at", null: false
    t.datetime "scheduled_end_at"
    t.integer "status", default: 0
    t.datetime "updated_at", null: false
    t.bigint "vehicle_id", null: false
    t.bigint "visitor_id", null: false
    t.index ["entrance_id"], name: "index_reservations_on_entrance_id"
    t.index ["host_id"], name: "index_reservations_on_host_id"
    t.index ["scheduled_at"], name: "index_reservations_on_scheduled_at"
    t.index ["status"], name: "index_reservations_on_status"
    t.index ["vehicle_id"], name: "index_reservations_on_vehicle_id"
    t.index ["visitor_id"], name: "index_reservations_on_visitor_id"
  end

  create_table "vehicles", force: :cascade do |t|
    t.boolean "active", default: true
    t.string "color"
    t.datetime "created_at", null: false
    t.string "license_plate", null: false
    t.datetime "updated_at", null: false
    t.string "vehicle_type", default: "car"
    t.bigint "visitor_id", null: false
    t.index ["license_plate"], name: "index_vehicles_on_license_plate", unique: true
    t.index ["visitor_id"], name: "index_vehicles_on_visitor_id"
  end

  create_table "visit_records", force: :cascade do |t|
    t.datetime "actual_entry_at"
    t.datetime "actual_exit_at"
    t.text "blocking_reason"
    t.datetime "created_at", null: false
    t.bigint "entry_entrance_id"
    t.bigint "entry_guard_id"
    t.bigint "exit_entrance_id"
    t.bigint "exit_guard_id"
    t.bigint "reservation_id", null: false
    t.integer "status", default: 0
    t.bigint "supervisor_id"
    t.datetime "updated_at", null: false
    t.index ["entry_entrance_id"], name: "index_visit_records_on_entry_entrance_id"
    t.index ["entry_guard_id"], name: "index_visit_records_on_entry_guard_id"
    t.index ["exit_entrance_id"], name: "index_visit_records_on_exit_entrance_id"
    t.index ["exit_guard_id"], name: "index_visit_records_on_exit_guard_id"
    t.index ["reservation_id"], name: "index_visit_records_on_reservation_id"
    t.index ["status"], name: "index_visit_records_on_status"
    t.index ["supervisor_id"], name: "index_visit_records_on_supervisor_id"
  end

  create_table "visitors", force: :cascade do |t|
    t.string "company"
    t.datetime "created_at", null: false
    t.string "email"
    t.string "id_card_number"
    t.string "name", null: false
    t.string "phone", null: false
    t.datetime "updated_at", null: false
    t.index ["phone"], name: "index_visitors_on_phone"
  end

  add_foreign_key "blacklists", "employees", column: "added_by_id"
  add_foreign_key "employees", "departments"
  add_foreign_key "history_nodes", "visit_records"
  add_foreign_key "reservations", "employees", column: "host_id"
  add_foreign_key "reservations", "entrances"
  add_foreign_key "reservations", "vehicles"
  add_foreign_key "reservations", "visitors"
  add_foreign_key "vehicles", "visitors"
  add_foreign_key "visit_records", "employees", column: "entry_guard_id"
  add_foreign_key "visit_records", "employees", column: "exit_guard_id"
  add_foreign_key "visit_records", "employees", column: "supervisor_id"
  add_foreign_key "visit_records", "entrances", column: "entry_entrance_id"
  add_foreign_key "visit_records", "entrances", column: "exit_entrance_id"
  add_foreign_key "visit_records", "reservations"
end
