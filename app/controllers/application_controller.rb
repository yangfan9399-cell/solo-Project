class ApplicationController < ActionController::Base
  helper_method :current_user, :logged_in?, :role_name

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

  def role_name(role)
    case role
    when "admin" then "系统管理员"
    when "biz_admin" then "商务经办人"
    when "copyright_admin" then "版权管理员"
    when "legal" then "法务专员"
    when "finance" then "财务专员"
    else role
    end
  end
end