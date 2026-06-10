class LossReport < ApplicationRecord
  belongs_to :allocation, optional: true
  belongs_to :batch
  belongs_to :reporter, class_name: "User"
  belongs_to :reviewer, class_name: "User", optional: true
  has_one :allocation_item, dependent: :nullify
  has_many :workflow_nodes, as: :trackable, dependent: :destroy

  validates :report_number, presence: true, uniqueness: true
  validates :loss_type, presence: true
  validates :quantity, presence: true, numericality: { greater_than: 0 }

  enum :loss_type, {
    near_expiry: "near_expiry",
    rejection: "rejection",
    quantity_discrepancy: "quantity_discrepancy",
    damage: "damage"
  }, prefix: true

  enum :status, { pending: "pending", approved: "approved", rejected: "rejected" }, prefix: true

  after_create :create_workflow_node

  def self.generate_number
    "LR-#{Date.today.strftime("%Y%m%d")}-#{SecureRandom.hex(4).upcase}"
  end

  private

  def create_workflow_node
    workflow_nodes.create!(
      node_type: "loss_report_created",
      actor: reporter,
      metadata: { loss_type: loss_type, quantity: quantity }
    )
  end
end
