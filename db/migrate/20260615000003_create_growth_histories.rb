class CreateGrowthHistories < ActiveRecord::Migration[8.0]
  def change
    create_table :growth_histories do |t|
      t.references :game_session, null: false, foreign_key: true

      t.integer :round_number, null: false
      t.string :event_type, null: false

      t.decimal :target_coverage, precision: 5, scale: 2, default: 0.0
      t.decimal :target_zone_coverage, precision: 5, scale: 2, default: 0.0
      t.integer :target_colony_cells, default: 0

      t.decimal :growth_rate, precision: 8, scale: 4, default: 0.0
      t.decimal :effective_nutrient, precision: 10, scale: 2, default: 0.0
      t.decimal :temperature_factor, precision: 5, scale: 4, default: 1.0
      t.decimal :moisture_factor, precision: 5, scale: 4, default: 1.0
      t.decimal :antibiotic_factor, precision: 5, scale: 4, default: 1.0

      t.text :target_zone_reached_cells, default: "[]"
      t.text :new_growth_cells, default: "[]"
      t.text :stagnated_cells, default: "[]"

      t.text :event_description, default: ""
      t.boolean :is_overheated, default: false
      t.boolean :is_growth_stopped, default: false

      t.timestamps
    end

    add_index :growth_histories, [:game_session_id, :round_number]
    add_index :growth_histories, :event_type
    add_index :growth_histories, :is_overheated
  end
end
