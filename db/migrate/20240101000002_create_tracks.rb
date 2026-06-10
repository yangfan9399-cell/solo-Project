class CreateTracks < ActiveRecord::Migration[8.0]
  def change
    create_table :tracks do |t|
      t.string :title, null: false
      t.string :artist, null: false
      t.string :copyright_holder, null: false
      t.integer :duration, null: false
      t.string :genre
      t.jsonb :metadata, default: {}

      t.timestamps
    end

    add_index :tracks, :title
    add_index :tracks, :artist
    add_index :tracks, :copyright_holder
  end
end