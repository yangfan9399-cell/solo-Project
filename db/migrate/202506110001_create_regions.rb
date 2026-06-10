class CreateRegions < ActiveRecord::Migration[8.0]
  def change
    create_table :regions do |t|
      t.string :name, null: false
      t.string :code, null: false, unique: true
      t.text :description
      t.timestamps
    end
  end
end
