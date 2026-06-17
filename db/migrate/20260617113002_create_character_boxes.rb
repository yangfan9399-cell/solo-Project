class CreateCharacterBoxes < ActiveRecord::Migration[8.1]
  def change
    create_table :character_boxes do |t|
      t.references :rubbing, null: false, foreign_key: true
      t.references :inscription, null: false, foreign_key: true
      t.integer :char_index
      t.integer :x
      t.integer :y
      t.integer :width
      t.integer :height
      t.string :char
      t.text :note

      t.timestamps
    end
  end
end
