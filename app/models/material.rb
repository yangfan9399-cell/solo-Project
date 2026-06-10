class Material < ApplicationRecord
  belongs_to :category, class_name: "MaterialCategory"
  has_many :batches, dependent: :nullify

  validates :name, presence: true
  validates :code, presence: true, uniqueness: true
end
