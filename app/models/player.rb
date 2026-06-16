class Player < ApplicationRecord
  has_secure_password validations: false

  has_many :game_sessions, dependent: :destroy
  has_many :levels, through: :game_sessions

  validates :name, presence: true, uniqueness: true
  validates :total_score, numericality: { greater_than_or_equal_to: 0 }
  validates :total_stars, numericality: { greater_than_or_equal_to: 0 }

  def self.find_or_create_local(name)
    player = find_by(name: name)
    return player if player

    create!(name: name, password_digest: nil)
  end

  def best_score_for(level)
    game_sessions.where(level: level, status: 'completed').maximum(:score) || 0
  end

  def best_stars_for(level)
    game_sessions.where(level: level, status: 'completed').maximum(:stars) || 0
  end

  def completed_levels_count
    game_sessions.where(status: 'completed').select(:level_id).distinct.count
  end

  def update_stats!
    completed = game_sessions.where(status: 'completed')
    self.total_score = completed.sum(:score)
    self.total_stars = completed.sum(:stars)
    save!
  end
end
