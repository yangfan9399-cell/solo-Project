class CreateBorrowRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :borrow_records do |t|
      t.references :prop, null: false, foreign_key: true
      t.references :crew, null: false, foreign_key: true
      t.references :applicant, foreign_key: { to_table: :users }
      t.references :confirmer, foreign_key: { to_table: :users }
      t.references :auditor, foreign_key: { to_table: :users }

      t.integer :status, null: false, default: 0
      t.date :expected_start_date, null: false
      t.date :expected_end_date, null: false
      t.datetime :checked_out_at
      t.datetime :returned_at
      t.datetime :confirmed_at

      t.text :purpose
      t.text :return_notes
      t.integer :damage_type
      t.text :damage_description

      t.timestamps
    end
    add_index :borrow_records, :status
    add_index :borrow_records, [:prop_id, :expected_start_date, :expected_end_date], name: "index_borrow_records_on_prop_and_dates"
  end
end
