class PlayersController < ApplicationController
  before_action :find_or_create_local_player, only: [:show, :update_name]
  before_action :set_player, only: [:show, :update_name]

  def show
    @game_sessions = @player.game_sessions.completed.order(finished_at: :desc).limit(20)
    @top_scores = @player.top_scores(10)
  end

  def new
    @player = Player.new
  end

  def create
    @player = Player.find_or_initialize_by(name: player_params[:name])
    if @player.new_record?
      @player.assign_attributes(player_params)
      @player.current_score = 0
      @player.total_games = 0
      @player.wins = 0
    end

    if @player.save
      session[:player_id] = @player.id
      redirect_to levels_path, notice: "欢迎，#{@player.name}！"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def update_name
    if @player.update(name: player_params[:name])
      redirect_to player_path(@player), notice: "玩家名称已更新"
    else
      render :show, status: :unprocessable_entity
    end
  end

  private

  def player_params
    params.require(:player).permit(:name)
  end

  def find_or_create_local_player
    unless session[:player_id]
      @player = Player.find_or_create_local_player
      session[:player_id] = @player.id
    end
  end

  def set_player
    @player = Player.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    @player = Player.find_or_create_local_player
    session[:player_id] = @player.id
    redirect_to player_path(@player)
  end
end
