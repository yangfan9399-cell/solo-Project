class User < ApplicationRecord
  belongs_to :department

  has_many :submitted_contracts, class_name: 'Contract', foreign_key: 'applicant_id'
  has_many :submitted_applications, class_name: 'SealApplication', foreign_key: 'applicant_id'
  has_many :approval_nodes
  has_many :audited_archives, class_name: 'Archive', foreign_key: 'auditor_id'

  enum :role, { applicant: 0, legal: 1, seal_admin: 2, auditor: 3 }

  validates :name, presence: true
  validates :role, presence: true

  def role_name
    { applicant: '申请人', legal: '法务', seal_admin: '印章管理员', auditor: '审计员' }[role.to_sym] || role.humanize
  end
end
