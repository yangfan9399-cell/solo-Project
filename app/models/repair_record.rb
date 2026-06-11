class RepairRecord < ApplicationRecord
  belongs_to :vehicle

  validates :report_date, :repair_type, :status, :issue_description, presence: true
  validates :parts_cost, :labor_cost, :total_cost, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :decommission_days, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, allow_nil: true

  enum :repair_type, {
    breakdown: 'breakdown',
    preventive: 'preventive',
    accident: 'accident'
  }

  enum :status, {
    reported: 'reported',
    diagnosing: 'diagnosing',
    in_progress: 'in_progress',
    parts_pending: 'parts_pending',
    completed: 'completed',
    cancelled: 'cancelled'
  }

  scope :unfinished, -> { where.not(status: [:completed, :cancelled]) }
  scope :active_for_vehicle, ->(vehicle_id) { where(vehicle_id: vehicle_id).unfinished }

  def may_complete?
    !completed? && !cancelled?
  end

  def decommission_days_calculated
    return decommission_days if decommission_days.present?
    return 0 unless start_date
    end_date_val = end_date || Date.today
    (end_date_val - start_date).to_i
  end

  after_save :update_vehicle_status, if: :saved_change_to_status?
  after_save :calculate_decommission, if: -> { saved_change_to_end_date? || saved_change_to_status? }

  private

  def update_vehicle_status
    case status
    when 'reported', 'diagnosing', 'in_progress', 'parts_pending'
      unless vehicle.under_repair?
        vehicle.update!(status: :under_repair)
        add_history_node(:repair_start, '维修开始')
      end
    when 'completed'
      add_history_node(:repair_complete, '维修完成')
      if vehicle.under_repair?
        has_other_repairs = RepairRecord.active_for_vehicle(vehicle_id).where.not(id: self.id).exists?
        unless has_other_repairs
          vehicle.update!(status: :pending_review)
        end
      end
    when 'cancelled'
      if vehicle.under_repair?
        has_other_repairs = RepairRecord.active_for_vehicle(vehicle_id).exists?
        vehicle.update!(status: :available) unless has_other_repairs
      end
    end
  end

  def calculate_decommission
    if completed? && start_date && end_date && decommission_days.nil?
      self.decommission_days = (end_date - start_date).to_i
      save! if changed?
    end
  end

  def add_history_node(node_type, title)
    vehicle.history_nodes.create!(
      node_type: node_type,
      title: title,
      description: "维修单 #{id}: #{repair_type} - #{issue_description&.truncate(50)}",
      operator: technician || '维修站',
      operator_role: 'repair_station',
      happened_at: Time.current,
      metadata: { repair_record_id: id, repair_type: repair_type, status: status }
    )
  end
end
