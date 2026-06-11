class DashboardController < ApplicationController
  def index
    @vehicle_status_counts = Vehicle.group(:status).count
    @pending_trip_count = TripRecord.needs_review.count
    @unfinished_repair_count = RepairRecord.unfinished.count
    @overdue_maintenance_count = MaintenancePlan.overdue.count
    @abnormal_fuel_count = FuelRecord.recent(30).abnormal.count
    @today_trips = TripRecord.today.includes(:vehicle, :route).order(planned_departure_time: :asc)
    @pending_items = build_pending_items
    @fleet_overview = build_fleet_overview
  end

  private

  def build_pending_items
    items = []

    TripRecord.needs_review.includes(:vehicle, :route).find_each do |trip|
      items << {
        type: :pending_trip,
        title: "待复核出车单 ##{trip.id}",
        description: "#{trip.vehicle.plate_number} - #{trip.route&.name} - #{trip.driver_name}",
        time: trip.planned_departure_time,
        record: trip
      }
    end

    RepairRecord.unfinished.includes(:vehicle).find_each do |repair|
      items << {
        type: :unfinished_repair,
        title: "维修中 ##{repair.id}",
        description: "#{repair.vehicle.plate_number} - #{repair.issue_description&.truncate(30)}",
        time: repair.start_date || repair.report_date,
        record: repair
      }
    end

    MaintenancePlan.overdue.includes(:vehicle).find_each do |plan|
      items << {
        type: :overdue_maintenance,
        title: "超期保养 ##{plan.id}",
        description: "#{plan.vehicle.plate_number} - #{plan.maintenance_type} (计划 #{plan.planned_date})",
        time: plan.planned_date,
        record: plan
      }
    end

    items.sort_by { |item| item[:time] || Time.current }
  end

  def build_fleet_overview
    Fleet.includes(:vehicles).map do |fleet|
      vehicles = fleet.vehicles
      status_counts = vehicles.group(:status).count
      {
        fleet: fleet,
        total_count: vehicles.count,
        available_count: status_counts["available"] || 0,
        in_maintenance_count: status_counts["in_maintenance"] || 0,
        under_repair_count: status_counts["under_repair"] || 0,
        pending_review_count: status_counts["pending_review"] || 0,
        decommissioned_count: status_counts["decommissioned"] || 0
      }
    end
  end
end
