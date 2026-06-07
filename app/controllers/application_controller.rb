class ApplicationController < ActionController::Base
  before_action :require_login
  helper_method :current_user, :logged_in?, :current_user_role?

  private

  def current_user
    @current_user ||= User.find_by(id: session[:user_id]) if session[:user_id]
  end

  def logged_in?
    current_user.present?
  end

  def current_user_role?(role)
    logged_in? && current_user.role == role.to_s
  end

  def require_login
    unless logged_in?
      flash[:alert] = "请先登录"
      redirect_to login_path
    end
  end

  def require_role(*roles)
    unless logged_in? && roles.map(&:to_s).include?(current_user.role)
      flash[:alert] = "您没有权限执行此操作"
      redirect_to root_path
    end
  end
end
