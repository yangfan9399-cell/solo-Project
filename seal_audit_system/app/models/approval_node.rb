class ApprovalNode < ApplicationRecord
  belongs_to :seal_application
  belongs_to :user, optional: true

  enum :role, { applicant: 0, legal: 1, seal_admin: 2, auditor: 3 }
  enum :status, { pending: 0, approved: 1, rejected: 2, skipped: 3 }

  validates :role, presence: true
  validates :status, presence: true
  validates :user, presence: true, if: -> { approved? || rejected? || skipped? }

  scope :chronological, -> { order(created_at: :asc) }

  def role_name
    { applicant: '申请人', legal: '法务', seal_admin: '印章管理员', auditor: '审计员' }[role.to_sym] || role.humanize
  end

  def status_name
    { pending: '待处理', approved: '已通过', rejected: '已拒绝', skipped: '已跳过' }[status.to_sym] || status.humanize
  end
end
