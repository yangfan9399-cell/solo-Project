class CreateMaterials < ActiveRecord::Migration[8.0]
  def change
    create_table :materials do |t|
      t.references :category, null: false, foreign_key: true
      t.string :name, null: false
      t.string :code, null: false, unique: true
      t.string :unit, null: false, default: "kg"
      t.string :specification
      t.timestamps
    end
  end
end
