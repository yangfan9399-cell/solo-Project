class ProjectsController < ApplicationController
  before_action :set_project, only: [:show, :edit, :update, :destroy]

  def index
    @projects = Project.all
    @projects = @projects.where(status: params[:status]) if params[:status].present?
    @projects = @projects.where("name LIKE ? OR code LIKE ? OR department LIKE ?", "%#{params[:keyword]}%", "%#{params[:keyword]}%", "%#{params[:keyword]}%") if params[:keyword].present?
    @projects = @projects.order(created_at: :desc)
  end

  def show
    @run_charts = @project.run_charts.order(date: :desc)
    @versions = @project.versions.order(created_at: :desc).limit(5)
  end

  def new
    @project = Project.new(status: 'draft')
  end

  def create
    @project = Project.new(project_params)
    if @project.save
      redirect_to @project, notice: '项目创建成功'
    else
      render :new
    end
  end

  def edit
  end

  def update
    if @project.update(project_params)
      redirect_to @project, notice: '项目更新成功'
    else
      render :edit
    end
  end

  def destroy
    @project.destroy
    redirect_to projects_url, notice: '项目删除成功'
  end

  private

  def set_project
    @project = Project.find(params[:id])
  end

  def project_params
    params.require(:project).permit(:name, :code, :description, :status, :created_by, :department)
  end
end
