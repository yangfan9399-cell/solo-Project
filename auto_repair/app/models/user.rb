class User < ApplicationRecord
  ROLES = %w[service_advisor technician manager customer_service].freeze

  has_many :service_advisor_orders, class_name: 'RepairOrder', foreign_key: 'service_advisor_id'
  has_many :technician_orders, class_name: 'RepairOrder', foreign_key: 'technician_id'
  has_many :manager_orders, class_name: 'RepairOrder', foreign_key: 'manager_id'
  has_many :cs_orders, class_name: 'RepairOrder', foreign_key: 'customer_service_id'
  has_many :reported_faults, class_name: 'Fault', foreign_key: 'reported_by_id'
  has_many :repair_logs, foreign_key: 'technician_id'
  has_many :order_histories
  has_many :follow_ups

  validates :name, presence: true
  validates :role, presence: true, inclusion: { in: ROLES }

  def role_name
    I18n.t("roles.#{role}", default: role.humanize)
  end

  def service_advisor?
    role == 'service_advisor'
  end

  def technician?
    role == 'technician'
  end

  def manager?
    role == 'manager'
  end

  def customer_service?
    role == 'customer_service'
  end
end
