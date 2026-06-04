class RepairRequest < ApplicationRecord
  REPAIR_CATEGORIES = %w[plumbing electrical ac furniture cleanliness other].freeze

  enum :status, {
    reported: "reported",
    transfer_suggested: "transfer_suggested",
    transfer_confirmed: "transfer_confirmed",
    compensation_pending: "compensation_pending",
    compensation_approved: "compensation_approved",
    compensation_rejected: "compensation_rejected",
    compensation_exceeded: "compensation_exceeded",
    archived: "archived",
    cancelled: "cancelled"
  }

  enum :repair_category, REPAIR_CATEGORIES.to_h { |c| [c, c] }

  belongs_to :original_room, class_name: "Room"
  belongs_to :new_room, class_name: "Room", optional: true
  belongs_to :reporter, class_name: "User"
  belongs_to :manager, class_name: "User", optional: true

  has_one :compensation, dependent: :destroy
  has_many :status_logs, dependent: :destroy
  has_many :approval_escalations, dependent: :destroy

  validates :repair_category, presence: true
  validates :repair_reason, presence: true
  validates :status, presence: true
  validates :needs_transfer, inclusion: { in: [true, false] }
  validates :needs_compensation, inclusion: { in: [true, false] }

  scope :active, -> { where.not(status: [:archived, :cancelled]) }
  scope :by_status, ->(s) { where(status: s) }
  scope :by_category, ->(c) { where(repair_category: c) }
  scope :by_room_type, ->(t) { joins(:original_room).where(rooms: { room_type: t }) }
  scope :recent, -> { order(created_at: :desc) }

  def processing_duration
    return nil unless resolved_at
    resolved_at - created_at
  end

  def processing_duration_hours
    return nil unless processing_duration
    (processing_duration / 3600).round(2)
  end

  def transfer_status_label
    if new_room_id.present?
      "已转房至 #{new_room.room_number}"
    elsif needs_transfer?
      "待转房"
    else
      "无需转房"
    end
  end

  def compensation_status_label
    if compensation&.approved?
      "已批准 ¥#{compensation.amount}"
    elsif compensation&.rejected?
      "已驳回"
    elsif compensation&.exceeded?
      "超限待审批"
    elsif needs_compensation?
      "待审批"
    else
      "无需补偿"
    end
  end
end
