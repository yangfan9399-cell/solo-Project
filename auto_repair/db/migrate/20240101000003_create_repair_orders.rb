class CreateRepairOrders < ActiveRecord::Migration[8.0]
  def change
    create_table :repair_orders do |t|
      t.references :vehicle, null: false, foreign_key: true
      t.references :service_advisor, foreign_key: { to_table: :users }
      t.references :technician, foreign_key: { to_table: :users }
      t.references :manager, foreign_key: { to_table: :users }
      t.references :customer_service, foreign_key: { to_table: :users }
      t.references :parent_order, foreign_key: { to_table: :repair_orders }
      t.string :order_number, null: false
      t.string :status, null: false, default: 'draft'
      t.text :customer_description
      t.decimal :budget_limit, precision: 10, scale: 2
      t.decimal :total_amount, precision: 10, scale: 2, default: 0
      t.boolean :quote_approved, default: false
      t.boolean :warranty_repair, default: false
      t.integer :warranty_months
      t.date :warranty_expires_at
      t.boolean :archived, default: false
      t.text :manager_note
      t.text :follow_up_note

      t.timestamps
    end
    add_index :repair_orders, :order_number, unique: true
  end
end
