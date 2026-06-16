class Player < ApplicationRecord
  has_many :game_sessions, dependent: :destroy

  validates :name, presence: true, uniqueness: { case_sensitive: false }

  def self.find_or_create_local_player(name = 'LocalPlayer')
    Player.find_or_create_by!(name: name) do |player|
      player.current_score = 0
      player.total_games = 0
      player.wins = 0
    end
  end

  def update_stats(won:, score:)
    increment!(:total_games)
    increment!(:wins) if won
    self.current_score = [current_score, score].max
    save!
  end

  def top_scores(limit = 10)
    game_sessions
      .where(status: 'won')
      .order(score: :desc)
      .limit(limit)
      .includes(:level)
  end
end
