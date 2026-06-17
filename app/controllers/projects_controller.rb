require "csv"

class ProjectsController < ApplicationController
  before_action :find_project, only: [:show, :edit, :update, :destroy, :export_components]

  def index
    @projects = Project.all
    @projects = @projects.where(status: params[:status]) if params[:status].present?
    @projects = @projects.where(building_type: params[:building_type]) if params[:building_type].present?
    if params[:query].present?
      @projects = @projects.where("name LIKE ? OR code LIKE ? OR description LIKE ?",
        "%#{params[:query]}%", "%#{params[:query]}%", "%#{params[:query]}%")
    end
    @page = (params[:page] || 1).to_i
    @per_page = 20
    @total_count = @projects.count
    @projects = @projects.order(created_at: :desc).offset((@page - 1) * @per_page).limit(@per_page)
    @total_pages = (@total_count.to_f / @per_page).ceil

    @stats = {
      total: Project.count,
      by_status: Project.group(:status).count,
      by_building_type: Project.group(:building_type).count
    }

    all_components = Component.all
    @anomaly_stats = {
      status_anomaly: all_components.status_anomaly.count,
      critical_defects: all_components.critical_defects.count,
      no_code: all_components.no_code.count,
      awaiting_overdue: all_components.awaiting_reassembly_overdue.count,
      total: 0
    }
    @anomaly_stats[:total] = @anomaly_stats.values.sum
  end

  def show
    @page = (params[:page] || 1).to_i
    @per_page = 20
    components_scope = @project.components
    @total_count = components_scope.count
    @components = components_scope.order(created_at: :desc).offset((@page - 1) * @per_page).limit(@per_page)
    @total_pages = (@total_count.to_f / @per_page).ceil
    @stats = {
      total_components: @project.components.count,
      by_status: @project.components.group(:status).count,
      by_type: @project.components.group(:component_type).count,
      total_defects: @project.components.joins(:defects).count
    }
    @anomalies_summary = @project.anomalies_summary
    @anomalous_components = @project.components.with_anomalies.limit(20)
  end

  def new
    @project = Project.new
  end

  def create
    @project = Project.new(project_params)
    if @project.save
      flash[:notice] = "项目创建成功"
      redirect_to @project
    else
      flash[:alert] = "项目创建失败"
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @project.update(project_params)
      flash[:notice] = "项目更新成功"
      redirect_to @project
    else
      flash[:alert] = "项目更新失败"
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @project.destroy
    flash[:notice] = "项目已删除"
    redirect_to projects_path
  end

  def export
    @projects = Project.all
    @projects = @projects.where(status: params[:status]) if params[:status].present?
    @projects = @projects.where(building_type: params[:building_type]) if params[:building_type].present?
    if params[:query].present?
      @projects = @projects.where("name LIKE ? OR code LIKE ?", "%#{params[:query]}%", "%#{params[:query]}%")
    end

    csv_data = CSV.generate(headers: true) do |csv|
      csv << %w[编号 名称 建筑类型 状态 朝代 地点 开始日期 完成日期 构件数量]
      @projects.each do |project|
        csv << [
          project.code,
          project.name,
          project.building_type,
          project.status,
          project.era,
          project.location,
          project.started_at,
          project.completed_at,
          project.components.count
        ]
      end
    end

    send_data csv_data, filename: "projects_#{Date.today}.csv", type: "text/csv"
  end

  def export_components
    @components = @project.components.all
    @components = @components.where(component_type: params[:type]) if params[:type].present?
    @components = @components.where(status: params[:status]) if params[:status].present?
    @components = @components.where(orientation: params[:orientation]) if params[:orientation].present?
    @components = @components.where(batch_tag: params[:batch]) if params[:batch].present?
    if params[:query].present?
      @components = @components.where("code LIKE ? OR notes LIKE ?", "%#{params[:query]}%", "%#{params[:query]}%")
    end

    csv_data = CSV.generate(headers: true) do |csv|
      csv << %w[完整编号 构件类型 状态 拆卸位置 朝向 层位 材质 尺寸 批次号 缺损数量 最后版本时间]
      @components.each do |component|
        latest_version = component.latest_version
        csv << [
          component.full_code,
          component.component_type,
          component.status,
          component.position,
          component.orientation,
          component.layer,
          component.material,
          "#{component.length}×#{component.width}×#{component.height}",
          component.batch_tag,
          component.defect_count,
          latest_version&.recorded_at
        ]
      end
    end

    send_data csv_data, filename: "#{@project.code}_components_#{Date.today}.csv", type: "text/csv"
  end

  def search
    @projects = Project.all
    if params[:query].present?
      @projects = @projects.where("name LIKE ? OR code LIKE ?", "%#{params[:query]}%", "%#{params[:query]}%")
    end
    @projects = @projects.limit(10)
    render json: @projects.as_json(only: [:id, :name, :code])
  end

  private

  def find_project
    @project = Project.find(params[:id])
  end

  def project_params
    params.require(:project).permit(:name, :code, :description, :status, :building_type,
      :era, :location, :started_at, :completed_at)
  end
end
