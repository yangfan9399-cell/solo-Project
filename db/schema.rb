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

ActiveRecord::Schema[8.1].define(version: 2026_06_17_085924) do
  create_table "annotations", force: :cascade do |t|
    t.integer "annotatable_id"
    t.string "annotatable_type"
    t.text "content"
    t.datetime "created_at", null: false
    t.integer "run_chart_id", null: false
    t.string "status"
    t.string "type"
    t.datetime "updated_at", null: false
    t.float "x"
    t.float "y"
    t.index ["annotatable_type", "annotatable_id"], name: "index_annotations_on_annotatable"
    t.index ["run_chart_id"], name: "index_annotations_on_run_chart_id"
  end

  create_table "projects", force: :cascade do |t|
    t.string "code"
    t.datetime "created_at", null: false
    t.string "created_by"
    t.string "department"
    t.text "description"
    t.string "name"
    t.string "status"
    t.datetime "updated_at", null: false
  end

  create_table "run_charts", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.date "date"
    t.string "image_path"
    t.string "name"
    t.float "offset_x"
    t.float "offset_y"
    t.integer "project_id", null: false
    t.float "scale_x"
    t.float "scale_y"
    t.datetime "updated_at", null: false
    t.index ["project_id"], name: "index_run_charts_on_project_id"
  end

  create_table "stations", force: :cascade do |t|
    t.time "arrival_time"
    t.datetime "created_at", null: false
    t.time "departure_time"
    t.string "name"
    t.integer "order"
    t.integer "stop_duration"
    t.integer "train_route_id", null: false
    t.datetime "updated_at", null: false
    t.float "x_coordinate"
    t.float "y_coordinate"
    t.index ["train_route_id"], name: "index_stations_on_train_route_id"
  end

  create_table "train_routes", force: :cascade do |t|
    t.string "color"
    t.datetime "created_at", null: false
    t.text "path_data"
    t.integer "run_chart_id", null: false
    t.string "status"
    t.string "train_no"
    t.string "train_type"
    t.datetime "updated_at", null: false
    t.index ["run_chart_id"], name: "index_train_routes_on_run_chart_id"
  end

  create_table "versions", force: :cascade do |t|
    t.string "batch_no"
    t.text "change_log"
    t.datetime "created_at", null: false
    t.string "export_path"
    t.datetime "exported_at"
    t.integer "project_id", null: false
    t.integer "run_chart_id", null: false
    t.string "status"
    t.datetime "updated_at", null: false
    t.string "version_no"
    t.index ["project_id"], name: "index_versions_on_project_id"
    t.index ["run_chart_id"], name: "index_versions_on_run_chart_id"
  end

  add_foreign_key "annotations", "run_charts"
  add_foreign_key "run_charts", "projects"
  add_foreign_key "stations", "train_routes"
  add_foreign_key "train_routes", "run_charts"
  add_foreign_key "versions", "projects"
  add_foreign_key "versions", "run_charts"
end
