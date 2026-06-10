class MaterialCategory < ApplicationRecord
  has_many :materials, dependent: :nullify

  validates :name, presence: true
  validates :code, presence: true, uniqueness: true
end
