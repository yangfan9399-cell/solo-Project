class Vehicle < ApplicationRecord
  has_many :repair_orders, dependent: :destroy

  validates :plate_number, presence: true, uniqueness: true

  def full_name
    "#{brand} #{model} - #{plate_number}"
  end

  def warranty_repairs
    repair_orders.where(warranty_repair: true)
  end

  def total_repair_cost
    repair_orders.sum(:total_amount)
  end
end
