class AnalyticsController < ApplicationController
  def index
    @date_range = parse_date_range
    @visit_records = VisitRecord.includes(
      reservation: [:visitor, :vehicle, :host, :entrance]
    ).where(created_at: @date_range)

    @stats = {
      total_visits: @visit_records.count,
      blocked_visits: @visit_records.blocked.count,
      avg_stay_duration: average_stay_duration,
      by_department: by_department,
      by_entrance: by_entrance,
      by_blocking_reason: by_blocking_reason
    }
  end

  private

  def parse_date_range
    start_date = params[:start_date] ? Date.parse(params[:start_date]) : 30.days.ago
    end_date = params[:end_date] ? Date.parse(params[:end_date]) : Date.today
    start_date..end_date
  end

  def average_stay_duration
    records_with_duration = @visit_records.select { |r| r.stay_duration.present? }
    return 0 if records_with_duration.empty?

    total_seconds = records_with_duration.sum(&:stay_duration)
    avg_seconds = total_seconds / records_with_duration.count
    hours = avg_seconds / 3600
    minutes = (avg_seconds % 3600) / 60
    "#{hours.to_i}h #{minutes.to_i}m"
  end

  def by_department
    @visit_records.joins(reservation: :host)
      .group('departments.name')
      .count
      .transform_keys { |k| k || '未知部门' }
  end

  def by_entrance
    @visit_records.joins(:entry_entrance)
      .group('entrances.name')
      .count
      .transform_keys { |k| k || '未知入口' }
  end

  def by_blocking_reason
    @visit_records.blocked
      .group(:blocking_reason)
      .count
      .transform_keys { |k| k || '未说明原因' }
  end
end
