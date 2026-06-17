class Inscription < ApplicationRecord
  belongs_to :rubbing
  has_many :character_boxes, dependent: :destroy

  validates :content, presence: true
  validates :line_number, presence: true

  POSITION_OPTIONS = ['左', '右', '上', '下', '中']
end
