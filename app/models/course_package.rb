class CoursePackage < ApplicationRecord
  belongs_to :member
  belongs_to :consultant, class_name: 'User'
  has_many :consumption_records, dependent: :destroy
  has_many :review_nodes, dependent: :destroy
  has_many :responsibility_changes, dependent: :destroy

  STATUSES = %w[active refund_pending refund_approved refund_rejected archived].freeze

  validates :name, presence: true
  validates :original_price, presence: true, numericality: { greater_than: 0 }
  validates :total_sessions, presence: true, numericality: { greater_than: 0 }
  validates :remaining_sessions, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :status, presence: true, inclusion: { in: STATUSES }

  before_validation :set_defaults, on: :create

  def price_per_session
    original_price / total_sessions.to_f
  end

  def used_sessions
    total_sessions - remaining_sessions
  end

  def consumed_amount
    used_sessions * price_per_session
  end

  def calculate_refund(algorithm = 'standard')
    case algorithm
    when 'standard'
      remaining_sessions * price_per_session
    when 'discounted'
      (remaining_sessions * price_per_session) * 0.8
    when 'penalty'
      [(remaining_sessions * price_per_session) - consumed_amount * 0.3, 0].max
    else
      remaining_sessions * price_per_session
    end.round(2)
  end

  def consume_service!(service_name, sessions, performed_by, customer_notes = nil, record_type = 'normal')
    return false if remaining_sessions < sessions
    return false if archived?

    transaction do
      consumption_records.create!(
        service_name:,
        sessions_used: sessions,
        performed_by:,
        performed_at: Time.current,
        customer_notes:,
        record_type:
      )
      decrement!(:remaining_sessions, sessions)
    end
    true
  end

  def request_refund!(reviewer, algorithm = 'standard', dispute_reason = nil)
    return false if archived?

    transaction do
      refund_amount = calculate_refund(algorithm)
      node = review_nodes.create!(
        reviewer:,
        status: 'pending',
        refund_amount:,
        refund_algorithm: algorithm,
        dispute_reason:
      )
      update!(status: 'refund_pending')
      node
    end
  end

  def transfer_consultant!(to_consultant, transferred_by, reason)
    return false if archived?

    transaction do
      responsibility_changes.create!(
        from_consultant: consultant,
        to_consultant:,
        transferred_by:,
        transfer_reason: reason,
        transferred_at: Time.current
      )
      update!(consultant: to_consultant)
    end
    true
  end

  def archived?
    status == 'archived'
  end

  def current_review_node
    review_nodes.order(created_at: :desc).first
  end

  private

  def set_defaults
    self.status ||= 'active'
    self.remaining_sessions ||= total_sessions
    self.purchased_at ||= Time.current
  end
end
