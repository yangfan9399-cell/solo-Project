class CreateMaterials < ActiveRecord::Migration[8.1]
  def change
    create_table :materials do |t|
      t.string :name
      t.string :material_type
      t.text :description
      t.string :copyright_holder
      t.string :file_url
      t.references :created_by, null: false, foreign_key: { to_table: :users }

      t.timestamps
    end
  end
end