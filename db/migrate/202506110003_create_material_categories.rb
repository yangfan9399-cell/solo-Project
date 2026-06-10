class CreateMaterialCategories < ActiveRecord::Migration[8.0]
  def change
    create_table :material_categories do |t|
      t.string :name, null: false
      t.string :code, null: false, unique: true
      t.string :parent_code
      t.timestamps
    end
  end
end
