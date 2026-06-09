class Department < ApplicationRecord
  has_many :users
  has_many :contracts
  has_many :seal_applications, through: :contracts

  validates :name, presence: true, uniqueness: true
end
