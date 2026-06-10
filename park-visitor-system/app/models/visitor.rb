class Visitor < ApplicationRecord
  has_many :vehicles, dependent: :destroy
  has_many :reservations, dependent: :nullify

  validates :name, presence: true
  validates :phone, presence: true

  def name_and_phone
    "#{name} (#{phone})"
  end

  def active_vehicles
    vehicles.where(active: true)
  end
end
