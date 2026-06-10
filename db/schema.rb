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

ActiveRecord::Schema[8.1].define(version: 2026_06_10_075551) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "licenses", force: :cascade do |t|
    t.text "authorized_channels"
    t.string "contract_file"
    t.datetime "created_at", null: false
    t.date "end_date"
    t.string "license_type"
    t.string "licensor"
    t.bigint "material_id", null: false
    t.string "risk_reason"
    t.date "start_date"
    t.string "status"
    t.datetime "updated_at", null: false
    t.index ["material_id"], name: "index_licenses_on_material_id"
  end

  create_table "materials", force: :cascade do |t|
    t.string "copyright_holder"
    t.datetime "created_at", null: false
    t.bigint "created_by_id", null: false
    t.text "description"
    t.string "file_url"
    t.string "material_type"
    t.string "name"
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_materials_on_created_by_id"
  end

  create_table "review_logs", force: :cascade do |t|
    t.text "comment"
    t.datetime "created_at", null: false
    t.string "review_type"
    t.datetime "reviewed_at"
    t.bigint "reviewer_id", null: false
    t.string "status"
    t.datetime "updated_at", null: false
    t.bigint "usage_scenario_id", null: false
    t.index ["reviewer_id"], name: "index_review_logs_on_reviewer_id"
    t.index ["usage_scenario_id"], name: "index_review_logs_on_usage_scenario_id"
  end

  create_table "usage_scenarios", force: :cascade do |t|
    t.string "approval_status"
    t.bigint "bound_by_id", null: false
    t.string "channel"
    t.string "column_name"
    t.datetime "created_at", null: false
    t.bigint "license_id"
    t.bigint "material_id", null: false
    t.string "status"
    t.datetime "updated_at", null: false
    t.text "usage_scope"
    t.index ["bound_by_id"], name: "index_usage_scenarios_on_bound_by_id"
    t.index ["license_id"], name: "index_usage_scenarios_on_license_id"
    t.index ["material_id"], name: "index_usage_scenarios_on_material_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "department"
    t.string "email"
    t.string "name"
    t.string "role"
    t.datetime "updated_at", null: false
  end

  add_foreign_key "licenses", "materials"
  add_foreign_key "materials", "users", column: "created_by_id"
  add_foreign_key "review_logs", "usage_scenarios"
  add_foreign_key "review_logs", "users", column: "reviewer_id"
  add_foreign_key "usage_scenarios", "licenses"
  add_foreign_key "usage_scenarios", "materials"
  add_foreign_key "usage_scenarios", "users", column: "bound_by_id"
end
