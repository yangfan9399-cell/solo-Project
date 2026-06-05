class CreateOrderHistories < ActiveRecord::Migration[8.0]
  def change
    create_table :order_histories do |t|
      t.references :repair_order, null: false, foreign_key: true
      t.references :user, foreign_key: true
      t.string :action, null: false
      t.string :from_status
      t.string :to_status
      t.text :notes
      t.string :node_type

      t.timestamps
    end
  end
end
