class ReviewLog < ApplicationRecord
  belongs_to :usage_scenario
  belongs_to :reviewer, class_name: 'User'

  REVIEW_TYPES = %w[legal_review operations_confirmation removal renewal].freeze
  STATUSES = %w[pending approved rejected].freeze

  validates :review_type, presence: true, inclusion: { in: REVIEW_TYPES }
  validates :status, presence: true, inclusion: { in: STATUSES }
  validates :reviewed_at, presence: true

  def review_type_label
    case review_type
    when 'legal_review' then '法务复核'
    when 'operations_confirmation' then '运营确认'
    when 'removal' then '下架确认'
    when 'renewal' then '续约审核'
    else review_type
    end
  end

  def status_label
    case status
    when 'pending' then '待审核'
    when 'approved' then '已通过'
    when 'rejected' then '已拒绝'
    else status
    end
  end
end