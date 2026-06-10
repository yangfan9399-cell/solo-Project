class CreateHistoryRecords < ActiveRecord::Migration[7.1]
  def change
    create_table :history_records do |t|
      t.references :report, null: false, foreign_key: true
      t.string :operation, null: false
      t.string :operator, null: false
      t.text :remark
      t.string :status_before
      t.string :status_after

      t.timestamps
    end

    add_index :history_records, [:report_id, :created_at]
  end
end