class Compensation < ApplicationRecord
  COMPENSATION_LIMIT = 5000.00

  enum :status, { pending: "pending", approved: "approved", rejected: "rejected", exceeded: "exceeded" }
  enum :compensation_type, {
    room_fee_discount: "room_fee_discount",
    free_night: "free_night",
    meal_voucher: "meal_voucher",
    cash: "cash",
    upgrade: "upgrade",
    other: "other"
  }

  belongs_to :repair_request
  belongs_to :approved_by, class_name: "User", optional: true

  has_many :approval_escalations, dependent: :destroy

  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :basis, presence: true
  validates :limit_amount, presence: true, numericality: { greater_than: 0 }
  validates :compensation_type, presence: true

  before_validation :set_default_limit, on: :create
  before_save :check_limit

  def exceeds_limit?
    amount > limit_amount
  end

  def escalation_pending?
    approval_escalations.where(status: :pending).exists?
  end

  def latest_escalation
    approval_escalations.order(created_at: :desc).first
  end

  def escalate!(level, reason, suggested_amount: nil)
    transaction do
      update!(status: :exceeded, block_reason: "补偿金额 ¥#{amount} 超出限额 ¥#{limit_amount}")
      approval_escalations.create!(
        level: level,
        reason: reason,
        suggested_amount: suggested_amount || amount,
        status: :pending
      )
    end
  end

  private

  def set_default_limit
    self.limit_amount ||= COMPENSATION_LIMIT
  end

  def check_limit
    if amount.present? && limit_amount.present? && amount > limit_amount && status != "exceeded"
      self.block_reason = "补偿金额 ¥#{amount} 超出审批限额 ¥#{limit_amount}，需升级审批"
    end
  end
end
