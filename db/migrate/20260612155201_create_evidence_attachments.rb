class CreateEvidenceAttachments < ActiveRecord::Migration[8.1]
  def change
    create_table :evidence_attachments do |t|
      t.references :fault_record, null: false, foreign_key: true
      t.references :workflow_node, foreign_key: true
      t.integer :uploaded_by_id
      t.integer :attachment_type, default: 0
      t.text :description
      t.string :file_name
      t.string :content_type
      t.bigint :file_size

      t.timestamps
    end
    add_index :evidence_attachments, :uploaded_by_id
    add_index :evidence_attachments, :attachment_type
  end
end
