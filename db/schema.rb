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

ActiveRecord::Schema[8.1].define(version: 2026_06_17_113008) do
  create_table "character_boxes", force: :cascade do |t|
    t.string "char"
    t.integer "char_index"
    t.datetime "created_at", null: false
    t.integer "height"
    t.integer "inscription_id", null: false
    t.text "note"
    t.integer "rubbing_id", null: false
    t.datetime "updated_at", null: false
    t.integer "width"
    t.integer "x"
    t.integer "y"
    t.index ["inscription_id"], name: "index_character_boxes_on_inscription_id"
    t.index ["rubbing_id"], name: "index_character_boxes_on_rubbing_id"
  end

  create_table "footnotes", force: :cascade do |t|
    t.text "content"
    t.datetime "created_at", null: false
    t.text "note"
    t.string "page"
    t.integer "rubbing_id", null: false
    t.string "source"
    t.datetime "updated_at", null: false
    t.index ["rubbing_id"], name: "index_footnotes_on_rubbing_id"
  end

  create_table "inscriptions", force: :cascade do |t|
    t.text "broken_note"
    t.integer "column_number"
    t.text "content"
    t.datetime "created_at", null: false
    t.boolean "is_broken"
    t.integer "line_number"
    t.string "position"
    t.integer "rubbing_id", null: false
    t.datetime "updated_at", null: false
    t.index ["rubbing_id"], name: "index_inscriptions_on_rubbing_id"
  end

  create_table "rubbings", force: :cascade do |t|
    t.string "checksum"
    t.datetime "created_at", null: false
    t.string "created_by"
    t.string "dating"
    t.string "dynasty"
    t.string "image"
    t.string "image_thumb"
    t.string "location"
    t.string "no"
    t.text "remarks"
    t.string "status"
    t.string "title"
    t.datetime "updated_at", null: false
  end

  create_table "versions", force: :cascade do |t|
    t.string "batch"
    t.string "changed_by"
    t.text "changelog"
    t.datetime "created_at", null: false
    t.integer "rubbing_id", null: false
    t.datetime "updated_at", null: false
    t.string "version"
    t.index ["rubbing_id"], name: "index_versions_on_rubbing_id"
  end

  add_foreign_key "character_boxes", "inscriptions"
  add_foreign_key "character_boxes", "rubbings"
  add_foreign_key "footnotes", "rubbings"
  add_foreign_key "inscriptions", "rubbings"
  add_foreign_key "versions", "rubbings"
end
