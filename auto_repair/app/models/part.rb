class Part < ApplicationRecord
  belongs_to :repair_order
  belongs_to :quote_item, optional: true

  validates :name, presence: true
  validates :quantity, presence: true, numericality: { greater_than: 0 }

  STATUSES = %w[pending ordered out_of_stock available used].freeze
end
