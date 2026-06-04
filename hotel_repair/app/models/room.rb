class Room < ApplicationRecord
  enum :room_type, { standard: "standard", deluxe: "deluxe", suite: "suite", presidential: "presidential" }
  enum :status, { available: "available", occupied: "occupied", under_repair: "under_repair", reserved: "reserved" }

  has_many :original_repair_requests, class_name: "RepairRequest", foreign_key: :original_room_id, dependent: :nullify
  has_many :new_repair_requests, class_name: "RepairRequest", foreign_key: :new_room_id, dependent: :nullify

  validates :room_number, presence: true, uniqueness: true
  validates :floor, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validates :room_type, presence: true
  validates :status, presence: true

  scope :available_for_transfer, -> { where(status: :available) }
  scope :by_type, ->(type) { where(room_type: type) }

  def display_name
    "#{room_number} - #{room_type.humanize} (#{status.humanize})"
  end
end
