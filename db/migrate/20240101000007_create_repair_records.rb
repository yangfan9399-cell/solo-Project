class CreateRepairRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :repair_records do |t|
      t.references :prop, null: false, foreign_key: true
      t.references :borrow_record, foreign_key: true
      t.references :handler, foreign_key: { to_table: :users }
      t.integer :status, null: false, default: 0
      t.text :damage_description
      t.text :repair_method
      t.decimal :cost, precision: 10, scale: 2
      t.date :start_date
      t.date :expected_finish_date
      t.date :finished_date

      t.timestamps
    end
    add_index :repair_records, :status
  end
end
