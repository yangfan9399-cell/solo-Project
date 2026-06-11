class Anchor < ApplicationRecord
  has_many :products, dependent: :destroy
  has_many :live_sessions, dependent: :destroy

  validates :name, presence: true, length: { maximum: 100 }

  scope :with_products, -> { includes(:products) }
  scope :with_live_sessions, -> { includes(:live_sessions) }
  scope :ordered, -> { order(created_at: :desc) }
end
