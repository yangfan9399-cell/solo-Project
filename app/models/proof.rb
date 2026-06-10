class Proof < ApplicationRecord
  belongs_to :work_order
  has_many :color_measurements, dependent: :destroy

  enum :status, %i[pending measured confirmed rejected]

  def latest_color_measurement
    color_measurements.order(measured_at: :desc).first
  end

  def has_qualified_measurement?
    latest_color_measurement&.is_qualified == true
  end

  def has_unqualified_measurement?
    latest_color_measurement&.is_qualified == false
  end
end