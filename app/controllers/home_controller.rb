class HomeController < ApplicationController
  def index
    @recent_sessions = GameSession.order(created_at: :desc).limit(8)
    @completed_sessions = GameSession.completed.order(final_score: :desc).limit(5)
    @stats = {
      total: GameSession.count,
      completed: GameSession.completed.count,
      avg_score: GameSession.completed.average(:final_score)&.round(1) || 0,
      best_score: GameSession.completed.maximum(:final_score) || 0
    }
  end
end
