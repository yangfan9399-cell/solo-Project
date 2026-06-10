class DashboardController < ApplicationController
  def index
    @materials = Material.includes(:current_license, :usage_scenarios).all
    @pending_count = UsageScenario.where(approval_status: 'pending').count
    @risk_count = Material.where(id: UsageScenario.where(status: 'blocked').select(:material_id)).count
    @expired_count = License.where(status: 'expired').count
    @recent_materials = Material.order(created_at: :desc).limit(5)
    @recent_reviews = ReviewLog.order(created_at: :desc).limit(5)
  end

  def statistics
    @by_column = UsageScenario.group(:column_name).count
    @by_material_type = Material.joins(:usage_scenarios).group('materials.material_type').count
    @by_risk_reason = License.group(:risk_reason).count.except('none')
    
    @removal_time_data = UsageScenario.where(status: 'removed').joins(:review_logs).where(review_logs: { review_type: 'removal' }).select('EXTRACT(DAYS FROM review_logs.reviewed_at - usage_scenarios.created_at) as days, COUNT(*) as count').group('days').order('days')
    
    @removal_time_stats = @removal_time_data.map { |r| [r.days.to_i, r.count] }.to_h
    
    @avg_removal_time = @removal_time_data.any? ? (@removal_time_data.sum { |r| r.days.to_i * r.count }.to_f / @removal_time_data.sum(&:count)).round(1) : 0
    
    @channel_stats = UsageScenario.group(:channel).count
    @status_stats = UsageScenario.group(:status).count
    @approval_stats = UsageScenario.group(:approval_status).count
  end
end