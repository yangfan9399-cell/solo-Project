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

ActiveRecord::Schema[8.1].define(version: 2026_06_10_082425) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "color_measurements", force: :cascade do |t|
    t.decimal "a_value"
    t.decimal "b_value"
    t.datetime "created_at", null: false
    t.decimal "delta_e"
    t.string "inspector"
    t.boolean "is_qualified"
    t.decimal "l_value"
    t.datetime "measured_at"
    t.bigint "proof_id", null: false
    t.text "remark"
    t.datetime "updated_at", null: false
    t.index ["proof_id"], name: "index_color_measurements_on_proof_id"
  end

  create_table "customers", force: :cascade do |t|
    t.string "contact"
    t.datetime "created_at", null: false
    t.string "email"
    t.string "name"
    t.string "phone"
    t.datetime "updated_at", null: false
  end

  create_table "proofs", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "sample_image"
    t.string "status"
    t.datetime "submitted_at"
    t.string "submitter"
    t.datetime "updated_at", null: false
    t.integer "version"
    t.bigint "work_order_id", null: false
    t.index ["work_order_id"], name: "index_proofs_on_work_order_id"
  end

  create_table "work_order_histories", force: :cascade do |t|
    t.string "action"
    t.datetime "created_at", null: false
    t.string "current_status"
    t.string "operator"
    t.string "previous_status"
    t.text "remark"
    t.datetime "updated_at", null: false
    t.bigint "work_order_id", null: false
    t.index ["work_order_id"], name: "index_work_order_histories_on_work_order_id"
  end

  create_table "work_orders", force: :cascade do |t|
    t.string "category"
    t.datetime "created_at", null: false
    t.bigint "customer_id", null: false
    t.string "machine"
    t.string "paper_type"
    t.text "remark"
    t.string "responsible_person"
    t.string "status"
    t.string "target_color"
    t.datetime "updated_at", null: false
    t.index ["customer_id"], name: "index_work_orders_on_customer_id"
  end

  add_foreign_key "color_measurements", "proofs"
  add_foreign_key "proofs", "work_orders"
  add_foreign_key "work_order_histories", "work_orders"
  add_foreign_key "work_orders", "customers"
end
