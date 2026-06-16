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

ActiveRecord::Schema[8.1].define(version: 2026_06_16_010743) do
  create_table "berths", force: :cascade do |t|
    t.string "allowed_destinations"
    t.datetime "created_at", null: false
    t.integer "level_id", null: false
    t.integer "max_weight"
    t.string "name"
    t.integer "position"
    t.datetime "updated_at", null: false
    t.index ["level_id"], name: "index_berths_on_level_id"
  end

  create_table "container_placements", force: :cascade do |t|
    t.integer "berth_id", null: false
    t.integer "container_id", null: false
    t.datetime "created_at", null: false
    t.integer "game_session_id", null: false
    t.datetime "placed_at"
    t.datetime "updated_at", null: false
    t.index ["berth_id"], name: "index_container_placements_on_berth_id"
    t.index ["container_id"], name: "index_container_placements_on_container_id"
    t.index ["game_session_id", "berth_id"], name: "index_container_placements_on_game_session_id_and_berth_id"
    t.index ["game_session_id", "container_id"], name: "index_container_placements_on_game_session_id_and_container_id", unique: true
    t.index ["game_session_id"], name: "index_container_placements_on_game_session_id"
  end

  create_table "containers", force: :cascade do |t|
    t.string "color"
    t.datetime "created_at", null: false
    t.string "destination"
    t.string "label"
    t.integer "level_id", null: false
    t.integer "priority"
    t.datetime "updated_at", null: false
    t.integer "weight"
    t.index ["level_id"], name: "index_containers_on_level_id"
  end

  create_table "game_sessions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "finished_at"
    t.integer "level_id", null: false
    t.integer "player_id", null: false
    t.integer "score", default: 0
    t.datetime "started_at"
    t.string "status", default: "playing"
    t.integer "time_remaining"
    t.datetime "updated_at", null: false
    t.index ["level_id"], name: "index_game_sessions_on_level_id"
    t.index ["player_id", "status"], name: "index_game_sessions_on_player_id_and_status"
    t.index ["player_id"], name: "index_game_sessions_on_player_id"
    t.index ["status"], name: "index_game_sessions_on_status"
  end

  create_table "levels", force: :cascade do |t|
    t.integer "berth_count", default: 3
    t.integer "container_count", default: 5
    t.datetime "created_at", null: false
    t.text "description"
    t.string "difficulty", default: "easy"
    t.integer "max_weight_per_berth", default: 100
    t.string "name", null: false
    t.integer "target_score", default: 1000
    t.integer "time_limit", default: 120
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_levels_on_name", unique: true
  end

  create_table "operations", force: :cascade do |t|
    t.string "action_type", null: false
    t.integer "berth_id"
    t.integer "container_id", null: false
    t.datetime "created_at", null: false
    t.integer "game_session_id", null: false
    t.integer "sequence", null: false
    t.datetime "timestamp"
    t.boolean "undone", default: false
    t.datetime "updated_at", null: false
    t.index ["berth_id"], name: "index_operations_on_berth_id"
    t.index ["container_id"], name: "index_operations_on_container_id"
    t.index ["game_session_id", "sequence"], name: "index_operations_on_game_session_id_and_sequence"
    t.index ["game_session_id"], name: "index_operations_on_game_session_id"
  end

  create_table "players", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "current_score", default: 0
    t.string "name", null: false
    t.integer "total_games", default: 0
    t.datetime "updated_at", null: false
    t.integer "wins", default: 0
    t.index ["name"], name: "index_players_on_name", unique: true
  end

  add_foreign_key "berths", "levels"
  add_foreign_key "container_placements", "berths"
  add_foreign_key "container_placements", "containers"
  add_foreign_key "container_placements", "game_sessions"
  add_foreign_key "containers", "levels"
  add_foreign_key "game_sessions", "levels"
  add_foreign_key "game_sessions", "players"
  add_foreign_key "operations", "berths"
  add_foreign_key "operations", "containers"
  add_foreign_key "operations", "game_sessions"
end
