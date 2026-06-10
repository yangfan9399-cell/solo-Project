class AnalyticsController < ApplicationController
  def index
    @date_range = parse_date_range
    @visit_records = VisitRecord.includes(
      reservation: [:visitor, :vehicle, :host => :department]
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
    records_with_duration = @visit_records.to_a.select { |r| r.stay_duration.present? }
    return '0h 0m' if records_with_duration.empty?

    total_seconds = records_with_duration.sum(&:stay_duration)
    avg_seconds = total_seconds / records_with_duration.count
    hours = avg_seconds / 3600
    minutes = (avg_seconds % 3600) / 60
    "#{hours.to_i}h #{minutes.to_i}m"
  end

  def by_department
    result = {}
    @visit_records.each do |vr|
      dept_name = vr.reservation.host.department.name rescue '未知部门'
      result[dept_name] ||= 0
      result[dept_name] += 1
    end
    result
  end

  def by_entrance
    result = {}
    @visit_records.each do |vr|
      entrance_name = vr.entry_entrance&.name || '未知入口'
      result[entrance_name] ||= 0
      result[entrance_name] += 1
    end
    result
  end

  def by_blocking_reason
    result = {}
    @visit_records.blocked.each do |vr|
      reason = vr.blocking_reason.presence || '未说明原因'
      result[reason] ||= 0
      result[reason] += 1
    end
    result
  end
end
