class CreateInscriptions < ActiveRecord::Migration[8.1]
  def change
    create_table :inscriptions do |t|
      t.references :rubbing, null: false, foreign_key: true
      t.text :content
      t.integer :line_number
      t.integer :column_number
      t.string :position
      t.boolean :is_broken
      t.text :broken_note

      t.timestamps
    end
  end
end
