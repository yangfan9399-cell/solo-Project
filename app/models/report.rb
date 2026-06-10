class Report < ApplicationRecord
  belongs_to :exam
  has_one :patient, through: :exam
  has_many :authorizations, dependent: :destroy
  has_many :history_records, dependent: :destroy

  STATUS_ENUM = {
    generated: "generated",
    pickup_requested: "pickup_requested",
    confirmed: "confirmed",
    delivered: "delivered",
    reissue_requested: "reissue_requested",
    reissue_approved: "reissue_approved",
    reissue_rejected: "reissue_rejected",
    reissued: "reissued",
    exception: "exception"
  }.freeze

  PICKUP_TYPES = [
    ["本人领取", "self"],
    ["授权代领", "authorized"],
    ["快递邮寄", "delivery"]
  ].freeze

  EXCEPTION_REASONS = [
    ["身份证不符", "id_mismatch"],
    ["补打次数超限", "reissue_limit_exceeded"],
    ["授权材料不全", "auth_incomplete"],
    ["其他", "other"]
  ].freeze

  MAX_REISSUE_COUNT = 3

  enum :status, STATUS_ENUM

  validates :report_no, presence: true, uniqueness: true
  validates :issue_date, presence: true
  validates :status, presence: true, inclusion: { in: STATUS_ENUM.values }

  after_initialize :set_default_status, if: :new_record?

  def set_default_status
    self.status ||= :generated
  end

  def can_request_pickup?
    generated? || delivered?
  end

  def can_confirm?
    pickup_requested?
  end

  def can_deliver?
    confirmed? && !has_exception?
  end

  def can_request_reissue?
    delivered? && reissue_count < MAX_REISSUE_COUNT
  end

  def can_approve_reissue?
    reissue_requested?
  end

  def has_exception?
    exception? || id_mismatch?
  end

  def id_mismatch?
    history_records.where(operation: "id_mismatch").exists?
  end

  def add_history(operation, operator, remark = nil)
    history_records.create!(
      operation: operation,
      operator: operator,
      remark: remark,
      status_before: status,
      status_after: status
    )
  end
end