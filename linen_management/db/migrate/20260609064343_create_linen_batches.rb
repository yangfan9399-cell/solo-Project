class CreateLinenBatches < ActiveRecord::Migration[8.1]
  def change
    create_table :linen_batches do |t|
      t.string :batch_number
      t.references :hotel, null: false, foreign_key: true
      t.string :status, default: 'pending'
      t.references :handover_user, foreign_key: { to_table: :users }
      t.datetime :handover_at
      t.references :return_user, foreign_key: { to_table: :users }
      t.datetime :return_at
      t.references :inspector, foreign_key: { to_table: :users }
      t.datetime :inspected_at
      t.references :finance_user, foreign_key: { to_table: :users }
      t.datetime :settled_at
      t.boolean :discrepancy_confirmed_by_hotel, default: false
      t.boolean :discrepancy_confirmed_by_laundry, default: false
      t.text :notes

      t.timestamps
    end
    add_index :linen_batches, :batch_number, unique: true
    add_index :linen_batches, :status
  end
end
