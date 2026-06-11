class VehicleModel < ApplicationRecord
  has_many :vehicles, dependent: :restrict_with_error

  validates :name, :brand, :category, presence: true
  validates :name, uniqueness: { scope: :brand }

  enum :category, {
    garbage_truck: 'garbage_truck',
    sweeper: 'sweeper',
    sprinkler: 'sprinkler',
    vacuum_truck: 'vacuum_truck',
    transport: 'transport',
    other: 'other'
  }

  def display_name
    "#{brand} #{name}"
  end
end
