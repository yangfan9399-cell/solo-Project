class CreateContaminationResults < ActiveRecord::Migration[8.0]
  def change
    create_table :contamination_results do |t|
      t.references :game_session, null: false, foreign_key: true

      t.integer :round_number, null: false
      t.integer :contaminant_strain_id, null: false
      t.string :contaminant_name, default: "未知污染菌"

      t.boolean :is_detected, default: false
      t.boolean :is_controlled, default: false

      t.decimal :nutrient_consumed, precision: 10, scale: 2, default: 0.0
      t.decimal :contaminant_coverage, precision: 5, scale: 2, default: 0.0
      t.integer :contaminant_cell_count, default: 0

      t.decimal :target_nutrient_loss, precision: 10, scale: 2, default: 0.0
      t.decimal :target_growth_impact, precision: 5, scale: 2, default: 0.0
      t.decimal :competition_index, precision: 5, scale: 4, default: 0.0

      t.text :contaminant_cells, default: "[]"
      t.text :competition_zones, default: "[]"
      t.text :before_state, default: "{}"
      t.text :after_state, default: "{}"

      t.text :event_description, default: ""
      t.string :severity, default: "low"

      t.timestamps
    end

    add_index :contamination_results, [:game_session_id, :round_number]
    add_index :contamination_results, :is_detected
    add_index :contamination_results, :severity
  end
end
