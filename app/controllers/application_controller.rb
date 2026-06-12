class ApplicationController < ActionController::Base
  include Pundit::Authorization
  protect_from_forgery with: :exception

  helper_method :current_user
  helper_method :user_signed_in?

  def current_user
    @current_user ||= session[:user_id] ? User.find_by(id: session[:user_id]) : default_user
  end

  def user_signed_in?
    current_user.present?
  end

  def default_user
    @default_user ||= User.first || User.create!(name: "演示用户", email: "demo@example.com", role: :admin)
  end

  def switch_user
    user = User.find(params[:user_id])
    session[:user_id] = user.id
    redirect_back(fallback_location: root_path)
  end

  private

  def authenticate_user!
    redirect_to root_path, alert: "请先登录" unless user_signed_in?
  end
end
