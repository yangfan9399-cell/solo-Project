class CreateEvidenceAttachments < ActiveRecord::Migration[8.1]
  def change
    create_table :evidence_attachments do |t|
      t.bigint :inspection_record_id
      t.bigint :workflow_node_id
      t.bigint :uploader_id
      t.string :file_type
      t.text :description
      t.string :file_name
      t.bigint :file_size

      t.timestamps
    end
    add_index :evidence_attachments, :inspection_record_id
    add_index :evidence_attachments, :workflow_node_id
    add_index :evidence_attachments, :uploader_id
  end
end
