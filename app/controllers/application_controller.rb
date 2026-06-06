class ApplicationController < ActionController::Base
  helper_method :current_user
  helper_method :current_user_role

  def current_user
    @current_user ||= User.find_by(id: session[:user_id]) || User.first
  end

  def current_user_role
    current_user&.role
  end

  private

  def require_role(*roles)
    unless current_user && roles.include?(current_user.role.to_sym)
      role_names = roles.map { |r| I18n.t("roles.#{r}", default: r.to_s.humanize) }.join(" / ")
      flash[:alert] = "权限不足：该操作需要 #{role_names} 身份。当前身份：#{current_user.role_name}"
      redirect_back fallback_location: root_path
    end
  end

  def require_stage_manager
    require_role(:stage_manager)
  end

  def require_crew_leader
    require_role(:crew_leader)
  end

  def require_asset_auditor
    require_role(:asset_auditor)
  end
end
