class ScoreCalculator
  attr_reader :level, :game_session, :gear_engine

  def initialize(level, game_session)
    @level = level
    @game_session = game_session
    gears_config = parse_gears_state(game_session.gears_state)
    @gear_engine = GearPhysicsEngine.new(gears_config, level.water_force)
  end

  def calculate
    actual_rpm = gear_engine.target_rpm
    target_rpm = level.target_rpm
    tolerance = level.rpm_tolerance
    connected = gear_engine.target_connected?

    result = {
      actual_rpm: actual_rpm,
      target_rpm: target_rpm,
      rpm_difference: (actual_rpm - target_rpm).abs.round(2),
      target_connected: connected,
      moves_count: game_session.moves_count,
      time_spent: game_session.time_spent,
      passed: false,
      stars: 0,
      score: 0,
      breakdown: {}
    }

    unless connected
      result[:failure_reason] = 'target_not_connected'
      return result
    end

    rpm_diff = (actual_rpm - target_rpm).abs
    if rpm_diff > tolerance
      result[:failure_reason] = 'rpm_out_of_range'
      return result
    end

    result[:passed] = true

    moves = game_session.moves_count
    time = game_session.time_spent || 0

    base_score = 1000

    rpm_accuracy = [0, 100 - (rpm_diff / tolerance * 100)].max
    rpm_score = (rpm_accuracy * 5).to_i

    move_score = calculate_move_score(moves)
    time_score = calculate_time_score(time)
    stars = calculate_stars(moves, time, rpm_diff)

    total_score = base_score + rpm_score + move_score + time_score

    result[:score] = total_score
    result[:stars] = stars
    result[:breakdown] = {
      base_score: base_score,
      rpm_score: rpm_score,
      move_score: move_score,
      time_score: time_score
    }

    result
  end

  private

  def calculate_move_score(moves)
    three_star = level.three_star_moves
    two_star = level.two_star_moves

    if moves <= three_star
      500
    elsif moves <= two_star
      300 - ((moves - three_star) * 20)
    else
      [100 - ((moves - two_star) * 10), 0].max
    end
  end

  def calculate_time_score(time)
    time_limit = level.time_limit
    remaining = [time_limit - time, 0].max

    (remaining.to_f / time_limit * 300).to_i
  end

  def calculate_stars(moves, time, rpm_diff)
    tolerance = level.rpm_tolerance
    three_star = level.three_star_moves
    two_star = level.two_star_moves
    time_limit = level.time_limit

    rpm_perfect = rpm_diff <= tolerance * 0.3

    if moves <= three_star && time <= time_limit * 0.5 && rpm_perfect
      3
    elsif moves <= two_star && time <= time_limit * 0.8
      2
    else
      1
    end
  end

  def parse_gears_state(state)
    return [] unless state.present?

    JSON.parse(state, symbolize_names: true)
  rescue JSON::ParserError
    []
  end
end
