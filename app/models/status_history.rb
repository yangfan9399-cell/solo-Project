class StatusHistory < ApplicationRecord
  belongs_to :return_order

  validates :return_order_id, presence: true
  validates :from_status, presence: true
  validates :to_status, presence: true

  scope :by_return_order, ->(return_order_id) { where(return_order_id: return_order_id) }
  scope :by_from_status, ->(status) { where(from_status: status) }
  scope :by_to_status, ->(status) { where(to_status: status) }
  scope :ordered, -> { order(created_at: :asc) }
  scope :latest_first, -> { order(created_at: :desc) }

  def from_status_label
    self.class.status_label(from_status)
  end

  def to_status_label
    self.class.status_label(to_status)
  end

  def event_label
    self.class.event_label(event)
  end

  def self.status_label(status)
    {
      'pending' => '待受理',
      'customer_service_approved' => '客服已受理',
      'warehouse_received' => '仓库已收货',
      'inspected' => '质检完成',
      'reviewed' => '运营复核完成',
      'resold' => '已二次上架',
      'reported_loss' => '已报损',
      'disputed' => '退款争议',
      'cancelled' => '已取消'
    }[status.to_s] || status.to_s
  end

  def self.event_label(event_name)
    return '' if event_name.blank?
    {
      'approve_by_customer_service' => '客服受理',
      'receive_by_warehouse' => '仓库收货',
      'complete_inspection' => '完成质检',
      'review_by_operation' => '运营复核',
      'resale' => '二次上架',
      'report_loss' => '报损处理',
      'raise_dispute' => '发起争议'
    }[event_name.to_s.gsub('!', '')] || event_name.to_s
  end
end
