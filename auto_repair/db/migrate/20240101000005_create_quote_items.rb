class CreateQuoteItems < ActiveRecord::Migration[8.0]
  def change
    create_table :quote_items do |t|
      t.references :repair_order, null: false, foreign_key: true
      t.string :item_type, null: false
      t.string :name, null: false
      t.text :description
      t.decimal :quantity, precision: 10, scale: 2, default: 1
      t.decimal :unit_price, precision: 10, scale: 2, default: 0
      t.decimal :total_price, precision: 10, scale: 2, default: 0
      t.boolean :approved, default: false

      t.timestamps
    end
  end
end
