class CreateBlacklists < ActiveRecord::Migration[8.1]
  def change
    create_table :blacklists do |t|
      t.string :license_plate, null: false
      t.text :reason, null: false
      t.references :added_by, null: false, foreign_key: { to_table: :employees }
      t.datetime :added_at, null: false
      t.boolean :is_active, default: true
      t.timestamps
    end
    add_index :blacklists, :license_plate
    add_index :blacklists, :is_active
  end
end
