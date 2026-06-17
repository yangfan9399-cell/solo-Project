class CharacterBox < ApplicationRecord
  belongs_to :rubbing
  belongs_to :inscription, optional: true

  validates :char_index, presence: true
  validates :x, presence: true
  validates :y, presence: true
end
