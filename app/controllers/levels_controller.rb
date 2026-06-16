class LevelsController < ApplicationController
  before_action :find_or_create_local_player
  before_action :set_level, only: [:show]

  def index
    @levels = Level.all.order(difficulty: :asc, name: :asc)
    @player = current_player
  end

  def show
    @player = current_player
    @best_score = @player.game_sessions
                          .where(level: @level, status: 'won')
                          .maximum(:score) || 0
  end

  private

  def set_level
    @level = Level.find(params[:id])
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
end
