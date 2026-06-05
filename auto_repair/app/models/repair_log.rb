class RepairLog < ApplicationRecord
  belongs_to :repair_order
  belongs_to :technician, class_name: 'User', optional: true

  validates :title, presence: true

  STATUSES = %w[in_progress completed delayed].freeze
end
