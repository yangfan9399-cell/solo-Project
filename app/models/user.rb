class User < ApplicationRecord
  belongs_to :store, optional: true

  has_many :created_allocations, class_name: "Allocation", foreign_key: :creator_id
  has_many :created_loss_reports, class_name: "LossReport", foreign_key: :reporter_id
  has_many :reviewed_loss_reports, class_name: "LossReport", foreign_key: :reviewer_id
  has_many :workflow_nodes, dependent: :nullify

  validates :name, presence: true
  validates :employee_id, presence: true, uniqueness: true
  validates :role, presence: true

  enum :role, { store_manager: "store_manager", warehouse_dispatcher: "warehouse_dispatcher", finance_reviewer: "finance_reviewer" }
end
