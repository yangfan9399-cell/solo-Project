class AllocationItem < ApplicationRecord
  belongs_to :allocation
  belongs_to :batch
  has_one :loss_report, dependent: :nullify
  has_many :workflow_nodes, as: :trackable, dependent: :destroy

  validates :quantity, presence: true, numericality: { greater_than: 0 }

  enum :status, { pending: "pending", in_transit: "in_transit", received: "received", rejected: "rejected" }, prefix: true

  after_update :create_workflow_node

  private

  def create_workflow_node
    return unless saved_change_to_status?

    workflow_nodes.create!(
      node_type: status,
      actor: allocation.creator,
      metadata: { quantity: quantity, actual_quantity: actual_quantity }
    )
  end
end
