class Region < ApplicationRecord
  has_many :stores, dependent: :nullify

  validates :name, presence: true
  validates :code, presence: true, uniqueness: true
end
