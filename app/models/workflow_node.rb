class WorkflowNode < ApplicationRecord
  belongs_to :trackable, polymorphic: true
  belongs_to :actor, class_name: "User", optional: true

  validates :node_type, presence: true
end
