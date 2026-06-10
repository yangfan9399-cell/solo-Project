class ApplicationController < ActionController::Base
  helper_method :current_user, :logged_in?

  private

  def current_user
    @current_user ||= User.find(session[:user_id]) if session[:user_id]
  end

  def logged_in?
    current_user.present?
  end

  def require_login
    redirect_to login_path, alert: "请先登录" unless logged_in?
  end

  def require_role(*roles)
    unless logged_in? && roles.include?(current_user.role)
      redirect_to root_path, alert: "权限不足"
    end
  end
end