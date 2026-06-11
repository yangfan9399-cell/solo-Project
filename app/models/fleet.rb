class Fleet < ApplicationRecord
  has_many :vehicles, dependent: :restrict_with_error
  has_many :users, dependent: :nullify

  validates :name, :code, presence: true
  validates :code, uniqueness: true
end
