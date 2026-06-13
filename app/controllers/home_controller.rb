class HomeController < ApplicationController
  skip_after_action :verify_policy_scoped, only: :index

  def index
    authorize :home

    @statistics = InspectionRecord.statistics
    @recent_records = InspectionRecord.includes(:handler, :reviewer)
                                     .order(created_at: :desc)
                                     .limit(10)
    @my_tasks = if current_user.handler?
                  current_user.handled_records.active.order(created_at: :desc).limit(5)
                elsif current_user.reviewer?
                  InspectionRecord.by_state(['review_pending', 'reviewing']).order(created_at: :desc).limit(5)
                else
                  InspectionRecord.active.order(created_at: :desc).limit(5)
                end
    @trend_data = InspectionRecord.trend_data(14)
  end
end
