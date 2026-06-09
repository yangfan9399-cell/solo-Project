class SealApplication < ApplicationRecord
  belongs_to :contract
  belongs_to :seal
  belongs_to :applicant, class_name: 'User'
  has_many :approval_nodes, -> { chronological }, dependent: :destroy
  has_one :archive, dependent: :destroy

  enum :status, {
    draft: 0,
    pending_legal: 1,
    legal_approved: 2,
    legal_rejected: 3,
    version_conflict: 4,
    pending_seal: 5,
    seal_approved: 6,
    seal_rejected: 7,
    approver_absent: 8,
    pending_archive: 9,
    archived: 10,
    archive_missing_pages: 11
  }

  validates :purpose, presence: true
  validates :seal_id, presence: true
  validates :contract_id, presence: true
  validates :use_count, numericality: { only_integer: true, greater_than: 0 }

  before_validation :set_defaults, on: :create

  def set_defaults
    self.status ||= :draft
    self.use_count ||= 1
    self.version_conflict ||= false
  end

  def submit!
    return false unless draft?

    ActiveRecord::Base.transaction do
      update!(status: :pending_legal)
      approval_nodes.create!(
        role: :applicant,
        user: applicant,
        status: :approved,
        comment: '提交用印申请'
      )
      approval_nodes.create!(
        role: :legal,
        status: :pending
      )
    end
    true
  end

  def legal_approve!(user, comment = '')
    return false unless pending_legal?

    ActiveRecord::Base.transaction do
      if contract.latest_version?
        update!(status: :legal_approved, version_conflict: false)
        approval_nodes.pending.where(role: :legal).first&.update!(
          user: user,
          status: :approved,
          comment: comment.presence || '法务审核通过'
        )
        approval_nodes.create!(
          role: :seal_admin,
          status: :pending
        )
      else
        update!(status: :version_conflict, version_conflict: true)
        approval_nodes.pending.where(role: :legal).first&.update!(
          user: user,
          status: :rejected,
          comment: '合同版本不一致，请重新确认最新版本'
        )
      end
    end
    true
  end

  def legal_reject!(user, comment = '')
    return false unless pending_legal?

    ActiveRecord::Base.transaction do
      update!(status: :legal_rejected)
      approval_nodes.pending.where(role: :legal).first&.update!(
        user: user,
        status: :rejected,
        comment: comment.presence || '法务审核未通过'
      )
    end
    true
  end

  def resolve_version_conflict!(contract_id, user)
    return false unless version_conflict?

    new_contract = Contract.find(contract_id)
    return false unless new_contract.latest_version?

    ActiveRecord::Base.transaction do
      update!(contract: new_contract, status: :pending_legal, version_conflict: false)
      approval_nodes.create!(
        role: :applicant,
        user: user,
        status: :approved,
        comment: '更新合同版本后重新提交'
      )
      approval_nodes.create!(
        role: :legal,
        status: :pending
      )
    end
    true
  end

  def seal_approve!(user, comment = '')
    return false unless legal_approved?

    ActiveRecord::Base.transaction do
      update!(status: :seal_approved)
      approval_nodes.pending.where(role: :seal_admin).first&.update!(
        user: user,
        status: :approved,
        comment: comment.presence || '印章管理员执行用印'
      )
      approval_nodes.create!(
        role: :auditor,
        status: :pending
      )
    end
    true
  end

  def seal_reject!(user, comment = '')
    return false unless legal_approved?

    ActiveRecord::Base.transaction do
      update!(status: :seal_rejected)
      approval_nodes.pending.where(role: :seal_admin).first&.update!(
        user: user,
        status: :rejected,
        comment: comment.presence || '印章管理员拒绝用印'
      )
    end
    true
  end

  def mark_approver_absent!(user, comment = '')
    return false unless legal_approved?

    ActiveRecord::Base.transaction do
      update!(status: :approver_absent)
      approval_nodes.pending.where(role: :seal_admin).first&.update!(
        user: user,
        status: :skipped,
        comment: comment.presence || '审批人缺席，流程暂停'
      )
    end
    true
  end

  def resume_from_absence!(user)
    return false unless approver_absent?

    ActiveRecord::Base.transaction do
      update!(status: :pending_seal)
      approval_nodes.create!(
        role: :seal_admin,
        user: user,
        status: :pending,
        comment: '审批人到岗，流程恢复'
      )
    end
    true
  end

  def archive_approve!(user, file_name, page_count, missing_pages = 0)
    return false unless seal_approved?

    ActiveRecord::Base.transaction do
      if missing_pages > 0
        update!(status: :archive_missing_pages)
        create_archive!(
          auditor: user,
          file_name: file_name,
          page_count: page_count,
          missing_pages: missing_pages,
          status: :missing_pages
        )
        approval_nodes.pending.where(role: :auditor).first&.update!(
          user: user,
          status: :rejected,
          comment: "归档文件缺页 #{missing_pages} 页，请补全后重新归档"
        )
      else
        update!(status: :archived)
        create_archive!(
          auditor: user,
          file_name: file_name,
          page_count: page_count,
          missing_pages: 0,
          status: :completed
        )
        approval_nodes.pending.where(role: :auditor).first&.update!(
          user: user,
          status: :approved,
          comment: '归档审核通过'
        )
      end
    end
    true
  end

  def fix_archive!(user, file_name, page_count, missing_pages = 0)
    return false unless archive_missing_pages?

    ActiveRecord::Base.transaction do
      if missing_pages > 0
        archive.update!(
          file_name: file_name,
          page_count: page_count,
          missing_pages: missing_pages,
          status: :missing_pages
        )
        approval_nodes.create!(
          role: :auditor,
          user: user,
          status: :rejected,
          comment: "补全后仍缺页 #{missing_pages} 页"
        )
      else
        update!(status: :archived)
        archive.update!(
          file_name: file_name,
          page_count: page_count,
          missing_pages: 0,
          status: :completed
        )
        approval_nodes.create!(
          role: :auditor,
          user: user,
          status: :approved,
          comment: '补全后归档审核通过'
        )
      end
    end
    true
  end

  def approval_chain
    approval_nodes.chronological
  end

  def total_approval_duration
    first_node = approval_nodes.first
    last_node = approval_nodes.where(status: [:approved, :rejected]).last
    return nil unless first_node && last_node

    last_node.created_at - first_node.created_at
  end

  def status_name
    {
      draft: '草稿',
      pending_legal: '待法务审核',
      legal_approved: '法务已通过',
      legal_rejected: '法务已驳回',
      version_conflict: '合同版本不一致',
      pending_seal: '待印章管理员用印',
      seal_approved: '用印完成',
      seal_rejected: '用印被拒绝',
      approver_absent: '审批人缺席',
      pending_archive: '待归档',
      archived: '已归档',
      archive_missing_pages: '归档缺页'
    }[status.to_sym] || status.humanize
  end

  def anomaly_type
    case status
    when 'version_conflict' then '合同版本不一致'
    when 'legal_rejected' then '法务审核驳回'
    when 'seal_rejected' then '印章管理员拒绝'
    when 'approver_absent' then '审批人缺席'
    when 'archive_missing_pages' then '归档缺页'
    else nil
    end
  end

  def abnormal?
    anomaly_type.present?
  end

  class << self
    def by_department
      joins(contract: :department)
        .group('departments.name')
        .count
    end

    def by_seal_type
      joins(:seal)
        .group('seals.seal_type')
        .count
    end

    def by_anomaly
      where(status: [:version_conflict, :legal_rejected, :seal_rejected, :approver_absent, :archive_missing_pages])
        .group(:status)
        .count
    end

    def approval_duration_stats
      completed = where(status: [:archived, :archive_missing_pages, :seal_rejected, :legal_rejected])
      durations = completed.map do |app|
        first = app.approval_nodes.first
        last = app.approval_nodes.where(status: [:approved, :rejected]).last
        last && first ? (last.created_at - first.created_at) : nil
      end.compact

      return { avg: 0, min: 0, max: 0, count: 0 } if durations.empty?

      {
        avg: durations.sum / durations.size,
        min: durations.min,
        max: durations.max,
        count: durations.size
      }
    end
  end
end
