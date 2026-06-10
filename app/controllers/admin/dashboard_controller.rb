module Admin
  class DashboardController < ApplicationController
    before_action :authenticate_admin!

    def index
      @total_reports = Report.count
      @pending_reissues = Report.reissue_requested.count
      @exception_reports = Report.exception.count
      @today_reports = Report.where(issue_date: Date.today).count

      @recent_reports = Report.includes(:exam, :patient).order(created_at: :desc).limit(10)
      @pending_reissue_list = Report.includes(:exam, :patient).reissue_requested.order(created_at: :desc).limit(5)
    end
  end
end