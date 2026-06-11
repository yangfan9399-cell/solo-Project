class ReturnOrder < ApplicationRecord
  include AASM

  belongs_to :order
  has_many :inspection_records, dependent: :destroy
  has_many :status_histories, dependent: :destroy
  has_one :product, through: :order
  has_one :anchor, through: :product
  has_one :live_session, through: :order

  enum :status, {
    pending: 'pending',
    customer_service_approved: 'customer_service_approved',
    warehouse_received: 'warehouse_received',
    inspected: 'inspected',
    reviewed: 'reviewed',
    resold: 'resold',
    reported_loss: 'reported_loss',
    disputed: 'disputed',
    cancelled: 'cancelled'
  }

  validates :order_id, presence: true
  validates :reason, presence: true, length: { maximum: 500 }
  validates :status, presence: true
  validates :return_no, presence: true, uniqueness: true
  validate :cannot_resold_if_missing_items

  before_validation :generate_return_no, on: :create

  aasm column: :status, enum: true do
    state :pending, initial: true
    state :customer_service_approved
    state :warehouse_received
    state :inspected
    state :reviewed
    state :resold
    state :reported_loss
    state :disputed
    state :cancelled

    event :approve_by_customer_service, after: :create_status_history do
      transitions from: :pending, to: :customer_service_approved
    end

    event :receive_by_warehouse, after: :create_status_history do
      transitions from: :customer_service_approved, to: :warehouse_received
    end

    event :complete_inspection, after: :create_status_history do
      transitions from: :warehouse_received, to: :inspected
    end

    event :review_by_operation, after: :create_status_history do
      transitions from: :inspected, to: :reviewed
    end

    event :resale, after: :create_status_history do
      transitions from: :reviewed, to: :resold, guard: :missing_items_allowed?
    end

    event :report_loss, after: :create_status_history do
      transitions from: :reviewed, to: :reported_loss
    end

    event :raise_dispute, after: :create_status_history do
      transitions from: [:pending, :inspected], to: :disputed
    end
  end

  scope :by_order, ->(order_id) { where(order_id: order_id) }
  scope :by_product, ->(product_id) { joins(:product).where(products: { id: product_id }) }
  scope :by_anchor, ->(anchor_id) { joins(:anchor).where(anchors: { id: anchor_id }) }
  scope :by_status, ->(status) { where(status: status) }
  scope :with_missing_items, -> { where(missing_items: true) }
  scope :without_missing_items, -> { where(missing_items: false) }
  scope :pending_review, -> { where(status: [:pending, :customer_service_approved, :warehouse_received, :inspected, :reviewed]) }
  scope :completed, -> { where(status: [:resold, :reported_loss, :disputed, :cancelled]) }
  scope :ordered, -> { order(created_at: :desc) }

  def latest_inspection
    inspection_records.ordered.first
  end

  private

  def generate_return_no
    self.return_no ||= "RT#{Time.current.strftime('%Y%m%d%H%M%S')}#{rand(1000..9999)}"
  end

  def create_status_history
    status_histories.create!(
      from_status: aasm.from_state,
      to_status: aasm.to_state,
      event: aasm.current_event
    )
  end

  def missing_items_allowed?
    !missing_items?
  end

  def cannot_resold_if_missing_items
    if resold? && missing_items?
      errors.add(:status, '商品缺失时禁止二次上架')
    end
  end
end
