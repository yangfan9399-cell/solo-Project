class FixEvidenceAttachmentsFields < ActiveRecord::Migration[8.1]
  def change
    rename_column :evidence_attachments, :file_type, :attachment_type
    add_column :evidence_attachments, :shoot_time, :datetime
    add_column :evidence_attachments, :shoot_location, :string
    add_column :evidence_attachments, :operator, :string
  end
end
