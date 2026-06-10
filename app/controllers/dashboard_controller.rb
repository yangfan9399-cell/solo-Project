class DashboardController < ApplicationController
  before_action :require_login

  def index
    @pending_applications = Application.where(status: ["pending_copyright", "pending_legal", "pending_finance"]).count
    @approved_applications = Application.where(status: "approved").count
    @disputed_settlements = Settlement.where(status: "disputed").count
    @total_revenue = Settlement.where(status: "confirmed").sum(:total_amount)

    if current_user.biz_admin?
      @my_applications = Application.where(user: current_user).recent.limit(10)
    elsif current_user.copyright_admin?
      @pending_reviews = Application.where(status: "pending_copyright").recent.limit(10)
    elsif current_user.legal?
      @pending_reviews = Application.where(status: "pending_legal").recent.limit(10)
    elsif current_user.finance?
      @pending_reviews = Application.where(status: "pending_finance").recent.limit(10)
      @pending_settlements = Settlement.where(status: "pending").limit(10)
    end
  end
end