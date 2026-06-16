class HomeController < ApplicationController
  def index
    find_or_create_local_player
    @levels = Level.all.order(difficulty: :asc)
    @player = Player.find(session[:player_id])
    @recent_games = @player.game_sessions.completed.order(finished_at: :desc).limit(5)
    @total_score = @player.game_sessions.where(status: 'won').sum(:score)
  end

  private

  def find_or_create_local_player
    unless session[:player_id]
      player = Player.find_or_create_local_player
      session[:player_id] = player.id
    end
  end
end
