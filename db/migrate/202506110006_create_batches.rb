class CreateBatches < ActiveRecord::Migration[8.0]
  def change
    create_table :batches do |t|
      t.references :material, null: false, foreign_key: true
      t.references :store, null: false, foreign_key: true
      t.string :batch_number, null: false, unique: true
      t.date :production_date
      t.date :expiry_date
      t.decimal :quantity, precision: 10, scale: 2, null: false
      t.decimal :available_quantity, precision: 10, scale: 2, null: false
      t.string :status, null: false, default: "in_stock" # in_stock, allocated, lost
      t.string :warning_level, null: false, default: "normal" # normal, warning, critical
      t.timestamps
    end
  end
end
