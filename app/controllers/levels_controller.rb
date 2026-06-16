class LevelsController < ApplicationController
  before_action :authenticate_player!

  def index
    @levels = Level.order(level_number: :asc)
    @player_stats = {
      total_score: current_player.total_score,
      total_stars: current_player.total_stars,
      completed_count: current_player.completed_levels_count
    }
  end

  def show
    @level = Level.find(params[:id])
    @best_score = current_player.best_score_for(@level)
    @best_stars = current_player.best_stars_for(@level)
  end
end
