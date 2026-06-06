class ApplicationController < ActionController::Base
  helper_method :current_user
  helper_method :current_user_role

  def current_user
    @current_user ||= User.find_by(id: session[:user_id]) || User.first
  end

  def current_user_role
    current_user&.role
  end
end
