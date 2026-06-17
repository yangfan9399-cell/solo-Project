class ScaleMarker < ApplicationRecord
  belongs_to :record

  enum :orientation, { horizontal: "horizontal", vertical: "vertical" }, default: :horizontal

  validates :x, :y, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :length_pixels, :length_cm, presence: true, numericality: { greater_than: 0 }

  def pixels_per_cm
    length_pixels / length_cm
  end

  def label
    "#{length_cm} cm 尺度尺"
  end
end
