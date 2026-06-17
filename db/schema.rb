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

ActiveRecord::Schema[8.1].define(version: 2026_06_17_192608) do
  create_table "annotations", force: :cascade do |t|
    t.string "color"
    t.datetime "created_at", null: false
    t.text "description"
    t.string "disease_type"
    t.integer "height"
    t.integer "record_id", null: false
    t.string "severity"
    t.datetime "updated_at", null: false
    t.integer "width"
    t.integer "x"
    t.integer "y"
    t.index ["record_id"], name: "index_annotations_on_record_id"
  end

  create_table "exports", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "file_path"
    t.string "format"
    t.datetime "generated_at"
    t.integer "project_id", null: false
    t.text "record_ids"
    t.datetime "updated_at", null: false
    t.index ["project_id"], name: "index_exports_on_project_id"
  end

  create_table "projects", force: :cascade do |t|
    t.string "code"
    t.datetime "created_at", null: false
    t.text "description"
    t.string "dynasty"
    t.date "end_date"
    t.string "location"
    t.string "name"
    t.date "start_date"
    t.string "status"
    t.datetime "updated_at", null: false
  end

  create_table "records", force: :cascade do |t|
    t.string "batch_number"
    t.datetime "created_at", null: false
    t.float "humidity"
    t.string "image_url"
    t.text "notes"
    t.string "observer"
    t.string "photographer"
    t.integer "project_id", null: false
    t.date "record_date"
    t.float "temperature"
    t.datetime "updated_at", null: false
    t.string "version_type"
    t.string "weather"
    t.index ["project_id"], name: "index_records_on_project_id"
  end

  create_table "scale_markers", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.float "length_cm"
    t.float "length_pixels"
    t.string "orientation"
    t.integer "record_id", null: false
    t.datetime "updated_at", null: false
    t.integer "x"
    t.integer "y"
    t.index ["record_id"], name: "index_scale_markers_on_record_id"
  end

  add_foreign_key "annotations", "records"
  add_foreign_key "exports", "projects"
  add_foreign_key "records", "projects"
  add_foreign_key "scale_markers", "records"
end
