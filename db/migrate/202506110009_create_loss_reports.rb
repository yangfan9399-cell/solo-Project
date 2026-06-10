class CreateLossReports < ActiveRecord::Migration[8.0]
  def change
    create_table :loss_reports do |t|
      t.references :allocation, foreign_key: true
      t.references :batch, null: false, foreign_key: true
      t.references :reporter, null: false, foreign_key: { to_table: :users }
      t.references :reviewer, foreign_key: { to_table: :users }
      t.string :report_number, null: false, unique: true
      t.string :loss_type, null: false # near_expiry, rejection, quantity_discrepancy, damage
      t.decimal :quantity, precision: 10, scale: 2, null: false
      t.string :status, null: false, default: "pending" # pending, approved, rejected
      t.text :reason
      t.text :review_comment
      t.timestamps
    end
  end
end
