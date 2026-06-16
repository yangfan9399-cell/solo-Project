class GameSession < ApplicationRecord
  belongs_to :player
  belongs_to :level
  has_many :operation_histories, -> { order(move_number: :asc) }, dependent: :destroy

  validates :status, inclusion: { in: %w[playing completed failed abandoned] }
  validates :moves_count, numericality: { greater_than_or_equal_to: 0 }
  validates :time_spent, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  def parsed_gears_state
    return [] unless gears_state.present?

    JSON.parse(gears_state, symbolize_names: true)
  rescue JSON::ParserError
    []
  end

  def gears_state=(value)
    if value.is_a?(Array) || value.is_a?(Hash)
      super(JSON.generate(value))
    else
      super(value)
    end
  end

  def start!
    update!(
      status: 'playing',
      moves_count: 0,
      time_spent: 0,
      current_rpm: 0.0,
      gears_state: level.initial_gears_state
    )
  end

  def record_operation!(operation_type, gear_id = nil, from_state = nil, to_state = nil)
    transaction do
      self.moves_count += 1
      self.gears_state = to_state if to_state

      if to_state
        gears_config = parse_state_for_engine(to_state)
        engine = GearPhysicsEngine.new(gears_config, level.water_force)
        self.current_rpm = engine.target_rpm
      end

      save!

      operation_histories.create!(
        operation_type: operation_type,
        gear_id: gear_id,
        from_state: from_state ? JSON.generate(from_state) : nil,
        to_state: to_state ? JSON.generate(to_state) : nil,
        move_number: moves_count,
        undone: false
      )
    end
  end

  def undo!
    last_operation = operation_histories.where(undone: false).order(move_number: :desc).first
    return false unless last_operation

    transaction do
      last_operation.update!(undone: true)

      if last_operation.from_state.present?
        self.gears_state = JSON.parse(last_operation.from_state, symbolize_names: true)
        gears_config = parse_state_for_engine(parsed_gears_state)
        engine = GearPhysicsEngine.new(gears_config, level.water_force)
        self.current_rpm = engine.target_rpm
      end

      self.moves_count = [moves_count - 1, 0].max
      save!
    end

    true
  end

  def can_undo?
    operation_histories.where(undone: false).exists?
  end

  def complete!
    calculator = ScoreCalculator.new(level, self)
    result = calculator.calculate

    transaction do
      if result[:passed]
        update!(
          status: 'completed',
          score: result[:score],
          stars: result[:stars],
          completed_at: Time.current
        )
        player.update_stats!
      else
        update!(status: 'failed')
      end
    end

    result
  end

  def abandon!
    update!(status: 'abandoned')
  end

  private

  def parse_state_for_engine(state)
    state.is_a?(String) ? JSON.parse(state, symbolize_names: true) : state
  end
end
