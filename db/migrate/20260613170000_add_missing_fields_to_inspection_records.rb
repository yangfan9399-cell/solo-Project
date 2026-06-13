class AddMissingFieldsToInspectionRecords < ActiveRecord::Migration[8.1]
  def change
    add_column :inspection_records, :review_comment, :text
    add_column :inspection_records, :accepted_at, :datetime
    add_column :inspection_records, :processing_at, :datetime
    add_column :inspection_records, :review_pending_at, :datetime
    add_column :inspection_records, :reviewing_at, :datetime
    add_column :inspection_records, :rejected_at, :datetime
    add_column :inspection_records, :diff_fields, :jsonb

    add_column :workflow_nodes, :user_id, :bigint
    add_index :workflow_nodes, :user_id
  end
end
