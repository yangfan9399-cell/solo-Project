class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception

  helper_method :current_user

  def current_user
    @current_user ||= User.find(session[:user_id]) if session[:user_id]
  end

  def authenticate_user!
    unless current_user
      redirect_to login_path, alert: "请先登录"
    end
  end

  def authenticate_admin!
    unless current_user&.can_access_admin?
      redirect_to root_path, alert: "无权限访问此页面"
    end
  end
end