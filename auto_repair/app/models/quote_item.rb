class QuoteItem < ApplicationRecord
  belongs_to :repair_order
  has_one :part

  validates :name, presence: true
  validates :item_type, presence: true
  validates :quantity, presence: true, numericality: { greater_than: 0 }
  validates :unit_price, presence: true, numericality: { greater_than_or_equal_to: 0 }

  ITEM_TYPES = %w[labor part material other].freeze

  before_save :calculate_total

  def calculate_total
    self.total_price = quantity * unit_price
  end
end
