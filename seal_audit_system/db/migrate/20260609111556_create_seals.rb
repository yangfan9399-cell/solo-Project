class CreateSeals < ActiveRecord::Migration[8.1]
  def change
    create_table :seals do |t|
      t.string :name
      t.integer :seal_type
      t.integer :status

      t.timestamps
    end
  end
end
