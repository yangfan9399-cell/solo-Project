class SessionsController < ApplicationController
  skip_before_action :require_login, only: [:new, :create]

  def new
    @users = User.all
  end

  def create
    user = User.find_by(name: params[:name])
    if user && user.authenticate(params[:password])
      session[:user_id] = user.id
      redirect_to root_path, notice: "登录成功，欢迎 #{user.display_name}"
    else
      flash.now[:alert] = '用户名或密码错误'
      @users = User.all
      render :new
    end
  end

  def destroy
    reset_session
    redirect_to login_path, notice: '已退出登录'
  end

  def switch_user
    user = User.find(params[:id])
    session[:user_id] = user.id
    redirect_back fallback_location: root_path, notice: "已切换到 #{user.display_name}"
  end
end
