class Level < ApplicationRecord
  has_many :containers, dependent: :destroy
  has_many :berths, dependent: :destroy
  has_many :game_sessions, dependent: :destroy

  validates :name, presence: true, uniqueness: true
  validates :time_limit, :target_score, :container_count, :berth_count, :max_weight_per_berth,
            presence: true, numericality: { greater_than: 0 }

  DIFFICULTIES = %w[easy medium hard expert].freeze

  validates :difficulty, inclusion: { in: DIFFICULTIES }

  def difficulty_multiplier
    case difficulty
    when 'easy' then 1.0
    when 'medium' then 1.5
    when 'hard' then 2.0
    when 'expert' then 3.0
    else 1.0
    end
  end

  def sorted_containers
    containers.order(id: :asc)
  end

  def sorted_berths
    berths.order(position: :asc)
  end
end
