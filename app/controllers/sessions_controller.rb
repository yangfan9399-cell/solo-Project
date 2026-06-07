class SessionsController < ApplicationController
  skip_before_action :require_login, only: [:new, :create]

  def new
  end

  def create
    user = User.find_by(email: params[:email].downcase)
    if user&.authenticate(params[:password])
      session[:user_id] = user.id
      flash[:notice] = "登录成功，欢迎 #{user.name}！"
      redirect_to root_path
    else
      flash.now[:alert] = "邮箱或密码错误"
      render :new, status: :unprocessable_entity
    end
  end

  def destroy
    session[:user_id] = nil
    @current_user = nil
    flash[:notice] = "已退出登录"
    redirect_to login_path
  end
end
