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

ActiveRecord::Schema[8.1].define(version: 2026_06_17_223344) do
  create_table "anomalies", force: :cascade do |t|
    t.string "anomaly_type"
    t.datetime "created_at", null: false
    t.text "description"
    t.integer "page_mapping_id"
    t.integer "project_id", null: false
    t.boolean "resolved", default: false
    t.datetime "updated_at", null: false
    t.index ["page_mapping_id"], name: "index_anomalies_on_page_mapping_id"
    t.index ["project_id"], name: "index_anomalies_on_project_id"
  end

  create_table "batches", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.string "name"
    t.integer "project_id", null: false
    t.text "snapshot"
    t.datetime "updated_at", null: false
    t.index ["project_id"], name: "index_batches_on_project_id"
  end

  create_table "export_records", force: :cascade do |t|
    t.integer "batch_id"
    t.text "content"
    t.datetime "created_at", null: false
    t.string "filename"
    t.string "format"
    t.integer "project_id", null: false
    t.datetime "updated_at", null: false
    t.index ["batch_id"], name: "index_export_records_on_batch_id"
    t.index ["project_id"], name: "index_export_records_on_project_id"
  end

  create_table "page_mappings", force: :cascade do |t|
    t.integer "actual_page_number"
    t.datetime "created_at", null: false
    t.text "notes"
    t.integer "pdf_page_index"
    t.integer "project_id", null: false
    t.string "status", default: "normal"
    t.datetime "updated_at", null: false
    t.index ["project_id", "pdf_page_index"], name: "index_page_mappings_on_project_id_and_pdf_page_index", unique: true
    t.index ["project_id"], name: "index_page_mappings_on_project_id"
  end

  create_table "projects", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.string "name"
    t.string "pdf_filename"
    t.string "status", default: "draft"
    t.integer "total_pages"
    t.datetime "updated_at", null: false
    t.index ["status"], name: "index_projects_on_status"
  end

  add_foreign_key "anomalies", "page_mappings"
  add_foreign_key "anomalies", "projects"
  add_foreign_key "batches", "projects"
  add_foreign_key "export_records", "batches"
  add_foreign_key "export_records", "projects"
  add_foreign_key "page_mappings", "projects"
end
