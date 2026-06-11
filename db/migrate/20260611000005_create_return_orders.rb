class CreateReturnOrders < ActiveRecord::Migration[7.1]
  def change
    create_table :return_orders do |t|
      t.string :return_no
      t.references :order, null: false, foreign_key: true
      t.text :reason
      t.string :customer_note
      t.decimal :refund_amount
      t.string :status, default: 'pending'
      t.boolean :missing_items, default: false
      t.boolean :damaged, default: false
      t.boolean :resaleable, default: false
      t.boolean :reported_loss, default: false

      t.timestamps
    end

    add_index :return_orders, :return_no, unique: true
  end
end
