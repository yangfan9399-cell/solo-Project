class GrowthHistory < ApplicationRecord
  belongs_to :game_session

  validates :round_number, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :event_type, presence: true

  scope :for_round, ->(r) { where(round_number: r) }
  scope :overheated_events, -> { where(is_overheated: true) }
  scope :growth_stopped_events, -> { where(is_growth_stopped: true) }

  EVENT_TYPES = {
    growth: "正常生长",
    overheat: "过热停止",
    stagnation: "生长停滞",
    expansion: "区域扩张",
    target_reached: "达标"
  }

  def event_type_label
    EVENT_TYPES[event_type.to_sym] || event_type
  end

  def target_zone_cells_array
    JSON.parse(target_zone_reached_cells || "[]")
  end

  def new_cells_array
    JSON.parse(new_growth_cells || "[]")
  end

  def stagnated_cells_array
    JSON.parse(stagnated_cells || "[]")
  end

  def overall_factor
    (temperature_factor * moisture_factor * antibiotic_factor).round(4)
  end

  def factor_breakdown
    {
      temperature: { value: temperature_factor, status: temperature_factor < 0.5 ? "critical" : temperature_factor < 0.8 ? "warning" : "normal" },
      moisture: { value: moisture_factor, status: moisture_factor < 0.5 ? "critical" : moisture_factor < 0.8 ? "warning" : "normal" },
      antibiotic: { value: antibiotic_factor, status: antibiotic_factor < 0.5 ? "critical" : antibiotic_factor < 0.8 ? "warning" : "normal" },
      overall: overall_factor
    }
  end
end
