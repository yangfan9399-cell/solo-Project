class CreateAllocations < ActiveRecord::Migration[8.0]
  def change
    create_table :allocations do |t|
      t.references :source_store, null: false, foreign_key: { to_table: :stores }
      t.references :target_store, null: false, foreign_key: { to_table: :stores }
      t.references :creator, null: false, foreign_key: { to_table: :users }
      t.string :allocation_number, null: false, unique: true
      t.string :status, null: false, default: "pending" # pending, approved, in_transit, received, rejected, cancelled
      t.text :remark
      t.timestamps
    end
  end
end
