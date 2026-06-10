class CreateSettlements < ActiveRecord::Migration[8.0]
  def change
    create_table :settlements do |t|
      t.references :application, null: false, foreign_key: true
      t.decimal :total_amount, null: false, precision: 12, scale: 2
      t.decimal :copyright_holder_share, null: false, precision: 5, scale: 2
      t.decimal :agent_share, null: false, precision: 5, scale: 2
      t.decimal :tax_amount, precision: 10, scale: 2
      t.string :status, null: false, default: "pending"
      t.text :dispute_reason
      t.datetime :confirmed_at

      t.timestamps
    end

    add_index :settlements, :application_id
    add_index :settlements, :status
  end
end