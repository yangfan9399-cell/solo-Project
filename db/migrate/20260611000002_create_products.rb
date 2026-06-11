class CreateProducts < ActiveRecord::Migration[7.1]
  def change
    create_table :products do |t|
      t.string :name
      t.string :sku
      t.string :category
      t.decimal :original_price
      t.references :anchor, null: false, foreign_key: true

      t.timestamps
    end

    add_index :products, :sku, unique: true
  end
end
