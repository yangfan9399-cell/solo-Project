class ConsumptionRecord < ApplicationRecord
  belongs_to :course_package
  belongs_to :performed_by, class_name: 'User'

  RECORD_TYPES = %w[normal exchange].freeze

  validates :service_name, presence: true
  validates :sessions_used, presence: true, numericality: { greater_than: 0 }
  validates :record_type, presence: true, inclusion: { in: RECORD_TYPES }

  def exchange?
    record_type == 'exchange'
  end
end
