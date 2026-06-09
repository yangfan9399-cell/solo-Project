class CreateLinenTypes < ActiveRecord::Migration[8.1]
  def change
    create_table :linen_types do |t|
      t.string :name
      t.string :category
      t.decimal :unit_price, precision: 10, scale: 2

      t.timestamps
    end
    add_index :linen_types, :category
    add_index :linen_types, :name, unique: true
  end
end
