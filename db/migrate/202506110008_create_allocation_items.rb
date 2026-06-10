class CreateAllocationItems < ActiveRecord::Migration[8.0]
  def change
    create_table :allocation_items do |t|
      t.references :allocation, null: false, foreign_key: true
      t.references :batch, null: false, foreign_key: true
      t.decimal :quantity, precision: 10, scale: 2, null: false
      t.decimal :actual_quantity, precision: 10, scale: 2
      t.string :status, null: false, default: "pending" # pending, in_transit, received, rejected
      t.text :rejection_reason
      t.timestamps
    end
  end
end