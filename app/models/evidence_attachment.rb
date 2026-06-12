class EvidenceAttachment < ApplicationRecord
  enum :attachment_type, {
    photo: 0,
    video: 1,
    document: 2,
    maintenance_record: 3,
    notification: 4,
    other: 5
  }

  belongs_to :fault_record
  belongs_to :workflow_node, optional: true
  belongs_to :uploader, class_name: "User", foreign_key: "uploaded_by_id", optional: true

  validates :description, presence: true

  def attachment_type_text
    I18n.t("enums.evidence_attachment.attachment_type.#{attachment_type}", default: attachment_type.to_s)
  end

  def uploader_name
    uploader&.name || "系统"
  end

  def file_size_text
    return "未知" unless file_size
    if file_size < 1024
      "#{file_size} B"
    elsif file_size < 1024 * 1024
      "#{(file_size / 1024.0).round(2)} KB"
    else
      "#{(file_size / (1024.0 * 1024)).round(2)} MB"
    end
  end
end
