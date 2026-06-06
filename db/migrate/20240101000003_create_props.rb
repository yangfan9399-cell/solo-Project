class CreateProps < ActiveRecord::Migration[8.1]
  def change
    create_table :props do |t|
      t.string :name, null: false
      t.string :category, null: false
      t.string :code
      t.text :description
      t.integer :status, null: false, default: 0
      t.decimal :value, precision: 10, scale: 2
      t.string :photo_url
      t.text :notes
      t.integer :total_borrow_count, default: 0
      t.integer :damage_count, default: 0

      t.timestamps
    end
    add_index :props, :category
    add_index :props, :status
  end
end
