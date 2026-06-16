class GameSession < ApplicationRecord
  belongs_to :player
  belongs_to :level
  has_many :operations, dependent: :destroy
  has_many :container_placements, dependent: :destroy

  STATUSES = %w[playing won lost cancelled].freeze
  validates :status, inclusion: { in: STATUSES }

  before_create :set_started_at
  before_create :set_initial_time_remaining

  scope :active, -> { where(status: 'playing') }
  scope :completed, -> { where(status: %w[won lost]) }
  scope :for_player, ->(player) { where(player: player) }

  def next_sequence
    (operations.maximum(:sequence) || 0) + 1
  end

  def last_operation
    operations.where(undone: false).order(sequence: :desc).first
  end

  def operations_in_order
    operations.where(undone: false).order(sequence: :asc)
  end

  def placed_containers
    container_placements.includes(:container, :berth).order(created_at: :asc)
  end

  def containers_at_berth(berth)
    container_placements.where(berth: berth).includes(:container)
  end

  def placed_container_ids
    container_placements.pluck(:container_id)
  end

  def available_containers
    level.containers.where.not(id: placed_container_ids)
  end

  def recalculate_score!
    score = GameScoreCalculator.calculate(self)
    update!(score: score)
    score
  end

  def check_completion!
    return unless status == 'playing'

    if available_containers.empty?
      recalculate_score!
      if score >= level.target_score
        win!
      else
        lose!("未达到目标分数 #{level.target_score}，当前得分 #{score}")
      end
    end
  end

  def win!
    update!(status: 'won', finished_at: Time.current)
    player.update_stats(won: true, score: score)
  end

  def lose!(reason)
    update!(status: 'lost', finished_at: Time.current)
    player.update_stats(won: false, score: score)
    @lose_reason = reason
  end

  def lose_reason
    @lose_reason
  end

  def cancel!
    update!(status: 'cancelled', finished_at: Time.current)
  end

  def time_expired!(remaining_seconds)
    return unless status == 'playing'

    update!(time_remaining: remaining_seconds)
    recalculate_score!
    if score >= level.target_score
      win!
    else
      lose!("时间耗尽！目标分数 #{level.target_score}，当前得分 #{score}")
    end
  end

  private

  def set_started_at
    self.started_at ||= Time.current
  end

  def set_initial_time_remaining
    self.time_remaining ||= level.time_limit
  end
end
