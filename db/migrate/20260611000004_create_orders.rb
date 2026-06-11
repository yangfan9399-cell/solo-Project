class CreateOrders < ActiveRecord::Migration[7.1]
  def change
    create_table :orders do |t|
      t.string :order_no
      t.string :user_name
      t.string :user_phone
      t.references :product, null: false, foreign_key: true
      t.references :live_session, null: false, foreign_key: true
      t.integer :quantity
      t.decimal :unit_price
      t.decimal :total_amount
      t.string :status, default: 'completed'

      t.timestamps
    end

    add_index :orders, :order_no, unique: true
  end
end
