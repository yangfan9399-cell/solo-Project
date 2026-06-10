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
    
    @removal_time_stats = UsageScenario.where(status: 'removed').joins(:review_logs).where(review_logs: { review_type: 'removal' }).select('EXTRACT(DAYS FROM review_logs.reviewed_at - usage_scenarios.created_at) as days').group('days').count
    
    @channel_stats = UsageScenario.group(:channel).count
    @status_stats = UsageScenario.group(:status).count
    @approval_stats = UsageScenario.group(:approval_status).count
  end
end