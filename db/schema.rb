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

ActiveRecord::Schema[8.1].define(version: 2026_06_17_160722) do
  create_table "component_versions", force: :cascade do |t|
    t.string "batch_tag"
    t.text "changed_fields"
    t.integer "component_id", null: false
    t.datetime "created_at", null: false
    t.string "event_type"
    t.text "notes"
    t.text "object_snapshot"
    t.string "operator"
    t.datetime "recorded_at"
    t.datetime "updated_at", null: false
    t.integer "version_number"
    t.index ["component_id"], name: "index_component_versions_on_component_id"
  end

  create_table "components", force: :cascade do |t|
    t.string "batch_tag"
    t.string "code"
    t.string "component_type"
    t.datetime "created_at", null: false
    t.decimal "height"
    t.integer "layer"
    t.decimal "length"
    t.string "material"
    t.text "notes"
    t.string "orientation"
    t.integer "parent_component_id"
    t.text "photo_refs"
    t.string "position"
    t.integer "project_id", null: false
    t.integer "sequence"
    t.string "status"
    t.datetime "updated_at", null: false
    t.decimal "width"
    t.index ["project_id"], name: "index_components_on_project_id"
  end

  create_table "defects", force: :cascade do |t|
    t.integer "component_id", null: false
    t.datetime "created_at", null: false
    t.string "defect_type"
    t.text "description"
    t.date "discovered_at"
    t.string "location_on_component"
    t.string "measured_size"
    t.text "repair_notes"
    t.boolean "repaired"
    t.date "repaired_at"
    t.string "severity"
    t.datetime "updated_at", null: false
    t.index ["component_id"], name: "index_defects_on_component_id"
  end

  create_table "projects", force: :cascade do |t|
    t.string "building_type"
    t.string "code"
    t.date "completed_at"
    t.datetime "created_at", null: false
    t.text "description"
    t.string "era"
    t.string "location"
    t.string "name"
    t.date "started_at"
    t.string "status"
    t.datetime "updated_at", null: false
  end

  create_table "reassembly_records", force: :cascade do |t|
    t.datetime "checked_at"
    t.string "checked_by"
    t.integer "component_id", null: false
    t.datetime "created_at", null: false
    t.text "notes"
    t.string "position_deviation"
    t.string "result"
    t.datetime "updated_at", null: false
    t.boolean "verified"
    t.index ["component_id"], name: "index_reassembly_records_on_component_id"
  end

  add_foreign_key "component_versions", "components"
  add_foreign_key "components", "projects"
  add_foreign_key "defects", "components"
  add_foreign_key "reassembly_records", "components"
end
