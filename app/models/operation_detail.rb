class OperationDetail < ApplicationRecord
  belongs_to :game_session

  enum :operation_type, {
    adjust_temperature: 0,
    add_nutrient: 1,
    adjust_moisture: 2,
    place_antibiotic: 3,
    adjust_ph: 4,
    simulate_growth: 5,
    rollback: 6,
    recalculate: 7
  }, prefix: false

  validates :round_number, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :operation_type, presence: true

  scope :for_round, ->(r) { where(round_number: r) }
  scope :moisture_operations, -> { where(operation_type: [:adjust_moisture, :simulate_growth]) }
  scope :antibiotic_operations, -> { where(operation_type: :place_antibiotic) }

  def operation_label
    {
      adjust_temperature: "温度调节",
      add_nutrient: "营养补充",
      adjust_moisture: "水分调节",
      place_antibiotic: "放置抑菌圈",
      adjust_ph: "pH调节",
      simulate_growth: "生长模拟",
      rollback: "回滚操作",
      recalculate: "重新计算"
    }[operation_type.to_sym] || operation_type
  end

  def before_and_after
    before = {}
    after = {}
    case operation_type.to_sym
    when :adjust_temperature
      before[:temperature] = (game_session&.temperature || 37.0) - temperature_adjustment
      after[:temperature] = game_session&.temperature || 37.0
    when :add_nutrient
      before[:nutrient] = (game_session&.current_nutrient_level || 50.0) - nutrient_adjustment
      after[:nutrient] = game_session&.current_nutrient_level || 50.0
    when :adjust_moisture
      before[:moisture] = moisture_level - moisture_adjustment
      after[:moisture] = moisture_level
    when :adjust_ph
      before[:ph] = (game_session&.ph_level || 7.0) - ph_adjustment
      after[:ph] = game_session&.ph_level || 7.0
    end
    { before: before, after: after }
  end
end
