class AnalyticsController < ApplicationController
  before_action :require_login
  before_action :require_role, "admin"

  def index
    @date_range = params[:start_date]..params[:end_date] if params[:start_date] && params[:end_date]
    @date_range ||= 30.days.ago.to_date..Date.current

    @industry_stats = Application.where(created_at: @date_range).group(:client_industry).count
    @track_stats = Application.where(created_at: @date_range).group(:track_id).count
    @exception_stats = calculate_exception_stats
    @cycle_stats = calculate_cycle_stats
  end

  private

  def calculate_exception_stats
    {
      scenario_out_of_range: Application.where("metadata ->> 'block_reason' ILIKE ?", "%场景超范围%").count +
                            Application.where("metadata ->> 'block_reason' ILIKE ?", "%不包含%").count,
      date_conflict: Application.where("metadata ->> 'conflict_info' ILIKE ?", "%期限冲突%").count +
                     Application.where("metadata ->> 'conflict_info' ILIKE ?", "%授权重叠%").count,
      settlement_dispute: Settlement.where(status: "disputed").count
    }
  end

  def calculate_cycle_stats
    applications = Application.where(created_at: @date_range, status: "approved")
    {
      avg_cycle_days: applications.average("EXTRACT(DAY FROM (updated_at - created_at))"),
      min_cycle_days: applications.minimum("EXTRACT(DAY FROM (updated_at - created_at))"),
      max_cycle_days: applications.maximum("EXTRACT(DAY FROM (updated_at - created_at))")
    }
  end
end