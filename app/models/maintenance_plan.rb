class MaintenancePlan < ApplicationRecord
  belongs_to :vehicle
  has_many :maintenance_items, dependent: :destroy
  has_many :history_nodes, as: :recordable, dependent: :nullify

  validates :planned_date, :maintenance_type, :status, presence: true
  validates :scheduled_mileage, numericality: { greater_than: 0 }, allow_nil: true

  enum :maintenance_type, {
    routine: 'routine',
    comprehensive: 'comprehensive',
    emergency: 'emergency'
  }

  enum :status, {
    pending: 'pending',
    in_progress: 'in_progress',
    completed: 'completed',
    overdue: 'overdue',
    cancelled: 'cancelled'
  }

  scope :overdue, -> {
    where(status: :overdue)
      .or(where(status: [:pending, :in_progress]).where('planned_date < ?', Date.today))
  }

  scope :upcoming, ->(days = 7) {
    where(status: :pending)
      .where('planned_date BETWEEN ? AND ?', Date.today, days.days.from_now.to_date)
  }

  def overdue?
    return false if completed? || cancelled?
    planned_date < Date.today
  end

  def all_items_completed?
    maintenance_items.where(is_required: true).all?(&:completed?)
  end

  def progress_percentage
    return 0 if maintenance_items.empty?
    completed = maintenance_items.where(status: :completed).count
    (completed.to_f / maintenance_items.count * 100).round(1)
  end

  after_save :update_vehicle_status, if: :saved_change_to_status?
  after_save :check_and_mark_overdue

  private

  def update_vehicle_status
    case status
    when 'in_progress'
      vehicle.update!(status: :in_maintenance)
      add_history_node(:maintenance_start, '保养开始')
    when 'completed'
      vehicle.update!(
        status: :available,
        last_maintenance_date: Date.today,
        next_maintenance_date: calculate_next_maintenance_date
      )
      add_history_node(:maintenance_complete, '保养完成')
    when 'overdue'
      add_history_node(:maintenance_plan, '保养超期')
    end
  end

  def calculate_next_maintenance_date
    interval = vehicle&.vehicle_model&.maintenance_day_interval || 90
    Date.today + interval.days
  end

  def check_and_mark_overdue
    if pending? && planned_date < Date.today
      update_column(:status, :overdue)
    end
  end

  def add_history_node(node_type, title)
    vehicle.history_nodes.create!(
      node_type: node_type,
      title: title,
      description: "保养计划 #{id}: #{maintenance_type} #{planned_date}",
      operator: scheduled_by || '系统',
      operator_role: 'dispatcher',
      happened_at: Time.current,
      metadata: { maintenance_plan_id: id, maintenance_type: maintenance_type }
    )
  end
end
