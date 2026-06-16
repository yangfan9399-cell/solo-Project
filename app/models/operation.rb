class Operation < ApplicationRecord
  belongs_to :game_session
  belongs_to :container
  belongs_to :berth, optional: true

  validates :action_type, presence: true, inclusion: { in: %w[place remove] }
  validates :sequence, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validates :timestamp, presence: true

  scope :active, -> { where(undone: false) }
  scope :in_order, -> { order(sequence: :asc) }

  before_validation :set_timestamp, on: :create

  ACTION_TYPES = %w[place remove].freeze

  def undo!
    update!(undone: true)
  end

  def redo!
    update!(undone: false)
  end

  private

  def set_timestamp
    self.timestamp ||= Time.current
  end
end
