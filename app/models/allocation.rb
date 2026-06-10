class Allocation < ApplicationRecord
  belongs_to :source_store, class_name: "Store"
  belongs_to :target_store, class_name: "Store"
  belongs_to :creator, class_name: "User"
  has_many :items, class_name: "AllocationItem", dependent: :destroy
  has_many :loss_reports, dependent: :nullify
  has_many :workflow_nodes, as: :trackable, dependent: :destroy

  validates :allocation_number, presence: true, uniqueness: true

  enum :status, {
    pending: "pending",
    approved: "approved",
    in_transit: "in_transit",
    received: "received",
    rejected: "rejected",
    cancelled: "cancelled"
  }, prefix: true

  after_create :create_workflow_node

  def self.generate_number
    "ALL-#{Date.today.strftime("%Y%m%d")}-#{SecureRandom.hex(4).upcase}"
  end

  private

  def create_workflow_node
    workflow_nodes.create!(
      node_type: "allocation_created",
      actor: creator,
      metadata: { status: status }
    )
  end
end
