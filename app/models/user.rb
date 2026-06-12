class User < ApplicationRecord
  has_secure_password validations: false

  enum :role, { field_handler: 0, quality_reviewer: 1, admin: 2 }

  has_many :reported_fault_records, class_name: "FaultRecord", foreign_key: "reported_by_id"
  has_many :owned_fault_records, class_name: "FaultRecord", foreign_key: "current_owner_id"
  has_many :workflow_nodes, foreign_key: "operator_id"
  has_many :evidence_attachments, foreign_key: "uploaded_by_id"

  validates :name, presence: true
  validates :email, presence: true, uniqueness: true

  def display_name
    "#{name} (#{role_text})"
  end

  def role_text
    I18n.t("enums.user.role.#{role}", default: role.to_s)
  end

  def field_handler?
    role == "field_handler"
  end

  def quality_reviewer?
    role == "quality_reviewer"
  end

  def can_process?(fault_record)
    return false if fault_record.is_archived?
    return true if admin?
    return field_handler? && fault_record.in_processing_status? && fault_record.current_owner_id == id
  end

  def can_review?(fault_record)
    return false if fault_record.is_archived?
    return true if admin?
    return quality_reviewer? && fault_record.in_review_status?
  end
end
