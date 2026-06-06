class UsersController < ApplicationController
  before_action :set_user, only: [:show, :edit, :update, :destroy]

  def index
    @users = User.all.order(:name)
    @users_by_role = User.group(:role).count
  end

  def show
    @borrow_records = case @user.role
    when "stage_manager"
      @user.applied_borrow_records.order(created_at: :desc)
    when "crew_leader"
      @user.confirmed_borrow_records.order(created_at: :desc)
    when "asset_auditor"
      @user.audited_borrow_records.order(created_at: :desc)
    else
      []
    end
  end

  def new
    @user = User.new
  end

  def create
    @user = User.new(user_params)
    if @user.save
      redirect_to @user, notice: "用户创建成功"
    else
      render :new
    end
  end

  def edit
  end

  def update
    if @user.update(user_params)
      redirect_to @user, notice: "用户更新成功"
    else
      render :edit
    end
  end

  def destroy
    @user.destroy
    redirect_to users_url, notice: "用户已删除"
  end

  private

  def set_user
    @user = User.find(params[:id])
  end

  def user_params
    params.require(:user).permit(:name, :role, :phone, :email)
  end
end
