class HistoryNode < ApplicationRecord
  belongs_to :vehicle

  validates :node_type, :title, :happened_at, presence: true

  enum :node_type, {
    maintenance_plan: 'maintenance_plan',
    maintenance_start: 'maintenance_start',
    maintenance_complete: 'maintenance_complete',
    repair_report: 'repair_report',
    repair_start: 'repair_start',
    repair_complete: 'repair_complete',
    inspection: 'inspection',
    trip_request: 'trip_request',
    trip_approved: 'trip_approved',
    trip_rejected: 'trip_rejected',
    decommissioned: 'decommissioned',
    mileage_update: 'mileage_update',
    fuel_abnormal: 'fuel_abnormal'
  }

  scope :chronological, -> { order(happened_at: :desc) }
  scope :recent, ->(limit = 20) { chronological.limit(limit) }

  def icon_class
    case node_type
    when /maintenance/ then 'wrench'
    when /repair/ then 'tools'
    when 'inspection' then 'clipboard-check'
    when /trip/ then 'truck'
    when 'decommissioned' then 'ban'
    when 'mileage_update' then 'gauge'
    when 'fuel_abnormal' then 'alert-triangle'
    else 'circle'
    end
  end

  def status_color
    case node_type
    when 'maintenance_complete', 'repair_complete', 'trip_approved', 'inspection' then 'green'
    when 'maintenance_start', 'repair_start', 'trip_request' then 'blue'
    when 'decommissioned', 'trip_rejected', 'fuel_abnormal', 'maintenance_plan' then 'red'
    when 'mileage_update' then 'gray'
    else 'slate'
    end
  end
end
