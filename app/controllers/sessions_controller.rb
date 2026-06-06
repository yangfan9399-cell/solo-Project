class SessionsController < ApplicationController
  def new
    @users = User.all.order(:role, :name)
  end

  def create
    user = User.find(params[:user_id])
    session[:user_id] = user.id
    redirect_back fallback_location: root_path, notice: "已切换为：#{user.name}（#{user.role_name}）"
  end

  def destroy
    session[:user_id] = nil
    redirect_back fallback_location: root_path, notice: "已退出登录"
  end
end
