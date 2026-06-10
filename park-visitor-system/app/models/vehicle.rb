class Vehicle < ApplicationRecord
  belongs_to :visitor
  has_one :reservation, dependent: :nullify

  validates :license_plate, presence: true, uniqueness: true
  validates :vehicle_type, presence: true

  scope :active, -> { where(active: true) }

  def active?
    active
  end
end
