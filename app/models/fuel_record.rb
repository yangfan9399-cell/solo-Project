class FuelRecord < ApplicationRecord
  belongs_to :vehicle

  validates :record_date, :fuel_amount, presence: true
  validates :fuel_amount, :fuel_cost, :start_mileage, :end_mileage, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  scope :abnormal, -> { where(is_abnormal: true) }
  scope :recent, ->(days = 30) { where('record_date >= ?', days.days.ago.to_date) }

  before_save :calculate_fuel_consumption
  before_save :check_abnormality

  def mileage_distance
    return 0 if end_mileage.nil? || start_mileage.nil?
    [end_mileage - start_mileage, 0].max
  end

  private

  def calculate_fuel_consumption
    if fuel_amount.present? && mileage_distance > 0
      self.fuel_consumption = (fuel_amount / mileage_distance * 100).round(2)
    end
  end

  def check_abnormality
    return unless fuel_consumption.present? && vehicle&.vehicle_model
    standard = vehicle.vehicle_model.standard_fuel_consumption
    return unless standard.present?
    threshold = standard * 1.3
    if fuel_consumption > threshold
      self.is_abnormal = true
      self.abnormal_note ||= "油耗超标：标准#{standard}L/100km，实际#{fuel_consumption}L/100km"
      add_fuel_abnormal_history if new_record? || is_abnormal_changed?
    end
  end

  def add_fuel_abnormal_history
    vehicle.history_nodes.create!(
      node_type: :fuel_abnormal,
      title: '油耗异常',
      description: abnormal_note || "油耗异常：#{fuel_consumption}L/100km",
      operator: recorded_by || '系统',
      operator_role: 'dispatcher',
      happened_at: Time.current,
      metadata: { fuel_record_id: id, fuel_consumption: fuel_consumption }
    )
  end
end
