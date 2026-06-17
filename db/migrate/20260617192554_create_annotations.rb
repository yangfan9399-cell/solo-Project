class CreateAnnotations < ActiveRecord::Migration[8.1]
  def change
    create_table :annotations do |t|
      t.references :record, null: false, foreign_key: true
      t.string :disease_type
      t.string :severity
      t.integer :x
      t.integer :y
      t.integer :width
      t.integer :height
      t.text :description
      t.string :color

      t.timestamps
    end
  end
end
