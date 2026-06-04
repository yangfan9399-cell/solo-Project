class ApplicationController < ActionController::Base
  allow_browser versions: :modern
  stale_when_importmap_changes

  before_action :authenticate_user!

  helper_method :current_user, :signed_in?, :front_desk?, :duty_manager?

  private

  def current_user
    @current_user ||= User.find_by(id: session[:user_id]) if session[:user_id]
  end

  def signed_in?
    current_user.present?
  end

  def front_desk?
    current_user&.front_desk?
  end

  def duty_manager?
    current_user&.duty_manager?
  end

  def authenticate_user!
    unless signed_in?
      redirect_to sign_in_path, alert: "请先登录"
    end
  end

  def require_front_desk!
    unless front_desk?
      redirect_to root_path, alert: "仅前台经办人可执行此操作"
    end
  end

  def require_duty_manager!
    unless duty_manager?
      redirect_to root_path, alert: "仅值班经理可执行此操作"
    end
  end
end
