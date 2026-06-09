class LinenItem < ApplicationRecord
  belongs_to :linen_batch
  belongs_to :linen_type

  validates :quantity_handed, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :quantity_returned, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, allow_nil: true
  validates :quantity_clean, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, allow_nil: true
  validates :quantity_stained, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, allow_nil: true
  validates :quantity_damaged, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, allow_nil: true
  validates :quantity_short, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, allow_nil: true
  validates :linen_type, uniqueness: { scope: :linen_batch }

  before_save :calculate_shortage

  def calculate_shortage
    if quantity_handed.present? && quantity_returned.present?
      self.quantity_short = [quantity_handed - quantity_returned, 0].max
    end
  end

  def total_amount
    (quantity_damaged.to_i + quantity_short.to_i) * linen_type.unit_price
  end

  def has_issues?
    quantity_stained.to_i > 0 || quantity_damaged.to_i > 0 || quantity_short.to_i > 0
  end
end
