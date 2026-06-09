class CreateDamageClaims < ActiveRecord::Migration[8.1]
  def change
    create_table :damage_claims do |t|
      t.references :linen_batch, null: false, foreign_key: true
      t.references :linen_type, null: false, foreign_key: true
      t.integer :quantity, default: 0
      t.decimal :unit_price, precision: 10, scale: 2
      t.decimal :total_amount, precision: 10, scale: 2
      t.string :reason
      t.boolean :confirmed, default: false
      t.references :confirmed_by, foreign_key: { to_table: :users }
      t.datetime :confirmed_at

      t.timestamps
    end
    add_index :damage_claims, :reason
  end
end
