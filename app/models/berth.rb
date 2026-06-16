class Berth < ApplicationRecord
  belongs_to :level
  has_many :operations, dependent: :destroy
  has_many :container_placements, dependent: :destroy

  validates :name, :max_weight, :position, presence: true
  validates :max_weight, numericality: { greater_than: 0 }
  validates :position, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  def allowed_destination_list
    (allowed_destinations || '').split(',').map(&:strip)
  end

  def accepts_destination?(container_destination)
    allowed = allowed_destination_list
    return true if allowed.empty? || allowed.include?('*')
    allowed.include?(container_destination)
  end

  def current_weight(game_session)
    container_placements
      .where(game_session: game_session)
      .joins(:container)
      .sum('containers.weight')
  end

  def can_accept_container?(container, game_session)
    return false unless accepts_destination?(container.destination)
    current_weight(game_session) + container.weight <= max_weight
  end
end
