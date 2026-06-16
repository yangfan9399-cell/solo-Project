class LeaderboardsController < ApplicationController
  before_action :find_or_create_local_player

  def index
    @global_scores = GameSession
                       .where(status: 'won')
                       .includes(:player, :level)
                       .order(score: :desc)
                       .limit(50)
                       .group_by(&:level)

    @by_level = Level.all.order(difficulty: :asc).index_with do |level|
      GameSession
        .where(level: level, status: 'won')
        .includes(:player)
        .order(score: :desc)
        .limit(10)
    end

    @player_rankings = {}
    current_player = Player.find(session[:player_id])
    @by_level.each do |level, scores|
      player_score = scores.find { |s| s.player_id == current_player.id }
      @player_rankings[level.id] = if player_score
                                     scores.index(player_score) + 1
                                   else
                                     '未上榜'
                                   end
    end
  end

  private

  def find_or_create_local_player
    unless session[:player_id]
      player = Player.find_or_create_local_player
      session[:player_id] = player.id
    end
  end
end
