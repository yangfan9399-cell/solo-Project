class Admin::UsersController < ApplicationController
  before_action :require_login
  before_action :require_role, "admin"

  def index
    @users = User.all.order(created_at: :desc)
  end

  def create
    @user = User.new(user_params)

    if @user.save
      redirect_to admin_users_path, notice: "用户已创建"
    else
      render :index
    end
  end

  private

  def user_params
    params.require(:user).permit(:email, :password, :name, :role)
  end
end