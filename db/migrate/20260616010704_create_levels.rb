class CreateLevels < ActiveRecord::Migration[8.1]
  def change
    create_table :levels do |t|
      t.string :name, null: false
      t.text :description
      t.integer :time_limit, default: 120
      t.integer :target_score, default: 1000
      t.string :difficulty, default: 'easy'
      t.integer :container_count, default: 5
      t.integer :berth_count, default: 3
      t.integer :max_weight_per_berth, default: 100

      t.timestamps
    end
    add_index :levels, :name, unique: true
  end
end
