class CreateLevels < ActiveRecord::Migration[8.1]
  def change
    create_table :levels do |t|
      t.string :name, null: false
      t.text :description
      t.integer :level_number, null: false
      t.string :difficulty, default: 'easy'
      t.float :water_force, default: 1.0
      t.float :target_rpm, null: false
      t.text :gears_config
      t.integer :time_limit, default: 300
      t.integer :three_star_moves, default: 5
      t.integer :two_star_moves, default: 10

      t.timestamps
    end
    add_index :levels, :level_number, unique: true
  end
end
