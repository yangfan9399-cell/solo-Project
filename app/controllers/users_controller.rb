class UsersController < ApplicationController
  before_action :require_login, except: [:new, :create]
  before_action :set_user, only: [:edit, :update]
  before_action :require_supervisor_or_owner, only: [:edit, :update]

  def index
    @users = User.order(:role, :name)
  end

  def new
    @user = User.new
  end

  def create
    @user = User.new(user_params)
    if @user.save
      session[:user_id] ||= @user.id if logged_in?
      flash[:notice] = "用户创建成功"
      redirect_to users_path
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @user.update(user_params)
      flash[:notice] = "用户信息更新成功"
      redirect_to users_path
    else
      render :edit, status: :unprocessable_entity
    end
  end

  private

  def set_user
    @user = User.find(params[:id])
  end

  def user_params
    params.require(:user).permit(:name, :email, :role, :password, :password_confirmation)
  end

  def require_supervisor_or_owner
    unless current_user_role?(:supervisor) || current_user == @user
      flash[:alert] = "您没有权限执行此操作"
      redirect_to root_path
    end
  end
end
