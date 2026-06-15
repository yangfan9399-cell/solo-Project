class CreateOperationDetails < ActiveRecord::Migration[8.0]
  def change
    create_table :operation_details do |t|
      t.references :game_session, null: false, foreign_key: true

      t.integer :round_number, null: false
      t.integer :operation_type, null: false

      t.decimal :moisture_adjustment, precision: 5, scale: 2, default: 0.0
      t.decimal :moisture_level, precision: 5, scale: 2, default: 50.0

      t.decimal :antibiotic_radius, precision: 5, scale: 2, default: 0.0
      t.integer :antibiotic_position_x, default: 0
      t.integer :antibiotic_position_y, default: 0
      t.string :antibiotic_type, default: ""

      t.decimal :temperature_adjustment, precision: 5, scale: 2, default: 0.0
      t.decimal :nutrient_adjustment, precision: 10, scale: 2, default: 0.0
      t.decimal :ph_adjustment, precision: 4, scale: 2, default: 0.0

      t.text :operation_note, default: ""
      t.datetime :executed_at, null: false

      t.timestamps
    end

    add_index :operation_details, [:game_session_id, :round_number]
    add_index :operation_details, :operation_type
  end
end
