class User < ApplicationRecord
  has_secure_password

  extend Enumerize
  enumerize :role, in: { handler: 'handler', reviewer: 'reviewer', admin: 'admin' }, default: :handler

  has_many :handled_records, class_name: 'InspectionRecord', foreign_key: 'handler_id'
  has_many :reviewed_records, class_name: 'InspectionRecord', foreign_key: 'reviewer_id'
  has_many :workflow_nodes, foreign_key: 'operator_id'
  has_many :uploaded_attachments, class_name: 'EvidenceAttachment', foreign_key: 'uploader_id'
  has_many :correction_records, foreign_key: 'handler_id'

  validates :username, presence: true, uniqueness: true
  validates :name, presence: true
  validates :email, presence: true, uniqueness: true
  validates :role, presence: true

  def handler?
    role == 'handler'
  end

  def reviewer?
    role == 'reviewer'
  end

  def admin?
    role == 'admin'
  end

  def can_handle?(record)
    return false if record.archived?
    return true if admin?
    return handler? && record.handler_id == id
  end

  def can_review?(record)
    return false if record.archived?
    return true if admin?
    return reviewer?
  end

  def can_view?(record)
    true
  end
end
