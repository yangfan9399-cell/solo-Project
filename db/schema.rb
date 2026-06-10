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

ActiveRecord::Schema[8.1].define(version: 2026_06_10_131701) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "authorizations", force: :cascade do |t|
    t.boolean "approved"
    t.datetime "approved_at"
    t.datetime "created_at", null: false
    t.string "file_path"
    t.bigint "interview_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["interview_id"], name: "index_authorizations_on_interview_id"
    t.index ["user_id"], name: "index_authorizations_on_user_id"
  end

  create_table "change_histories", force: :cascade do |t|
    t.json "changed_fields"
    t.string "comment"
    t.datetime "created_at", null: false
    t.bigint "interview_id", null: false
    t.json "new_values"
    t.json "previous_values"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["interview_id"], name: "index_change_histories_on_interview_id"
    t.index ["user_id"], name: "index_change_histories_on_user_id"
  end

  create_table "interviews", force: :cascade do |t|
    t.integer "channel"
    t.string "content"
    t.datetime "created_at", null: false
    t.datetime "publish_date"
    t.bigint "respondent_id", null: false
    t.integer "status"
    t.string "title"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["respondent_id"], name: "index_interviews_on_respondent_id"
    t.index ["user_id"], name: "index_interviews_on_user_id"
  end

  create_table "respondents", force: :cascade do |t|
    t.string "contact_info"
    t.datetime "created_at", null: false
    t.string "name"
    t.integer "type"
    t.datetime "updated_at", null: false
  end

  create_table "review_records", force: :cascade do |t|
    t.string "comment"
    t.datetime "created_at", null: false
    t.bigint "interview_id", null: false
    t.bigint "reviewer_id", null: false
    t.integer "stage"
    t.integer "status"
    t.datetime "updated_at", null: false
    t.index ["interview_id"], name: "index_review_records_on_interview_id"
    t.index ["reviewer_id"], name: "index_review_records_on_reviewer_id"
  end

  create_table "sensitive_items", force: :cascade do |t|
    t.string "content"
    t.boolean "covered"
    t.datetime "created_at", null: false
    t.integer "end_index"
    t.bigint "interview_id", null: false
    t.string "position"
    t.integer "start_index"
    t.datetime "updated_at", null: false
    t.index ["interview_id"], name: "index_sensitive_items_on_interview_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email"
    t.string "name"
    t.integer "role"
    t.datetime "updated_at", null: false
  end

  add_foreign_key "authorizations", "interviews"
  add_foreign_key "authorizations", "users"
  add_foreign_key "change_histories", "interviews"
  add_foreign_key "change_histories", "users"
  add_foreign_key "interviews", "respondents"
  add_foreign_key "interviews", "users"
  add_foreign_key "review_records", "interviews"
  add_foreign_key "review_records", "users", column: "reviewer_id"
  add_foreign_key "sensitive_items", "interviews"
end
