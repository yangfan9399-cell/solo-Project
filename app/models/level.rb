class Level < ApplicationRecord
  has_many :game_sessions, dependent: :destroy
  has_many :players, through: :game_sessions

  validates :name, presence: true
  validates :level_number, presence: true, uniqueness: true, numericality: { greater_than: 0 }
  validates :target_rpm, presence: true, numericality: { greater_than: 0 }
  validates :water_force, numericality: { greater_than: 0 }
  validates :difficulty, inclusion: { in: %w[easy medium hard expert] }

  def parsed_gears_config
    return [] unless gears_config.present?

    JSON.parse(gears_config, symbolize_names: true)
  rescue JSON::ParserError
    []
  end

  def gears_config=(value)
    if value.is_a?(Array) || value.is_a?(Hash)
      super(JSON.generate(value))
    else
      super(value)
    end
  end

  def waterwheel_gear
    parsed_gears_config.find { |g| g[:type] == 'waterwheel' }
  end

  def target_gear
    parsed_gears_config.find { |g| g[:type] == 'target' }
  end

  def available_gears
    parsed_gears_config.select { |g| g[:type] == 'available' }
  end

  def initial_gears_state
    parsed_gears_config.map do |gear|
      next if gear[:type] == 'available'

      {
        id: gear[:id],
        type: gear[:type],
        x: gear[:x],
        y: gear[:y],
        teeth: gear[:teeth],
        size: gear[:size],
        rotation: 0.0,
        connected_to: gear[:connected_to] || [],
        active: gear[:type] != 'target' || false
      }
    end.compact
  end

  def rpm_tolerance
    case difficulty
    when 'easy' then 15.0
    when 'medium' then 10.0
    when 'hard' then 5.0
    when 'expert' then 2.0
    else 10.0
    end
  end
end
