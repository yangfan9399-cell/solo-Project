class CreateInspectionRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :inspection_records do |t|
      t.string :record_no
      t.string :source
      t.string :toilet_name
      t.string :toilet_address
      t.datetime :inspection_time
      t.string :defect_type
      t.text :defect_description
      t.integer :score_before
      t.integer :score_after
      t.string :responsible_party
      t.bigint :handler_id
      t.bigint :reviewer_id
      t.datetime :deadline
      t.decimal :amount
      t.string :evidence_conclusion
      t.string :current_state
      t.string :sample_type
      t.text :block_reason
      t.text :remedy_path
      t.datetime :archived_at

      t.timestamps
    end
    add_index :inspection_records, :record_no
    add_index :inspection_records, :handler_id
    add_index :inspection_records, :reviewer_id
  end
end
