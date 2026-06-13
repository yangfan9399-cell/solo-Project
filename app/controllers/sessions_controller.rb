class SessionsController < ApplicationController
  skip_before_action :authenticate_user!
  skip_after_action :verify_authorized
  skip_after_action :verify_policy_scoped

  def new
  end

  def create
    @user = User.find_by(email: params[:email].downcase)

    if @user && @user.authenticate(params[:password])
      sign_in(@user)
      redirect_to root_path, notice: "欢迎回来，#{@user.name}！"
    else
      flash.now[:alert] = '邮箱或密码错误'
      render :new, status: :unprocessable_entity
    end
  end

  def destroy
    sign_out
    redirect_to login_path, notice: '已安全退出系统'
  end
end
