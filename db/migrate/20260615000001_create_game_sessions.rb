class CreateGameSessions < ActiveRecord::Migration[8.0]
  def change
    create_table :game_sessions do |t|
      t.string :session_code, null: false
      t.string :player_name, default: "研究员"
      t.integer :status, default: 0
      t.integer :target_strain_id, null: false

      t.decimal :initial_nutrient_level, precision: 10, scale: 2, default: 50.0
      t.decimal :current_nutrient_level, precision: 10, scale: 2, default: 50.0
      t.decimal :temperature, precision: 5, scale: 2, default: 37.0
      t.decimal :ph_level, precision: 4, scale: 2, default: 7.0

      t.integer :current_round, default: 0
      t.integer :max_rounds, default: 20

      t.decimal :target_coverage, precision: 5, scale: 2, default: 70.0
      t.decimal :actual_coverage, precision: 5, scale: 2, default: 0.0

      t.text :colony_grid, default: "{}"
      t.text :target_zone_points, default: "[]"

      t.decimal :final_score, precision: 10, scale: 2, default: 0.0
      t.text :settlement_details, default: "{}"

      t.text :notes, default: ""
      t.string :batch_tag, default: ""

      t.timestamps
    end

    add_index :game_sessions, :session_code, unique: true
    add_index :game_sessions, :status
    add_index :game_sessions, :batch_tag
  end
end
