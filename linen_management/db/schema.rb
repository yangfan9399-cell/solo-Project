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

ActiveRecord::Schema[8.1].define(version: 2026_06_09_064419) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "damage_claims", force: :cascade do |t|
    t.boolean "confirmed", default: false
    t.datetime "confirmed_at"
    t.bigint "confirmed_by_id"
    t.datetime "created_at", null: false
    t.bigint "linen_batch_id", null: false
    t.bigint "linen_type_id", null: false
    t.integer "quantity", default: 0
    t.string "reason"
    t.decimal "total_amount", precision: 10, scale: 2
    t.decimal "unit_price", precision: 10, scale: 2
    t.datetime "updated_at", null: false
    t.index ["confirmed_by_id"], name: "index_damage_claims_on_confirmed_by_id"
    t.index ["linen_batch_id"], name: "index_damage_claims_on_linen_batch_id"
    t.index ["linen_type_id"], name: "index_damage_claims_on_linen_type_id"
    t.index ["reason"], name: "index_damage_claims_on_reason"
  end

  create_table "hotels", force: :cascade do |t|
    t.string "address"
    t.string "contact_person"
    t.datetime "created_at", null: false
    t.string "name"
    t.string "phone"
    t.datetime "updated_at", null: false
  end

  create_table "linen_batches", force: :cascade do |t|
    t.string "batch_number"
    t.datetime "created_at", null: false
    t.boolean "discrepancy_confirmed_by_hotel", default: false
    t.boolean "discrepancy_confirmed_by_laundry", default: false
    t.bigint "finance_user_id"
    t.datetime "handover_at"
    t.bigint "handover_user_id"
    t.bigint "hotel_id", null: false
    t.datetime "inspected_at"
    t.bigint "inspector_id"
    t.text "notes"
    t.datetime "return_at"
    t.bigint "return_user_id"
    t.datetime "settled_at"
    t.string "status", default: "pending"
    t.datetime "updated_at", null: false
    t.index ["batch_number"], name: "index_linen_batches_on_batch_number", unique: true
    t.index ["finance_user_id"], name: "index_linen_batches_on_finance_user_id"
    t.index ["handover_user_id"], name: "index_linen_batches_on_handover_user_id"
    t.index ["hotel_id"], name: "index_linen_batches_on_hotel_id"
    t.index ["inspector_id"], name: "index_linen_batches_on_inspector_id"
    t.index ["return_user_id"], name: "index_linen_batches_on_return_user_id"
    t.index ["status"], name: "index_linen_batches_on_status"
  end

  create_table "linen_events", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.string "event_type"
    t.bigint "linen_batch_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["event_type"], name: "index_linen_events_on_event_type"
    t.index ["linen_batch_id", "created_at"], name: "index_linen_events_on_linen_batch_id_and_created_at"
    t.index ["linen_batch_id"], name: "index_linen_events_on_linen_batch_id"
    t.index ["user_id"], name: "index_linen_events_on_user_id"
  end

  create_table "linen_items", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "linen_batch_id", null: false
    t.bigint "linen_type_id", null: false
    t.integer "quantity_clean", default: 0
    t.integer "quantity_damaged", default: 0
    t.integer "quantity_handed", default: 0
    t.integer "quantity_returned", default: 0
    t.integer "quantity_short", default: 0
    t.integer "quantity_stained", default: 0
    t.datetime "updated_at", null: false
    t.index ["linen_batch_id", "linen_type_id"], name: "index_linen_items_on_linen_batch_id_and_linen_type_id", unique: true
    t.index ["linen_batch_id"], name: "index_linen_items_on_linen_batch_id"
    t.index ["linen_type_id"], name: "index_linen_items_on_linen_type_id"
  end

  create_table "linen_types", force: :cascade do |t|
    t.string "category"
    t.datetime "created_at", null: false
    t.string "name"
    t.decimal "unit_price", precision: 10, scale: 2
    t.datetime "updated_at", null: false
    t.index ["category"], name: "index_linen_types_on_category"
    t.index ["name"], name: "index_linen_types_on_name", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name"
    t.string "role"
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_users_on_name", unique: true
    t.index ["role"], name: "index_users_on_role"
  end

  add_foreign_key "damage_claims", "linen_batches"
  add_foreign_key "damage_claims", "linen_types"
  add_foreign_key "damage_claims", "users", column: "confirmed_by_id"
  add_foreign_key "linen_batches", "hotels"
  add_foreign_key "linen_batches", "users", column: "finance_user_id"
  add_foreign_key "linen_batches", "users", column: "handover_user_id"
  add_foreign_key "linen_batches", "users", column: "inspector_id"
  add_foreign_key "linen_batches", "users", column: "return_user_id"
  add_foreign_key "linen_events", "linen_batches"
  add_foreign_key "linen_events", "users"
  add_foreign_key "linen_items", "linen_batches"
  add_foreign_key "linen_items", "linen_types"
end
