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

ActiveRecord::Schema[8.1].define(version: 2026_06_16_094809) do
  create_table "game_sessions", force: :cascade do |t|
    t.datetime "completed_at"
    t.datetime "created_at", null: false
    t.float "current_rpm", default: 0.0
    t.text "gears_state"
    t.integer "level_id", null: false
    t.integer "moves_count", default: 0
    t.integer "player_id", null: false
    t.integer "score", default: 0
    t.integer "stars", default: 0
    t.string "status", default: "playing"
    t.integer "time_spent", default: 0
    t.datetime "updated_at", null: false
    t.index ["level_id"], name: "index_game_sessions_on_level_id"
    t.index ["player_id"], name: "index_game_sessions_on_player_id"
  end

  create_table "levels", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.string "difficulty", default: "easy"
    t.text "gears_config"
    t.integer "level_number", null: false
    t.string "name", null: false
    t.float "target_rpm", null: false
    t.integer "three_star_moves", default: 5
    t.integer "time_limit", default: 300
    t.integer "two_star_moves", default: 10
    t.datetime "updated_at", null: false
    t.float "water_force", default: 1.0
    t.index ["level_number"], name: "index_levels_on_level_number", unique: true
  end

  create_table "operation_histories", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "from_state"
    t.integer "game_session_id", null: false
    t.integer "gear_id"
    t.integer "move_number", default: 0
    t.string "operation_type", null: false
    t.text "to_state"
    t.boolean "undone", default: false
    t.datetime "updated_at", null: false
    t.index ["game_session_id"], name: "index_operation_histories_on_game_session_id"
  end

  create_table "players", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.string "password_digest"
    t.integer "total_score", default: 0
    t.integer "total_stars", default: 0
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_players_on_name", unique: true
  end

  add_foreign_key "game_sessions", "levels"
  add_foreign_key "game_sessions", "players"
  add_foreign_key "operation_histories", "game_sessions"
end
