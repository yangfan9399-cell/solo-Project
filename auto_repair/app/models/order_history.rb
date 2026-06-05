class OrderHistory < ApplicationRecord
  belongs_to :repair_order
  belongs_to :user, optional: true

  validates :action, presence: true

  NODE_TYPES = %w[warranty fault quote repair review followup archive other].freeze
end
