class Vehicle < ApplicationRecord
  belongs_to :fleet
  belongs_to :vehicle_model
  belongs_to :route

  has_many :maintenance_plans, dependent: :destroy
  has_many :repair_records, dependent: :destroy
  has_many :fuel_records, dependent: :destroy
  has_many :inspection_records, dependent: :destroy
  has_many :trip_records, dependent: :destroy
  has_many :history_nodes, dependent: :destroy

  validates :plate_number, presence: true, uniqueness: true
  validates :status, presence: true
  validates :current_mileage, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  enum :status, {
    available: 'available',
    in_maintenance: 'in_maintenance',
    under_repair: 'under_repair',
    decommissioned: 'decommissioned',
    pending_review: 'pending_review'
  }

  scope :with_active_issues, -> {
    where(status: [:under_repair, :in_maintenance, :pending_review])
      .or(where(id: MaintenancePlan.overdue.select(:vehicle_id)))
  }

  scope :available_for_dispatch, -> {
    left_joins(:repair_records, :maintenance_plans)
      .where(status: :available)
      .where.not(id: RepairRecord.unfinished.select(:vehicle_id))
      .where.not(id: MaintenancePlan.overdue.select(:vehicle_id))
      .distinct
  }

  def status_display
    I18n.t("enums.vehicle.status.#{status}", default: status)
  end

  def status_badge_color
    case status
    when 'available' then 'bg-green-100 text-green-800'
    when 'in_maintenance' then 'bg-blue-100 text-blue-800'
    when 'under_repair' then 'bg-orange-100 text-orange-800'
    when 'decommissioned' then 'bg-red-100 text-red-800'
    when 'pending_review' then 'bg-yellow-100 text-yellow-800'
    else 'bg-gray-100 text-gray-800'
    end
  end

  def overdue_maintenance?
    maintenance_plans.overdue.exists?
  end

  def has_unfinished_repairs?
    repair_records.unfinished.exists?
  end

  def recent_fuel_consumption(days = 30)
    records = fuel_records.recent(days).where.not(fuel_consumption: nil)
    return nil if records.empty?
    records.average(:fuel_consumption).round(2)
  end

  def abnormal_fuel_count(days = 30)
    fuel_records.recent(days).abnormal.count
  end

  def total_decommission_days
    repair_records.completed.sum(:decommission_days).to_i
  end

  def last_inspection_result
    inspection_records.order(inspection_date: :desc).first
  end

  def upcoming_maintenance
    maintenance_plans.pending.where('planned_date >= ?', Date.today).order(planned_date: :asc).first
  end

  def blocking_issues_for_dispatch
    issues = []
    issues << '车辆正在维修中' if under_repair?
    issues << '车辆正在保养中' if in_maintenance?
    issues << '车辆已停用' if decommissioned?
    issues << '存在未完成维修' if has_unfinished_repairs?
    issues << '存在超期保养计划' if overdue_maintenance?
    last_insp = last_inspection_result
    if last_insp
      issues << '最近检查未通过' unless last_insp.passed?
    else
      issues << '暂无检查记录'
    end
    issues
  end

  def can_dispatch?
    blocking_issues_for_dispatch.empty?
  end
end
