class OperationProcessor
  attr_reader :errors, :conflicts, :result

  def initialize(game_session)
    @game_session = game_session
    @errors = []
    @conflicts = []
    @result = nil
  end

  def place_container(container, berth, allow_warnings: false)
    @errors = []
    @conflicts = []

    conflicts = ConflictDetector.check_placement(@game_session, container, berth)
    @conflicts = conflicts

    errors = conflicts.select { |c| c[:severity] == :error }
    warnings = conflicts.select { |c| c[:severity] == :warning }

    unless errors.empty?
      @errors = errors.map { |e| e[:message] }
      return false
    end

    if warnings.any? && !allow_warnings
      @errors = warnings.map { |w| "警告: #{w[:message]}" }
      return false
    end

    ActiveRecord::Base.transaction do
      operation = @game_session.operations.create!(
        container: container,
        berth: berth,
        action_type: 'place',
        sequence: @game_session.next_sequence
      )

      @game_session.container_placements.create!(
        container: container,
        berth: berth
      )

      @game_session.recalculate_score!
      @game_session.check_completion!

      @result = {
        operation: operation,
        score: @game_session.score,
        status: @game_session.status,
        warnings: warnings
      }
    end

    true
  rescue ActiveRecord::RecordInvalid => e
    @errors << e.message
    false
  end

  def remove_container(container)
    @errors = []
    @conflicts = []

    conflicts = ConflictDetector.check_removal(@game_session, container)
    @conflicts = conflicts

    unless conflicts.empty?
      @errors = conflicts.map { |c| c[:message] }
      return false
    end

    ActiveRecord::Base.transaction do
      placement = @game_session.container_placements.find_by!(container: container)
      berth = placement.berth
      placement.destroy!

      @game_session.operations.create!(
        container: container,
        berth: berth,
        action_type: 'remove',
        sequence: @game_session.next_sequence
      )

      @game_session.recalculate_score!

      @result = {
        score: @game_session.score,
        status: @game_session.status
      }
    end

    true
  rescue ActiveRecord::RecordNotFound => e
    @errors << "货柜未找到: #{e.message}"
    false
  rescue ActiveRecord::RecordInvalid => e
    @errors << e.message
    false
  end

  def undo
    @errors = []

    last_op = @game_session.last_operation
    unless last_op
      @errors << "没有可撤销的操作"
      return false
    end

    ActiveRecord::Base.transaction do
      case last_op.action_type
      when 'place'
        placement = @game_session.container_placements.find_by(
          container: last_op.container,
          berth: last_op.berth
        )
        placement&.destroy!
      when 'remove'
        @game_session.container_placements.create!(
          container: last_op.container,
          berth: last_op.berth
        )
      end

      last_op.undo!
      @game_session.recalculate_score!

      @result = {
        undone_operation: last_op,
        score: @game_session.score
      }
    end

    true
  rescue ActiveRecord::RecordInvalid => e
    @errors << e.message
    false
  end

  def redo
    @errors = []

    last_undone = @game_session.operations.where(undone: true).order(sequence: :desc).first
    unless last_undone
      @errors << "没有可重做的操作"
      return false
    end

    ActiveRecord::Base.transaction do
      case last_undone.action_type
      when 'place'
        existing = @game_session.container_placements.find_by(container: last_undone.container)
        unless existing
          @game_session.container_placements.create!(
            container: last_undone.container,
            berth: last_undone.berth
          )
        end
      when 'remove'
        placement = @game_session.container_placements.find_by(
          container: last_undone.container,
          berth: last_undone.berth
        )
        placement&.destroy!
      end

      last_undone.redo!
      @game_session.recalculate_score!

      @result = {
        redone_operation: last_undone,
        score: @game_session.score
      }
    end

    true
  rescue ActiveRecord::RecordInvalid => e
    @errors << e.message
    false
  end
end
