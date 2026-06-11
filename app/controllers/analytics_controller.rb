require 'ostruct'

class AnalyticsController < ApplicationController
  def index
    @by_fleet_cards = by_fleet
    @by_model_cards = by_model
    @by_reason_cards = by_reason
    @decommission_cards = decommission
    @summary_stats = summary_stats
  end

  def summary_stats
    all_completed_repairs = RepairRecord.completed.where.not(decommission_days: nil)
    total_decommission = all_completed_repairs.sum(:decommission_days).to_i
    repair_count = RepairRecord.count
    avg_decommission = repair_count > 0 ? (total_decommission.to_f / repair_count).round(1) : 0
    abnormal_fuel_count = FuelRecord.where(is_abnormal: true).count

    OpenStruct.new(
      total_repairs: repair_count,
      total_decommission_days: total_decommission,
      avg_decommission_days: avg_decommission,
      abnormal_fuel_count: abnormal_fuel_count
    )
  end

  def by_fleet
    @by_fleet ||= Fleet.joins(vehicles: [:trip_records, :repair_records, :fuel_records])
      .select(
        'fleets.id',
        'fleets.name',
        'COUNT(DISTINCT vehicles.id) AS vehicle_count',
        'COUNT(DISTINCT trip_records.id) AS trip_count',
        'COUNT(DISTINCT repair_records.id) AS repair_count',
        'COALESCE(SUM(repair_records.decommission_days), 0) AS total_decommission_days',
        'COALESCE(AVG(fuel_records.fuel_consumption), 0) AS avg_fuel_consumption'
      )
      .group('fleets.id, fleets.name')
      .order('fleets.name')
  end

  def by_model
    @by_model ||= VehicleModel.joins(vehicles: [:trip_records, :repair_records, :fuel_records])
      .select(
        'vehicle_models.id',
        'vehicle_models.brand',
        'vehicle_models.name',
        'vehicle_models.category',
        'COUNT(DISTINCT vehicles.id) AS vehicle_count',
        'COUNT(DISTINCT trip_records.id) AS trip_count',
        'COUNT(DISTINCT repair_records.id) AS repair_count',
        'COALESCE(SUM(repair_records.decommission_days), 0) AS total_decommission_days',
        'COALESCE(AVG(fuel_records.fuel_consumption), 0) AS avg_fuel_consumption'
      )
      .group('vehicle_models.id, vehicle_models.brand, vehicle_models.name, vehicle_models.category')
      .order('vehicle_models.brand, vehicle_models.name')
  end

  def by_reason
    @by_reason ||= RepairRecord.where.not(abnormal_reason: nil)
      .where.not(abnormal_reason: '')
      .select(
        'abnormal_reason',
        'COUNT(*) AS reason_count',
        'COALESCE(AVG(decommission_days), 0) AS avg_decommission_days'
      )
      .group(:abnormal_reason)
      .order('reason_count DESC')
  end

  def decommission
    base = RepairRecord.completed.where.not(decommission_days: nil)

    under_3 = base.where('decommission_days < ?', 3).count
    between_3_7 = base.where('decommission_days >= ? AND decommission_days < ?', 3, 7).count
    between_7_15 = base.where('decommission_days >= ? AND decommission_days < ?', 7, 15).count
    over_15 = base.where('decommission_days >= ?', 15).count

    @decommission = [
      OpenStruct.new(range: '<3天', count: under_3),
      OpenStruct.new(range: '3-7天', count: between_3_7),
      OpenStruct.new(range: '7-15天', count: between_7_15),
      OpenStruct.new(range: '>15天', count: over_15)
    ]
  end
end
