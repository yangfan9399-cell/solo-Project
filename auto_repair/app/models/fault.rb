class Fault < ApplicationRecord
  belongs_to :repair_order
  belongs_to :reported_by, class_name: 'User', optional: true

  validates :title, presence: true

  SEVERITIES = %w[low medium high critical].freeze
  CATEGORIES = %w[engine transmission brakes suspension electrical body other].freeze
end
