class Container < ApplicationRecord
  belongs_to :level
  has_many :operations, dependent: :destroy
  has_many :container_placements, dependent: :destroy

  validates :weight, :priority, presence: true, numericality: { greater_than: 0 }
  validates :destination, presence: true
  validates :color, presence: true
  validates :label, presence: true

  def destination_list
    destination.split(',').map(&:strip)
  end
end
