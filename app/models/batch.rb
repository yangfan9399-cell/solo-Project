class Batch < ApplicationRecord
  belongs_to :material
  belongs_to :store
  has_many :allocation_items, dependent: :nullify
  has_many :loss_reports, dependent: :nullify
  has_many :workflow_nodes, as: :trackable, dependent: :destroy

  validates :batch_number, presence: true, uniqueness: true
  validates :quantity, presence: true, numericality: { greater_than: 0 }
  validates :available_quantity, presence: true, numericality: { greater_than_or_equal_to: 0 }

  enum :status, { in_stock: "in_stock", allocated: "allocated", lost: "lost" }
  enum :warning_level, { normal: "normal", warning: "warning", critical: "critical" }

  def days_until_expiry
    return nil if expiry_date.blank?
    (expiry_date - Date.current).to_i
  end

  def near_expiry?
    return false if expiry_date.blank?
    days_until_expiry <= 7
  end
end
