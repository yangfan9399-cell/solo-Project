class CreateStores < ActiveRecord::Migration[8.0]
  def change
    create_table :stores do |t|
      t.references :region, null: false, foreign_key: true
      t.string :name, null: false
      t.string :code, null: false, unique: true
      t.string :address
      t.string :store_type, null: false, default: "restaurant" # restaurant, warehouse
      t.string :status, null: false, default: "active"
      t.timestamps
    end
  end
end
