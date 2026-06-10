class UsageScenario < ApplicationRecord
  belongs_to :material
  belongs_to :license, optional: true
  belongs_to :bound_by, class_name: 'User'
  has_many :review_logs, dependent: :destroy

  COLUMNS = %w[首页 列表页 详情页 视频页 广告位 专题页 活动页].freeze
  CHANNELS = %w[web ios android h5 mini_program].freeze
  STATUSES = %w[pending active blocked removed].freeze
  APPROVAL_STATUSES = %w[pending legal_reviewed operations_confirmed rejected].freeze

  validates :column_name, presence: true, inclusion: { in: COLUMNS }
  validates :channel, presence: true, inclusion: { in: CHANNELS }
  validates :status, presence: true, inclusion: { in: STATUSES }
  validates :approval_status, presence: true, inclusion: { in: APPROVAL_STATUSES }

  def scope_exceeded?
    return false unless license

    authorized_channels = JSON.parse(license.authorized_channels || '[]')
    !authorized_channels.include?(channel)
  end

  def publish_blocked?
    return true if status == 'blocked'
    return true if approval_status != 'operations_confirmed'

    if license
      license.status.in?(['expired', 'document_missing']) || scope_exceeded?
    else
      true
    end
  end

  def latest_review
    review_logs.order(created_at: :desc).first
  end

  def blocking_reason
    return '未完成审核' if approval_status != 'operations_confirmed'
    return '素材已下架' if status == 'blocked'
    return '授权文件缺失' unless license&.contract_file.present?
    return '授权已到期' if license.expired?
    return '使用范围超限' if scope_exceeded?

    nil
  end

  def can_publish?
    !publish_blocked?
  end

  def confirm_by_legal!(reviewer, comment = nil)
    review_logs.create!(
      reviewer: reviewer,
      review_type: 'legal_review',
      status: 'approved',
      comment: comment,
      reviewed_at: Time.current
    )
    update(approval_status: 'legal_reviewed')
  end

  def confirm_by_operations!(reviewer, comment = nil)
    review_logs.create!(
      reviewer: reviewer,
      review_type: 'operations_confirmation',
      status: 'approved',
      comment: comment,
      reviewed_at: Time.current
    )
    update(approval_status: 'operations_confirmed', status: 'active')
  end

  def reject!(reviewer, comment)
    review_logs.create!(
      reviewer: reviewer,
      review_type: approval_status == 'pending' ? 'legal_review' : 'operations_confirmation',
      status: 'rejected',
      comment: comment,
      reviewed_at: Time.current
    )
    update(status: 'blocked')
  end

  def remove!(reviewer, comment = nil)
    review_logs.create!(
      reviewer: reviewer,
      review_type: 'removal',
      status: 'approved',
      comment: comment,
      reviewed_at: Time.current
    )
    update(status: 'removed')
  end
end