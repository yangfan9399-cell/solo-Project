class CreateCompensations < ActiveRecord::Migration[8.1]
  def change
    create_table :compensations do |t|
      t.references :borrow_record, null: false, foreign_key: true
      t.references :handler, foreign_key: { to_table: :users }
      t.decimal :amount, precision: 10, scale: 2, null: false
      t.integer :status, null: false, default: 0
      t.text :basis
      t.text :dispute_reason
      t.text :resolution
      t.datetime :paid_at
      t.datetime :disputed_at
      t.datetime :resolved_at

      t.timestamps
    end
    add_index :compensations, :status
  end
end
