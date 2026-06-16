class CreateContainers < ActiveRecord::Migration[8.1]
  def change
    create_table :containers do |t|
      t.references :level, null: false, foreign_key: true
      t.integer :weight
      t.string :destination
      t.integer :priority
      t.string :color
      t.string :label

      t.timestamps
    end
  end
end
