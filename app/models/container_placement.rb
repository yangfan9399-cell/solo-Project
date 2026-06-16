class ContainerPlacement < ApplicationRecord
  belongs_to :game_session
  belongs_to :container
  belongs_to :berth

  validates :container_id, uniqueness: { scope: :game_session_id }
  validates :placed_at, presence: true

  before_validation :set_placed_at, on: :create

  private

  def set_placed_at
    self.placed_at ||= Time.current
  end
end
