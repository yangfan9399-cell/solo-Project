class ApplicationController < ActionController::Base
  before_action :set_current_user
  helper_method :current_user
  helper_method :all_users

  private

  def current_user
    @current_user ||= User.find_by(id: session[:current_user_id]) || User.first
  end

  def all_users
    @all_users ||= User.all.order(:name)
  end

  def set_current_user
    if params[:user_id].present?
      session[:current_user_id] = params[:user_id]
      @current_user = User.find_by(id: params[:user_id])
    end
  end
end
