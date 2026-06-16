class GameSessionsController < ApplicationController
  before_action :authenticate_player!
  before_action :find_game_session, only: [:show, :move_gear, :add_gear, :remove_gear, :undo, :complete, :abandon, :calculate_rpm, :result]

  def show
    @level = @game_session.level
    @available_gears = @level.available_gears
  end

  def create
    level = Level.find(params[:level_id])
    @game_session = current_player.game_sessions.create!(level: level)
    @game_session.start!

    redirect_to game_session_path(@game_session)
  end

  def move_gear
    gear_id = params[:gear_id]
    new_x = params[:x].to_f
    new_y = params[:y].to_f

    from_state = @game_session.parsed_gears_state
    gears_state = from_state.deep_dup

    gear = gears_state.find { |g| g[:id] == gear_id }
    if gear
      gear[:x] = new_x
      gear[:y] = new_y
    end

    @game_session.record_operation!('move', gear_id, from_state, gears_state)

    respond_to do |format|
      format.json do
        render json: {
          success: true,
          gears_state: @game_session.parsed_gears_state,
          current_rpm: @game_session.current_rpm,
          moves_count: @game_session.moves_count
        }
      end
      format.html { redirect_to game_session_path(@game_session) }
    end
  end

  def add_gear
    gear_data = params[:gear].permit!.to_h.symbolize_keys
    from_state = @game_session.parsed_gears_state
    gears_state = from_state.deep_dup

    new_gear = {
      id: "placed_#{Time.now.to_i}_#{rand(1000)}",
      type: 'gear',
      x: gear_data[:x].to_f,
      y: gear_data[:y].to_f,
      teeth: gear_data[:teeth].to_i,
      size: gear_data[:size].to_f,
      rotation: 0.0,
      connected_to: [],
      active: false
    }

    gears_state << new_gear

    @game_session.record_operation!('add', new_gear[:id], from_state, gears_state)

    respond_to do |format|
      format.json do
        render json: {
          success: true,
          gear: new_gear,
          gears_state: @game_session.parsed_gears_state,
          current_rpm: @game_session.current_rpm,
          moves_count: @game_session.moves_count
        }
      end
    end
  end

  def remove_gear
    gear_id = params[:gear_id]
    from_state = @game_session.parsed_gears_state

    gear = from_state.find { |g| g[:id] == gear_id }
    if gear.nil? || gear[:type] == 'waterwheel' || gear[:type] == 'target'
      return render json: { success: false, error: '无法移除此齿轮' }, status: :unprocessable_entity
    end

    gears_state = from_state.reject { |g| g[:id] == gear_id }
    @game_session.record_operation!('remove', gear_id, from_state, gears_state)

    respond_to do |format|
      format.json do
        render json: {
          success: true,
          gears_state: @game_session.parsed_gears_state,
          current_rpm: @game_session.current_rpm,
          moves_count: @game_session.moves_count
        }
      end
    end
  end

  def undo
    success = @game_session.undo!

    respond_to do |format|
      format.json do
        render json: {
          success: success,
          gears_state: @game_session.parsed_gears_state,
          current_rpm: @game_session.current_rpm,
          moves_count: @game_session.moves_count,
          can_undo: @game_session.can_undo?
        }
      end
      format.html { redirect_to game_session_path(@game_session) }
    end
  end

  def calculate_rpm
    gears_state = @game_session.parsed_gears_state
    engine = GearPhysicsEngine.new(gears_state, @game_session.level.water_force)

    render json: {
      target_rpm: engine.target_rpm,
      target_connected: engine.target_connected?,
      all_rpms: engine.calculate_all_rpms,
      gears_state: engine.gears_state
    }
  end

  def complete
    if params[:time_spent].present?
      @game_session.update!(time_spent: params[:time_spent].to_i)
    end

    result = @game_session.complete!

    respond_to do |format|
      format.json do
        render json: result.merge(
          game_session_id: @game_session.id,
          status: @game_session.status
        )
      end
      format.html do
        if @game_session.status == 'completed'
          redirect_to result_game_session_path(@game_session), notice: '恭喜通关！'
        else
          redirect_to result_game_session_path(@game_session), alert: '未能达成目标，再试一次吧！'
        end
      end
    end
  end

  def result
    @game_session = current_player.game_sessions.find(params[:id])
    @level = @game_session.level
  end

  def abandon
    @game_session.abandon!
    redirect_to levels_path, notice: '已放弃当前关卡'
  end

  private

  def find_game_session
    @game_session = current_player.game_sessions.find(params[:id])
  end
end
