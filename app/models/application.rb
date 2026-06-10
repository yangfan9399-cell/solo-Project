class Application < ApplicationRecord
  belongs_to :user
  belongs_to :track
  has_many :reviews
  has_one :contract
  has_one :settlement
  has_many :application_histories

  scope :recent, -> { order(created_at: :desc) }

  enum usage_scenario: {
    tv_ad: "tv_ad",
    online_video: "online_video",
    live_stream: "live_stream",
    film: "film",
    radio: "radio",
    other: "other"
  }

  enum status: {
    draft: "draft",
    pending_copyright: "pending_copyright",
    pending_legal: "pending_legal",
    pending_finance: "pending_finance",
    approved: "approved",
    rejected: "rejected",
    disputed: "disputed"
  }

  validates :client_name, presence: true
  validates :usage_scenario, presence: true
  validates :territory, presence: true
  validates :start_date, presence: true
  validates :end_date, presence: true
  validate :end_date_after_start_date

  after_create :create_history
  after_update :update_history

  def scenario_out_of_range?
    !track.available_for_scenario?(usage_scenario, territory, start_date, end_date)
  end

  def has_date_conflict?
    track.conflicting_applications(start_date, end_date).any?
  end

  def can_be_approved_by?(user)
    case status
    when "pending_copyright"
      user.copyright_admin?
    when "pending_legal"
      user.legal?
    when "pending_finance"
      user.finance?
    else
      false
    end
  end

  private

  def end_date_after_start_date
    return unless start_date && end_date
    errors.add(:end_date, "必须大于起始日期") if end_date < start_date
  end

  def create_history
    application_histories.create(
      action: "created",
      operator_id: user_id,
      details: "创建授权申请"
    )
  end

  def update_history
    if saved_change_to_status?
      application_histories.create(
        action: status,
        operator_id: user_id,
        details: "状态更新为 #{status}"
      )
    end
  end
end