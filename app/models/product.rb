class Product < ApplicationRecord
  belongs_to :anchor
  has_many :orders, dependent: :destroy
  has_many :return_orders, through: :orders

  validates :name, presence: true, length: { maximum: 200 }
  validates :sku, presence: true, uniqueness: true
  validates :original_price, presence: true, numericality: { greater_than: 0 }

  scope :by_anchor, ->(anchor_id) { where(anchor_id: anchor_id) }
  scope :by_category, ->(category) { where(category: category) }
  scope :ordered, -> { order(created_at: :desc) }

  CATEGORIES = %w[美妆 服装 食品 数码 家居 母婴 运动 图书].freeze
end
