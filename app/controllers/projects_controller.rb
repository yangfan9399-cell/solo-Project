class ProjectsController < ApplicationController
  before_action :set_project, only: [:show, :edit, :update, :destroy, :compare, :history]

  def index
    @projects = Project.all
    @projects = apply_filters(@projects)
    @projects = apply_search(@projects)
    @projects = @projects.order(created_at: :desc).limit(50)

    @stats = {
      total: Project.count,
      active: Project.active.count,
      abnormal: Project.all.count { |p| p.has_abnormal_data? },
      records: Record.count
    }
  end

  def show
    @records = @project.records.includes(:annotations, :scale_markers)
    @latest_record = @project.latest_record
    @disease_summary = @project.disease_summary
    @severity_summary = @project.severity_summary
  end

  def new
    @project = Project.new
  end

  def create
    @project = Project.new(project_params)
    if @project.save
      redirect_to @project, notice: "项目创建成功"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @project.update(project_params)
      redirect_to @project, notice: "项目更新成功"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @project.destroy
    redirect_to projects_path, notice: "项目已删除"
  end

  def search
    @projects = apply_search(Project.all).limit(10)
    render json: @projects.as_json(only: [:id, :name, :code, :location, :status])
  end

  def compare
    @record_ids = params[:record_ids]&.split(",") || []
    @records = @project.records.where(id: @record_ids).order(:record_date)
    if @records.size < 2
      redirect_to history_project_path(@project), alert: "请选择至少两个版本进行对比"
    end
  end

  def history
    @records = @project.records.includes(:annotations).order(record_date: :desc)
    @yearly_records = @project.records_by_year
  end

  private

  def set_project
    @project = Project.find(params[:id])
  end

  def project_params
    params.require(:project).permit(:name, :code, :location, :dynasty, :description, :status, :start_date, :end_date)
  end

  def apply_filters(scope)
    scope = scope.where(status: params[:status]) if params[:status].present?
    scope = scope.where(dynasty: params[:dynasty]) if params[:dynasty].present?
    if params[:has_abnormal].present? && params[:has_abnormal] == "true"
      scope = scope.select { |p| p.has_abnormal_data? }
      scope = Project.where(id: scope.map(&:id))
    end
    scope
  end

  def apply_search(scope)
    if params[:q].present?
      q = "%#{params[:q]}%"
      scope = scope.where("name LIKE ? OR code LIKE ? OR location LIKE ? OR description LIKE ?", q, q, q, q)
    end
    scope
  end
end
