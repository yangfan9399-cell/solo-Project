class CreateFootnotes < ActiveRecord::Migration[8.1]
  def change
    create_table :footnotes do |t|
      t.references :rubbing, null: false, foreign_key: true
      t.text :content
      t.string :source
      t.string :page
      t.text :note

      t.timestamps
    end
  end
end
