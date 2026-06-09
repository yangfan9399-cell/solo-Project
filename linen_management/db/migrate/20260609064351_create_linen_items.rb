class CreateLinenItems < ActiveRecord::Migration[8.1]
  def change
    create_table :linen_items do |t|
      t.references :linen_batch, null: false, foreign_key: true
      t.references :linen_type, null: false, foreign_key: true
      t.integer :quantity_handed, default: 0
      t.integer :quantity_returned, default: 0
      t.integer :quantity_clean, default: 0
      t.integer :quantity_stained, default: 0
      t.integer :quantity_damaged, default: 0
      t.integer :quantity_short, default: 0

      t.timestamps
    end
    add_index :linen_items, [:linen_batch_id, :linen_type_id], unique: true
  end
end
