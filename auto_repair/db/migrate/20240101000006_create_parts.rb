class CreateParts < ActiveRecord::Migration[8.0]
  def change
    create_table :parts do |t|
      t.references :repair_order, null: false, foreign_key: true
      t.references :quote_item, foreign_key: true
      t.string :name, null: false
      t.string :part_number
      t.string :brand
      t.decimal :quantity, precision: 10, scale: 2, default: 1
      t.decimal :unit_price, precision: 10, scale: 2, default: 0
      t.string :status, default: 'pending'
      t.text :notes

      t.timestamps
    end
  end
end
