class IssueTypesController < ApplicationController
  before_action :require_login
  before_action :require_supervisor, except: [:index]
  before_action :set_issue_type, only: [:edit, :update, :destroy]

  def index
    @issue_types = IssueType.order(:category, :name).all
  end

  def new
    @issue_type = IssueType.new
  end

  def create
    @issue_type = IssueType.new(issue_type_params)
    if @issue_type.save
      flash[:notice] = "问题类型创建成功"
      redirect_to issue_types_path
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @issue_type.update(issue_type_params)
      flash[:notice] = "问题类型更新成功"
      redirect_to issue_types_path
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @issue_type.destroy
    flash[:notice] = "问题类型已删除"
    redirect_to issue_types_path
  end

  private

  def set_issue_type
    @issue_type = IssueType.find(params[:id])
  end

  def issue_type_params
    params.require(:issue_type).permit(:name, :category)
  end

  def require_supervisor
    unless current_user_role?(:supervisor)
      flash[:alert] = "只有主管可以管理问题类型"
      redirect_to root_path
    end
  end
end
