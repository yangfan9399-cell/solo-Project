class Route < ApplicationRecord
  has_many :vehicles, dependent: :nullify
  has_many :trip_records, dependent: :restrict_with_error

  validates :name, :code, presence: true
  validates :code, uniqueness: true
end
