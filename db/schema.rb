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

ActiveRecord::Schema[8.1].define(version: 2026_06_15_000004) do
  create_table "contamination_results", force: :cascade do |t|
    t.text "after_state", default: "{}"
    t.text "before_state", default: "{}"
    t.decimal "competition_index", precision: 5, scale: 4, default: "0.0"
    t.text "competition_zones", default: "[]"
    t.integer "contaminant_cell_count", default: 0
    t.text "contaminant_cells", default: "[]"
    t.decimal "contaminant_coverage", precision: 5, scale: 2, default: "0.0"
    t.string "contaminant_name", default: "未知污染菌"
    t.integer "contaminant_strain_id", null: false
    t.datetime "created_at", null: false
    t.text "event_description", default: ""
    t.integer "game_session_id", null: false
    t.boolean "is_controlled", default: false
    t.boolean "is_detected", default: false
    t.decimal "nutrient_consumed", precision: 10, scale: 2, default: "0.0"
    t.integer "round_number", null: false
    t.string "severity", default: "low"
    t.decimal "target_growth_impact", precision: 5, scale: 2, default: "0.0"
    t.decimal "target_nutrient_loss", precision: 10, scale: 2, default: "0.0"
    t.datetime "updated_at", null: false
    t.index ["game_session_id", "round_number"], name: "idx_on_game_session_id_round_number_839503697c"
    t.index ["game_session_id"], name: "index_contamination_results_on_game_session_id"
    t.index ["is_detected"], name: "index_contamination_results_on_is_detected"
    t.index ["severity"], name: "index_contamination_results_on_severity"
  end

  create_table "game_sessions", force: :cascade do |t|
    t.decimal "actual_coverage", precision: 5, scale: 2, default: "0.0"
    t.string "batch_tag", default: ""
    t.text "colony_grid", default: "{}"
    t.datetime "created_at", null: false
    t.decimal "current_nutrient_level", precision: 10, scale: 2, default: "50.0"
    t.integer "current_round", default: 0
    t.decimal "final_score", precision: 10, scale: 2, default: "0.0"
    t.decimal "initial_nutrient_level", precision: 10, scale: 2, default: "50.0"
    t.integer "max_rounds", default: 20
    t.text "notes", default: ""
    t.decimal "ph_level", precision: 4, scale: 2, default: "7.0"
    t.string "player_name", default: "研究员"
    t.string "session_code", null: false
    t.text "settlement_details", default: "{}"
    t.integer "status", default: 0
    t.decimal "target_coverage", precision: 5, scale: 2, default: "70.0"
    t.integer "target_strain_id", null: false
    t.text "target_zone_points", default: "[]"
    t.decimal "temperature", precision: 5, scale: 2, default: "37.0"
    t.datetime "updated_at", null: false
    t.index ["batch_tag"], name: "index_game_sessions_on_batch_tag"
    t.index ["session_code"], name: "index_game_sessions_on_session_code", unique: true
    t.index ["status"], name: "index_game_sessions_on_status"
  end

  create_table "growth_histories", force: :cascade do |t|
    t.decimal "antibiotic_factor", precision: 5, scale: 4, default: "1.0"
    t.datetime "created_at", null: false
    t.decimal "effective_nutrient", precision: 10, scale: 2, default: "0.0"
    t.text "event_description", default: ""
    t.string "event_type", null: false
    t.integer "game_session_id", null: false
    t.decimal "growth_rate", precision: 8, scale: 4, default: "0.0"
    t.boolean "is_growth_stopped", default: false
    t.boolean "is_overheated", default: false
    t.decimal "moisture_factor", precision: 5, scale: 4, default: "1.0"
    t.text "new_growth_cells", default: "[]"
    t.integer "round_number", null: false
    t.text "stagnated_cells", default: "[]"
    t.integer "target_colony_cells", default: 0
    t.decimal "target_coverage", precision: 5, scale: 2, default: "0.0"
    t.decimal "target_zone_coverage", precision: 5, scale: 2, default: "0.0"
    t.text "target_zone_reached_cells", default: "[]"
    t.decimal "temperature_factor", precision: 5, scale: 4, default: "1.0"
    t.datetime "updated_at", null: false
    t.index ["event_type"], name: "index_growth_histories_on_event_type"
    t.index ["game_session_id", "round_number"], name: "index_growth_histories_on_game_session_id_and_round_number"
    t.index ["game_session_id"], name: "index_growth_histories_on_game_session_id"
    t.index ["is_overheated"], name: "index_growth_histories_on_is_overheated"
  end

  create_table "operation_details", force: :cascade do |t|
    t.integer "antibiotic_position_x", default: 0
    t.integer "antibiotic_position_y", default: 0
    t.decimal "antibiotic_radius", precision: 5, scale: 2, default: "0.0"
    t.string "antibiotic_type", default: ""
    t.datetime "created_at", null: false
    t.datetime "executed_at", null: false
    t.integer "game_session_id", null: false
    t.decimal "moisture_adjustment", precision: 5, scale: 2, default: "0.0"
    t.decimal "moisture_level", precision: 5, scale: 2, default: "50.0"
    t.decimal "nutrient_adjustment", precision: 10, scale: 2, default: "0.0"
    t.text "operation_note", default: ""
    t.integer "operation_type", null: false
    t.decimal "ph_adjustment", precision: 4, scale: 2, default: "0.0"
    t.integer "round_number", null: false
    t.decimal "temperature_adjustment", precision: 5, scale: 2, default: "0.0"
    t.datetime "updated_at", null: false
    t.index ["game_session_id", "round_number"], name: "index_operation_details_on_game_session_id_and_round_number"
    t.index ["game_session_id"], name: "index_operation_details_on_game_session_id"
    t.index ["operation_type"], name: "index_operation_details_on_operation_type"
  end

  add_foreign_key "contamination_results", "game_sessions"
  add_foreign_key "growth_histories", "game_sessions"
  add_foreign_key "operation_details", "game_sessions"
end
