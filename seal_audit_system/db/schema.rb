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

ActiveRecord::Schema[8.1].define(version: 2026_06_09_112434) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "approval_nodes", force: :cascade do |t|
    t.text "comment"
    t.datetime "created_at", null: false
    t.integer "role"
    t.bigint "seal_application_id", null: false
    t.integer "status"
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["seal_application_id"], name: "index_approval_nodes_on_seal_application_id"
    t.index ["user_id"], name: "index_approval_nodes_on_user_id"
  end

  create_table "archives", force: :cascade do |t|
    t.bigint "auditor_id", null: false
    t.datetime "created_at", null: false
    t.string "file_name"
    t.integer "missing_pages"
    t.integer "page_count"
    t.bigint "seal_application_id", null: false
    t.integer "status"
    t.datetime "updated_at", null: false
    t.index ["auditor_id"], name: "index_archives_on_auditor_id"
    t.index ["seal_application_id"], name: "index_archives_on_seal_application_id"
  end

  create_table "contracts", force: :cascade do |t|
    t.bigint "applicant_id", null: false
    t.text "content"
    t.datetime "created_at", null: false
    t.bigint "department_id", null: false
    t.string "title"
    t.datetime "updated_at", null: false
    t.string "version"
    t.index ["applicant_id"], name: "index_contracts_on_applicant_id"
    t.index ["department_id"], name: "index_contracts_on_department_id"
    t.index ["version"], name: "index_contracts_on_version"
  end

  create_table "departments", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name"
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_departments_on_name"
  end

  create_table "seal_applications", force: :cascade do |t|
    t.bigint "applicant_id", null: false
    t.bigint "contract_id", null: false
    t.datetime "created_at", null: false
    t.text "purpose"
    t.bigint "seal_id", null: false
    t.integer "status"
    t.datetime "updated_at", null: false
    t.integer "use_count"
    t.boolean "version_conflict"
    t.index ["applicant_id"], name: "index_seal_applications_on_applicant_id"
    t.index ["contract_id"], name: "index_seal_applications_on_contract_id"
    t.index ["seal_id"], name: "index_seal_applications_on_seal_id"
  end

  create_table "seals", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name"
    t.integer "seal_type"
    t.integer "status"
    t.datetime "updated_at", null: false
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "department_id", null: false
    t.string "name"
    t.integer "role"
    t.datetime "updated_at", null: false
    t.index ["department_id"], name: "index_users_on_department_id"
  end

  add_foreign_key "approval_nodes", "seal_applications"
  add_foreign_key "approval_nodes", "users"
  add_foreign_key "archives", "seal_applications"
  add_foreign_key "archives", "users", column: "auditor_id"
  add_foreign_key "contracts", "departments"
  add_foreign_key "contracts", "users", column: "applicant_id"
  add_foreign_key "seal_applications", "contracts"
  add_foreign_key "seal_applications", "seals"
  add_foreign_key "seal_applications", "users", column: "applicant_id"
  add_foreign_key "users", "departments"
end
