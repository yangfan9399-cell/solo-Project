class OperationHistory < ApplicationRecord
  belongs_to :game_session

  validates :operation_type, presence: true
  validates :move_number, numericality: { greater_than_or_equal_to: 0 }

  def parsed_from_state
    return nil unless from_state.present?

    JSON.parse(from_state, symbolize_names: true)
  rescue JSON::ParserError
    nil
  end

  def parsed_to_state
    return nil unless to_state.present?

    JSON.parse(to_state, symbolize_names: true)
  rescue JSON::ParserError
    nil
  end

  scope :active, -> { where(undone: false) }
  scope :undone, -> { where(undone: true) }
end
