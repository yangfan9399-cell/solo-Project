class Inscription < ApplicationRecord
  belongs_to :rubbing
  has_many :character_boxes, dependent: :destroy

  validates :content, presence: true
  validates :line_number, presence: true

  POSITION_OPTIONS = ['左', '右', '上', '下', '中']

  def self.ransackable_attributes(auth_object = nil)
    ["broken_note", "column_number", "content", "id", "is_broken", "line_number", "position", "rubbing_id"]
  end

  def self.ransackable_associations(auth_object = nil)
    ["character_boxes", "rubbing"]
  end
end
