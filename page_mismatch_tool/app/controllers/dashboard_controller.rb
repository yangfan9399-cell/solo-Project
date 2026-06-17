class DashboardController < ApplicationController
  def index
    @total_projects = Project.count
    @total_anomalies = Anomaly.unresolved.count
    @recent_projects = Project.order(created_at: :desc).limit(5)
    @recent_anomalies = Anomaly.unresolved.order(created_at: :desc).limit(10)
    @projects_by_status = Project.group(:status).count
  end
end
