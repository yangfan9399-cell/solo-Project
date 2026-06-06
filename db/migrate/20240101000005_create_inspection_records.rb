class CreateInspectionRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :inspection_records do |t|
      t.references :borrow_record, null: false, foreign_key: true
      t.references :inspector, foreign_key: { to_table: :users }
      t.integer :inspection_type, null: false
      t.integer :condition, null: false
      t.text :notes
      t.text :issues_found

      t.timestamps
    end
    add_index :inspection_records, :inspection_type
  end
end
