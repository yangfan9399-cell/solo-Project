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

ActiveRecord::Schema[8.1].define(version: 2026_06_05_092550) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "consumption_records", force: :cascade do |t|
    t.bigint "course_package_id", null: false
    t.datetime "created_at", null: false
    t.text "customer_notes"
    t.datetime "performed_at"
    t.bigint "performed_by_id", null: false
    t.string "record_type", default: "normal"
    t.string "service_name"
    t.integer "sessions_used", default: 1
    t.datetime "updated_at", null: false
    t.index ["course_package_id"], name: "index_consumption_records_on_course_package_id"
    t.index ["performed_by_id"], name: "index_consumption_records_on_performed_by_id"
  end

  create_table "course_packages", force: :cascade do |t|
    t.bigint "consultant_id", null: false
    t.datetime "created_at", null: false
    t.bigint "member_id", null: false
    t.string "name"
    t.text "notes"
    t.decimal "original_price", precision: 10, scale: 2
    t.datetime "purchased_at"
    t.integer "remaining_sessions"
    t.string "status", default: "active"
    t.integer "total_sessions"
    t.datetime "updated_at", null: false
    t.index ["consultant_id"], name: "index_course_packages_on_consultant_id"
    t.index ["member_id"], name: "index_course_packages_on_member_id"
  end

  create_table "customer_notes", force: :cascade do |t|
    t.bigint "author_id", null: false
    t.text "content"
    t.bigint "course_package_id", null: false
    t.datetime "created_at", null: false
    t.string "note_type", default: "general"
    t.datetime "updated_at", null: false
    t.index ["author_id"], name: "index_customer_notes_on_author_id"
    t.index ["course_package_id"], name: "index_customer_notes_on_course_package_id"
  end

  create_table "members", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email"
    t.string "name"
    t.string "phone"
    t.datetime "updated_at", null: false
  end

  create_table "responsibility_changes", force: :cascade do |t|
    t.bigint "course_package_id", null: false
    t.datetime "created_at", null: false
    t.bigint "from_consultant_id", null: false
    t.bigint "to_consultant_id", null: false
    t.text "transfer_reason"
    t.datetime "transferred_at"
    t.bigint "transferred_by_id", null: false
    t.datetime "updated_at", null: false
    t.index ["course_package_id"], name: "index_responsibility_changes_on_course_package_id"
    t.index ["from_consultant_id"], name: "index_responsibility_changes_on_from_consultant_id"
    t.index ["to_consultant_id"], name: "index_responsibility_changes_on_to_consultant_id"
    t.index ["transferred_by_id"], name: "index_responsibility_changes_on_transferred_by_id"
  end

  create_table "review_nodes", force: :cascade do |t|
    t.bigint "course_package_id", null: false
    t.datetime "created_at", null: false
    t.text "dispute_reason"
    t.decimal "new_refund_amount", precision: 10, scale: 2
    t.decimal "old_refund_amount", precision: 10, scale: 2
    t.bigint "parent_node_id"
    t.string "refund_algorithm"
    t.decimal "refund_amount", precision: 10, scale: 2
    t.text "review_notes"
    t.datetime "reviewed_at"
    t.bigint "reviewer_id", null: false
    t.string "status", default: "pending"
    t.datetime "updated_at", null: false
    t.index ["course_package_id"], name: "index_review_nodes_on_course_package_id"
    t.index ["parent_node_id"], name: "index_review_nodes_on_parent_node_id"
    t.index ["reviewer_id"], name: "index_review_nodes_on_reviewer_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name"
    t.string "role"
    t.datetime "updated_at", null: false
  end

  add_foreign_key "consumption_records", "course_packages"
  add_foreign_key "consumption_records", "users", column: "performed_by_id"
  add_foreign_key "course_packages", "members"
  add_foreign_key "course_packages", "users", column: "consultant_id"
  add_foreign_key "customer_notes", "course_packages"
  add_foreign_key "customer_notes", "users", column: "author_id"
  add_foreign_key "responsibility_changes", "course_packages"
  add_foreign_key "responsibility_changes", "users", column: "from_consultant_id"
  add_foreign_key "responsibility_changes", "users", column: "to_consultant_id"
  add_foreign_key "responsibility_changes", "users", column: "transferred_by_id"
  add_foreign_key "review_nodes", "course_packages"
  add_foreign_key "review_nodes", "review_nodes", column: "parent_node_id"
  add_foreign_key "review_nodes", "users", column: "reviewer_id"
end
