class Store < ApplicationRecord
  belongs_to :region
  has_many :batches, dependent: :nullify
  has_many :users, dependent: :nullify

  validates :name, presence: true
  validates :code, presence: true, uniqueness: true
  validates :store_type, presence: true

  enum :store_type, { restaurant: "restaurant", warehouse: "warehouse" }
  enum :status, { active: "active", inactive: "inactive" }
end
