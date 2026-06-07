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

ActiveRecord::Schema[8.1].define(version: 2026_06_07_030250) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "issue_types", force: :cascade do |t|
    t.string "category", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.index ["name", "category"], name: "index_issue_types_on_name_and_category", unique: true
  end

  create_table "reviews", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "feedback"
    t.jsonb "issues", default: []
    t.bigint "reviewer_id", null: false
    t.bigint "sample_id", null: false
    t.bigint "sample_version_id", null: false
    t.datetime "updated_at", null: false
    t.integer "verdict", default: 0, null: false
    t.index ["reviewer_id"], name: "index_reviews_on_reviewer_id"
    t.index ["sample_id"], name: "index_reviews_on_sample_id"
    t.index ["sample_version_id"], name: "index_reviews_on_sample_version_id"
    t.index ["verdict"], name: "index_reviews_on_verdict"
  end

  create_table "sample_versions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "created_by_id", null: false
    t.text "description"
    t.text "fabric"
    t.bigint "sample_id", null: false
    t.jsonb "size_chart", default: {}
    t.datetime "updated_at", null: false
    t.integer "version_number", default: 1, null: false
    t.index ["created_by_id"], name: "index_sample_versions_on_created_by_id"
    t.index ["sample_id", "version_number"], name: "index_sample_versions_on_sample_id_and_version_number", unique: true
    t.index ["sample_id"], name: "index_sample_versions_on_sample_id"
  end

  create_table "samples", force: :cascade do |t|
    t.string "category", null: false
    t.datetime "created_at", null: false
    t.bigint "current_owner_id"
    t.text "description"
    t.bigint "designer_id", null: false
    t.text "fabric"
    t.datetime "finalized_at"
    t.bigint "pattern_maker_id"
    t.jsonb "size_chart", default: {}
    t.integer "status", default: 0, null: false
    t.string "style_number", null: false
    t.datetime "submitted_at"
    t.boolean "supervisor_confirmation_required", default: false, null: false
    t.boolean "supervisor_confirmed", default: false, null: false
    t.datetime "updated_at", null: false
    t.integer "version_count", default: 0, null: false
    t.index ["category"], name: "index_samples_on_category"
    t.index ["current_owner_id"], name: "index_samples_on_current_owner_id"
    t.index ["designer_id"], name: "index_samples_on_designer_id"
    t.index ["pattern_maker_id"], name: "index_samples_on_pattern_maker_id"
    t.index ["status"], name: "index_samples_on_status"
    t.index ["style_number"], name: "index_samples_on_style_number", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.string "name", null: false
    t.string "password_digest", null: false
    t.integer "role", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "reviews", "sample_versions"
  add_foreign_key "reviews", "samples"
  add_foreign_key "reviews", "users", column: "reviewer_id"
  add_foreign_key "sample_versions", "samples"
  add_foreign_key "sample_versions", "users", column: "created_by_id"
  add_foreign_key "samples", "users", column: "current_owner_id"
  add_foreign_key "samples", "users", column: "designer_id"
  add_foreign_key "samples", "users", column: "pattern_maker_id"
end
