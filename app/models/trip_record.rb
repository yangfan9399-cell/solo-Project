class TripRecord < ApplicationRecord
  belongs_to :vehicle
  belongs_to :route

  validates :planned_departure_time, :driver_name, :review_status, presence: true
  validates :start_mileage, :end_mileage, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  enum :review_status, {
    pending: 'pending',
    approved: 'approved',
    rejected: 'rejected',
    decommissioned: 'decommissioned'
  }

  scope :active, -> { where(is_active: true) }
  scope :today, -> { where('planned_departure_time >= ? AND planned_departure_time <= ?', Date.today.beginning_of_day, Date.today.end_of_day) }
  scope :needs_review, -> { where(review_status: :pending) }

  validate :vehicle_must_be_available_for_dispatch, on: :create
  validate :no_unfinished_repairs, on: :create
  validate :no_overdue_maintenance, on: :create

  after_create :add_request_history
  after_save :process_review, if: :saved_change_to_review_status?
  after_save :update_vehicle_mileage, if: -> { saved_change_to_end_mileage? && end_mileage.present? }

  def actual_distance
    return 0 if end_mileage.nil? || start_mileage.nil?
    [end_mileage - start_mileage, 0].max
  end

  def duration_minutes
    return 0 unless actual_departure_time && actual_return_time
    ((actual_return_time - actual_departure_time) / 60).round
  end

  def can_approve?
    pending?
  end

  def blocking_issues
    issues = []
    if vehicle.under_repair? || RepairRecord.active_for_vehicle(vehicle_id).exists?
      issues << '车辆存在未完成的维修记录'
    end
    overdue_plans = MaintenancePlan.where(vehicle_id: vehicle_id).overdue
    if overdue_plans.exists?
      issues << "车辆存在#{overdue_plans.count}项超期保养计划"
    end
    last_inspection = vehicle.inspection_records.order(inspection_date: :desc).first
    if last_inspection && !last_inspection.passed?
      issues << '最近一次车况检查未通过'
    elsif last_inspection.nil?
      issues << '暂无车况检查记录'
    end
    issues
  end

  private

  def vehicle_must_be_available_for_dispatch
    unless vehicle.available? || vehicle.pending_review?
      errors.add(:vehicle, "当前状态为#{vehicle.status}，不可派车")
    end
  end

  def no_unfinished_repairs
    if RepairRecord.active_for_vehicle(vehicle_id).exists?
      errors.add(:vehicle, '存在未完成的维修记录，禁止出车')
    end
  end

  def no_overdue_maintenance
    overdue_count = MaintenancePlan.where(vehicle_id: vehicle_id)
                                   .where(status: [:pending, :overdue])
                                   .where('planned_date < ?', Date.today)
                                   .count
    if overdue_count > 0
      errors.add(:vehicle, "存在#{overdue_count}项超期保养，请先完成保养")
    end
  end

  def process_review
    case review_status
    when 'approved'
      vehicle.update!(status: :available)
      self.reviewed_at = Time.current
      self.is_active = true
      add_review_history(:trip_approved, '出车复核通过')
    when 'rejected'
      self.reviewed_at = Time.current
      add_review_history(:trip_rejected, '出车复核驳回')
    when 'decommissioned'
      vehicle.update!(status: :decommissioned)
      self.reviewed_at = Time.current
      add_review_history(:decommissioned, '车辆停用')
    end
  end

  def add_request_history
    vehicle.history_nodes.create!(
      node_type: :trip_request,
      title: '出车申请',
      description: "线路：#{route.name}，计划出发：#{planned_departure_time.strftime('%Y-%m-%d %H:%M')}，司机：#{driver_name}",
      operator: '调度员',
      operator_role: 'dispatcher',
      happened_at: Time.current,
      metadata: { trip_record_id: id, route_id: route_id, planned_departure: planned_departure_time.iso8601 }
    )
  end

  def add_review_history(node_type, title)
    vehicle.history_nodes.create!(
      node_type: node_type,
      title: title,
      description: "出车单 #{id}：#{review_note || '无'}，复核人：#{reviewer || '队长'}",
      operator: reviewer || '队长',
      operator_role: 'team_leader',
      happened_at: Time.current,
      metadata: { trip_record_id: id, review_status: review_status, review_note: review_note }
    )
  end

  def update_vehicle_mileage
    if end_mileage > (vehicle.current_mileage || 0)
      vehicle.update!(current_mileage: end_mileage)
      vehicle.history_nodes.create!(
        node_type: :mileage_update,
        title: '里程更新',
        description: "里程更新为 #{end_mileage} km（+#{actual_distance} km）",
        operator: '系统',
        operator_role: 'system',
        happened_at: Time.current,
        metadata: { mileage: end_mileage, distance: actual_distance }
      )
    end
  end
end
