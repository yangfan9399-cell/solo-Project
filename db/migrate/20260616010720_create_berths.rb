class CreateBerths < ActiveRecord::Migration[8.1]
  def change
    create_table :berths do |t|
      t.references :level, null: false, foreign_key: true
      t.string :name
      t.integer :max_weight
      t.string :allowed_destinations
      t.integer :position

      t.timestamps
    end
  end
end
