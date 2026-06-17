class CreateComponents < ActiveRecord::Migration[8.1]
  def change
    create_table :components do |t|
      t.references :project, null: false, foreign_key: true
      t.string :code
      t.string :component_type
      t.string :position
      t.string :orientation
      t.integer :layer
      t.integer :parent_component_id
      t.string :material
      t.decimal :length
      t.decimal :width
      t.decimal :height
      t.string :status
      t.text :notes
      t.text :photo_refs
      t.string :batch_tag
      t.integer :sequence

      t.timestamps
    end
  end
end
