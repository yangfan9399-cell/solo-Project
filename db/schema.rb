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

ActiveRecord::Schema[8.1].define(version: 2026_06_11_101600) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "fleets", force: :cascade do |t|
    t.string "code"
    t.string "contact"
    t.datetime "created_at", null: false
    t.string "name"
    t.string "phone"
    t.datetime "updated_at", null: false
  end

  create_table "fuel_records", force: :cascade do |t|
    t.string "abnormal_note"
    t.datetime "created_at", null: false
    t.decimal "end_mileage"
    t.decimal "fuel_amount"
    t.decimal "fuel_consumption"
    t.decimal "fuel_cost"
    t.string "fuel_type"
    t.string "gas_station"
    t.boolean "is_abnormal"
    t.text "notes"
    t.date "record_date"
    t.string "recorded_by"
    t.decimal "start_mileage"
    t.datetime "updated_at", null: false
    t.bigint "vehicle_id", null: false
    t.index ["vehicle_id"], name: "index_fuel_records_on_vehicle_id"
  end

  create_table "history_nodes", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.datetime "happened_at"
    t.jsonb "metadata"
    t.string "node_type"
    t.string "operator"
    t.string "operator_role"
    t.string "title"
    t.datetime "updated_at", null: false
    t.bigint "vehicle_id", null: false
    t.index ["vehicle_id"], name: "index_history_nodes_on_vehicle_id"
  end

  create_table "inspection_records", force: :cascade do |t|
    t.string "brakes_status"
    t.string "cleaning_status"
    t.datetime "created_at", null: false
    t.datetime "inspection_date"
    t.string "inspection_type"
    t.string "inspector"
    t.text "issues_found"
    t.string "lights_status"
    t.string "oil_status"
    t.string "overall_result"
    t.text "remarks"
    t.string "steering_status"
    t.text "suggestions"
    t.string "tires_status"
    t.datetime "updated_at", null: false
    t.bigint "vehicle_id", null: false
    t.string "water_status"
    t.index ["vehicle_id"], name: "index_inspection_records_on_vehicle_id"
  end

  create_table "maintenance_items", force: :cascade do |t|
    t.datetime "completed_at"
    t.string "completed_by"
    t.datetime "created_at", null: false
    t.text "description"
    t.boolean "is_required"
    t.bigint "maintenance_plan_id", null: false
    t.string "name"
    t.string "status"
    t.datetime "updated_at", null: false
    t.index ["maintenance_plan_id"], name: "index_maintenance_items_on_maintenance_plan_id"
  end

  create_table "maintenance_plans", force: :cascade do |t|
    t.datetime "completed_at"
    t.datetime "created_at", null: false
    t.string "maintenance_type"
    t.text "notes"
    t.date "planned_date"
    t.string "scheduled_by"
    t.decimal "scheduled_mileage"
    t.string "status"
    t.datetime "updated_at", null: false
    t.bigint "vehicle_id", null: false
    t.index ["vehicle_id"], name: "index_maintenance_plans_on_vehicle_id"
  end

  create_table "repair_records", force: :cascade do |t|
    t.string "abnormal_reason"
    t.datetime "created_at", null: false
    t.integer "decommission_days"
    t.text "diagnosis"
    t.date "end_date"
    t.boolean "is_urgent"
    t.text "issue_description"
    t.decimal "labor_cost"
    t.string "location"
    t.text "notes"
    t.decimal "parts_cost"
    t.string "repair_station"
    t.string "repair_type"
    t.date "report_date"
    t.text "solution"
    t.date "start_date"
    t.string "status"
    t.string "technician"
    t.decimal "total_cost"
    t.datetime "updated_at", null: false
    t.bigint "vehicle_id", null: false
    t.index ["vehicle_id"], name: "index_repair_records_on_vehicle_id"
  end

  create_table "routes", force: :cascade do |t|
    t.string "area"
    t.string "code"
    t.datetime "created_at", null: false
    t.decimal "distance"
    t.integer "estimated_duration"
    t.string "name"
    t.datetime "updated_at", null: false
  end

  create_table "trip_records", force: :cascade do |t|
    t.datetime "actual_departure_time"
    t.datetime "actual_return_time"
    t.datetime "created_at", null: false
    t.string "driver_name"
    t.decimal "end_mileage"
    t.boolean "is_active"
    t.datetime "planned_departure_time"
    t.datetime "planned_return_time"
    t.text "review_note"
    t.string "review_status"
    t.datetime "reviewed_at"
    t.string "reviewer"
    t.bigint "route_id", null: false
    t.decimal "start_mileage"
    t.datetime "updated_at", null: false
    t.bigint "vehicle_id", null: false
    t.index ["route_id"], name: "index_trip_records_on_route_id"
    t.index ["vehicle_id"], name: "index_trip_records_on_vehicle_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "department"
    t.string "employee_id"
    t.bigint "fleet_id"
    t.string "name"
    t.string "phone"
    t.string "role"
    t.string "status"
    t.datetime "updated_at", null: false
    t.index ["employee_id"], name: "index_users_on_employee_id", unique: true
    t.index ["fleet_id"], name: "index_users_on_fleet_id"
  end

  create_table "vehicle_models", force: :cascade do |t|
    t.string "brand"
    t.string "category"
    t.datetime "created_at", null: false
    t.decimal "fuel_tank_capacity"
    t.integer "maintenance_day_interval"
    t.integer "maintenance_km_interval"
    t.string "name"
    t.decimal "standard_fuel_consumption"
    t.datetime "updated_at", null: false
  end

  create_table "vehicles", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.decimal "current_mileage"
    t.string "driver_name"
    t.bigint "fleet_id", null: false
    t.date "last_maintenance_date"
    t.date "manufacture_date"
    t.date "next_maintenance_date"
    t.string "plate_number"
    t.date "purchase_date"
    t.text "remarks"
    t.bigint "route_id", null: false
    t.string "status"
    t.datetime "updated_at", null: false
    t.bigint "vehicle_model_id", null: false
    t.string "vin_number"
    t.index ["fleet_id"], name: "index_vehicles_on_fleet_id"
    t.index ["plate_number"], name: "index_vehicles_on_plate_number", unique: true
    t.index ["route_id"], name: "index_vehicles_on_route_id"
    t.index ["vehicle_model_id"], name: "index_vehicles_on_vehicle_model_id"
  end

  add_foreign_key "fuel_records", "vehicles"
  add_foreign_key "history_nodes", "vehicles"
  add_foreign_key "inspection_records", "vehicles"
  add_foreign_key "maintenance_items", "maintenance_plans"
  add_foreign_key "maintenance_plans", "vehicles"
  add_foreign_key "repair_records", "vehicles"
  add_foreign_key "trip_records", "routes"
  add_foreign_key "trip_records", "vehicles"
  add_foreign_key "users", "fleets"
  add_foreign_key "vehicles", "fleets"
  add_foreign_key "vehicles", "routes"
  add_foreign_key "vehicles", "vehicle_models"
end
