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

ActiveRecord::Schema[8.1].define(version: 2026_06_11_000008) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "anchors", force: :cascade do |t|
    t.string "avatar_url"
    t.datetime "created_at", null: false
    t.string "name"
    t.datetime "updated_at", null: false
  end

  create_table "inspection_records", force: :cascade do |t|
    t.string "condition"
    t.datetime "created_at", null: false
    t.text "damage_description"
    t.string "final_decision"
    t.string "inspector_name"
    t.integer "missing_items_count", default: 0
    t.jsonb "photos", default: []
    t.integer "quality_score"
    t.bigint "return_order_id", null: false
    t.datetime "updated_at", null: false
    t.index ["return_order_id"], name: "index_inspection_records_on_return_order_id"
  end

  create_table "live_sessions", force: :cascade do |t|
    t.bigint "anchor_id", null: false
    t.datetime "created_at", null: false
    t.datetime "ended_at"
    t.datetime "started_at"
    t.string "title"
    t.datetime "updated_at", null: false
    t.index ["anchor_id"], name: "index_live_sessions_on_anchor_id"
  end

  create_table "orders", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "live_session_id", null: false
    t.string "order_no"
    t.bigint "product_id", null: false
    t.integer "quantity"
    t.string "status", default: "completed"
    t.decimal "total_amount"
    t.decimal "unit_price"
    t.datetime "updated_at", null: false
    t.string "user_name"
    t.string "user_phone"
    t.index ["live_session_id"], name: "index_orders_on_live_session_id"
    t.index ["order_no"], name: "index_orders_on_order_no", unique: true
    t.index ["product_id"], name: "index_orders_on_product_id"
  end

  create_table "products", force: :cascade do |t|
    t.bigint "anchor_id", null: false
    t.string "category"
    t.datetime "created_at", null: false
    t.string "name"
    t.decimal "original_price"
    t.string "sku"
    t.datetime "updated_at", null: false
    t.index ["anchor_id"], name: "index_products_on_anchor_id"
    t.index ["sku"], name: "index_products_on_sku", unique: true
  end

  create_table "return_orders", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "customer_note"
    t.boolean "damaged", default: false
    t.boolean "missing_items", default: false
    t.bigint "order_id", null: false
    t.text "reason"
    t.decimal "refund_amount"
    t.boolean "reported_loss", default: false
    t.boolean "resaleable", default: false
    t.string "return_no"
    t.string "status", default: "pending"
    t.datetime "updated_at", null: false
    t.index ["order_id"], name: "index_return_orders_on_order_id"
    t.index ["return_no"], name: "index_return_orders_on_return_no", unique: true
  end

  create_table "status_histories", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "event"
    t.string "from_status"
    t.text "note"
    t.string "operator_name"
    t.bigint "return_order_id", null: false
    t.string "to_status"
    t.datetime "updated_at", null: false
    t.index ["return_order_id"], name: "index_status_histories_on_return_order_id"
  end

  add_foreign_key "inspection_records", "return_orders"
  add_foreign_key "live_sessions", "anchors"
  add_foreign_key "orders", "live_sessions"
  add_foreign_key "orders", "products"
  add_foreign_key "products", "anchors"
  add_foreign_key "return_orders", "orders"
  add_foreign_key "status_histories", "return_orders"
end
