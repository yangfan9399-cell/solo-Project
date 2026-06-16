class GameSessionsController < ApplicationController
  before_action :find_or_create_local_player
  before_action :set_game_session, only: [:show, :destroy,
                                          :place_container, :remove_container,
                                          :undo, :redo, :recalculate_score,
                                          :time_expired, :cancel, :operations]
  before_action :ensure_json_format, only: [:place_container, :remove_container,
                                             :undo, :redo, :recalculate_score,
                                             :time_expired, :operations]

  def index
    @player = current_player
    @game_sessions = @player.game_sessions.completed.order(finished_at: :desc).limit(20)
    @active_session = @player.game_sessions.active.first
  end

  def show
    @level = @game_session.level
    @containers = @level.sorted_containers
    @berths = @level.sorted_berths
    @placed_ids = @game_session.placed_container_ids
    @operations = @game_session.operations_in_order
    @score_details = GameScoreCalculator.new(@game_session).calculate_detailed

    if @game_session.status != 'playing'
      @final_score_details = @score_details
    end
  end

  def new
    @level = Level.find(params[:level_id])
  end

  def create
    @level = Level.find(params[:level_id])
    @player = current_player

    active_session = @player.game_sessions.active.first
    active_session&.cancel!

    @game_session = @player.game_sessions.create!(
      level: @level,
      score: 0,
      status: 'playing',
      time_remaining: @level.time_limit
    )

    redirect_to game_session_path(@game_session)
  end

  def place_container
    container = Container.find(params[:container_id])
    berth = Berth.find(params[:berth_id])
    allow_warnings = params[:allow_warnings] == 'true'

    processor = OperationProcessor.new(@game_session)
    success = processor.place_container(container, berth, allow_warnings: allow_warnings)

    render json: {
      success: success,
      errors: processor.errors,
      conflicts: processor.conflicts,
      result: processor.result,
      game_session: game_session_json
    }
  end

  def remove_container
    container = Container.find(params[:container_id])

    processor = OperationProcessor.new(@game_session)
    success = processor.remove_container(container)

    render json: {
      success: success,
      errors: processor.errors,
      conflicts: processor.conflicts,
      result: processor.result,
      game_session: game_session_json
    }
  end

  def undo
    processor = OperationProcessor.new(@game_session)
    success = processor.undo

    render json: {
      success: success,
      errors: processor.errors,
      result: processor.result,
      game_session: game_session_json
    }
  end

  def redo
    processor = OperationProcessor.new(@game_session)
    success = processor.redo

    render json: {
      success: success,
      errors: processor.errors,
      result: processor.result,
      game_session: game_session_json
    }
  end

  def recalculate_score
    score = @game_session.recalculate_score!
    score_details = GameScoreCalculator.new(@game_session).calculate_detailed

    render json: {
      success: true,
      score: score,
      score_details: score_details,
      game_session: game_session_json
    }
  end

  def time_expired
    remaining = params[:remaining].to_i
    @game_session.time_expired!(remaining)

    render json: {
      success: true,
      status: @game_session.status,
      score: @game_session.score,
      lose_reason: @game_session.lose_reason,
      game_session: game_session_json
    }
  end

  def cancel
    @game_session.cancel!
    redirect_to levels_path, notice: "游戏已取消"
  end

  def destroy
    @game_session.destroy
    redirect_to game_sessions_path, notice: "游戏记录已删除"
  end

  def operations
    @operations = @game_session.operations.order(sequence: :asc)
    render json: @operations.as_json(only: [:id, :sequence, :action_type, :container_id, :berth_id, :undone, :timestamp])
  end

  private

  def set_game_session
    @game_session = GameSession.find(params[:id])
  end

  def find_or_create_local_player
    unless session[:player_id]
      player = Player.find_or_create_local_player
      session[:player_id] = player.id
    end
  end

  def current_player
    @current_player ||= Player.find(session[:player_id])
  end

  def game_session_json
    {
      id: @game_session.id,
      status: @game_session.status,
      score: @game_session.score,
      time_remaining: @game_session.time_remaining,
      placed_container_ids: @game_session.placed_container_ids,
      available_container_ids: @game_session.available_containers.pluck(:id),
      berth_weights: berth_weights_json,
      operations: operations_json
    }
  end

  def berth_weights_json
    @game_session.level.sorted_berths.map do |berth|
      {
        id: berth.id,
        current_weight: berth.current_weight(@game_session),
        max_weight: berth.max_weight,
        container_ids: @game_session.containers_at_berth(berth).pluck(:container_id)
      }
    end
  end

  def operations_json
    @game_session.operations_in_order.limit(20).map do |op|
      {
        id: op.id,
        sequence: op.sequence,
        action_type: op.action_type,
        container_id: op.container_id,
        berth_id: op.berth_id,
        timestamp: op.timestamp.iso8601
      }
    end
  end

  def ensure_json_format
    request.format = :json unless request.format.json?
  end
end
