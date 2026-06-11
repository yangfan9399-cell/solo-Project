class Order < ApplicationRecord
  belongs_to :product
  belongs_to :live_session
  has_one :return_order, dependent: :destroy
  has_one :anchor, through: :product

  validates :order_no, presence: true, uniqueness: true
  validates :product_id, presence: true
  validates :live_session_id, presence: true
  validates :quantity, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validates :total_amount, presence: true, numericality: { greater_than: 0 }

  scope :by_product, ->(product_id) { where(product_id: product_id) }
  scope :by_live_session, ->(live_session_id) { where(live_session_id: live_session_id) }
  scope :by_anchor, ->(anchor_id) { joins(:product).where(products: { anchor_id: anchor_id }) }
  scope :with_return_order, -> { joins(:return_order) }
  scope :without_return_order, -> { left_joins(:return_order).where(return_orders: { id: nil }) }
  scope :ordered, -> { order(created_at: :desc) }
end
