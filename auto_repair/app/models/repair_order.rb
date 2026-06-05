class RepairOrder < ApplicationRecord
  belongs_to :vehicle
  belongs_to :service_advisor, class_name: 'User', optional: true
  belongs_to :technician, class_name: 'User', optional: true
  belongs_to :manager, class_name: 'User', optional: true
  belongs_to :customer_service, class_name: 'User', optional: true
  belongs_to :parent_order, class_name: 'RepairOrder', optional: true

  has_many :child_orders, class_name: 'RepairOrder', foreign_key: 'parent_order_id'
  has_many :faults, dependent: :destroy
  has_many :quote_items, dependent: :destroy
  has_many :parts, dependent: :destroy
  has_many :repair_logs, dependent: :destroy
  has_many :follow_ups, dependent: :destroy
  has_many :order_histories, dependent: :destroy

  validates :order_number, presence: true, uniqueness: true
  validates :status, presence: true

  before_validation :generate_order_number, on: :create

  STATUSES = %w[
    draft
    fault_recorded
    quote_submitted
    quote_over_budget
    quote_approved
    quote_rejected
    parts_pending
    parts_available
    in_repair
    repair_completed
    under_review
    review_approved
    review_returned
    follow_up_scheduled
    follow_up_completed
    archived
    warranty_repair
  ].freeze

  def generate_order_number
    return if order_number.present?
    date = Date.today.strftime('%Y%m%d')
    last_order = RepairOrder.where('order_number LIKE ?', "#{date}%").order(:order_number).last
    sequence = last_order ? last_order.order_number[-4..].to_i + 1 : 1
    self.order_number = "#{date}#{sequence.to_s.rjust(4, '0')}"
  end

  def quote_total
    quote_items.sum(:total_price)
  end

  def over_budget?
    return false unless budget_limit.present?
    quote_total > budget_limit
  end

  def parts_out_of_stock?
    parts.where(status: 'out_of_stock').exists?
  end

  def can_confirm_quote?
    !over_budget?
  end

  def archived?
    archived
  end

  def readonly?
    archived? && !new_record?
  end

  def add_history(user, action, notes = nil, node_type = nil)
    order_histories.create!(
      user: user,
      action: action,
      from_status: status_was,
      to_status: status,
      notes: notes,
      node_type: node_type
    )
  end

  def create_warranty_repair_order!(creator)
    new_order = RepairOrder.new(
      vehicle: vehicle,
      parent_order: self,
      warranty_repair: true,
      status: 'warranty_repair',
      service_advisor: creator.service_advisor? ? creator : service_advisor,
      budget_limit: 0,
      customer_description: "质保返修 - 原单号: #{order_number}"
    )

    transaction do
      new_order.save!
      new_order.add_history(creator, '创建质保返修单', "基于原维修单 #{order_number}", 'warranty')
      faults.each do |fault|
        new_order.faults.create!(
          title: fault.title,
          description: "质保返修: #{fault.description}",
          reported_by: creator,
          severity: fault.severity,
          category: fault.category
        )
      end
    end

    new_order
  end

  def status_name
    I18n.t("repair_order_statuses.#{status}", default: status.humanize)
  end
end
