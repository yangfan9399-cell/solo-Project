require "csv"

class ComponentsController < ApplicationController
  before_action :find_project
  before_action :find_component, only: [:show, :edit, :update, :destroy, :reassembly_check, :rollback]

  def index
    @components = @project.components.all
    @components = @components.where(component_type: params[:type]) if params[:type].present?
    @components = @components.where(status: params[:status]) if params[:status].present?
    @components = @components.where(orientation: params[:orientation]) if params[:orientation].present?
    @components = @components.where(batch_tag: params[:batch]) if params[:batch].present?
    if params[:query].present?
      @components = @components.where("code LIKE ? OR notes LIKE ?", "%#{params[:query]}%", "%#{params[:query]}%")
    end
    @page = (params[:page] || 1).to_i
    @per_page = 20
    @total_count = @components.count
    @components = @components.order(created_at: :desc).offset((@page - 1) * @per_page).limit(@per_page)
    @total_pages = (@total_count.to_f / @per_page).ceil
  end

  def export
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

  def show
    @defects = @component.defects.order(created_at: :desc)
    @versions = @component.component_versions.order(version_number: :desc)
    @reassembly_records = @component.reassembly_records.order(checked_at: :desc)
  end

  def new
    @component = @project.components.new
  end

  def create
    @component = @project.components.new(component_params)
    if @component.save
      flash[:notice] = "构件创建成功"
      redirect_to project_component_path(@project, @component)
    else
      flash[:alert] = "构件创建失败"
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @component.update(component_params)
      flash[:notice] = "构件更新成功"
      redirect_to project_component_path(@project, @component)
    else
      flash[:alert] = "构件更新失败"
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @component.destroy
    flash[:notice] = "构件已删除"
    redirect_to project_components_path(@project)
  end

  def reassembly_check
    @reassembly_record = @component.reassembly_records.new(reassembly_params)
    @reassembly_record.checked_at = Time.current
    if @reassembly_record.save
      @component.create_version("reassembly", @reassembly_record.checked_by.presence || "系统", "新增复装核对记录")
      flash[:notice] = "复装核对记录创建成功"
    else
      flash[:alert] = "复装核对记录创建失败"
    end
    redirect_to project_component_path(@project, @component)
  end

  def rollback
    version = @component.component_versions.find_by(version_number: params[:version_number])
    if version && version.object_snapshot.present?
      snapshot = version.snapshot_object
      restore_attrs = {}
      %w[code component_type position orientation status notes].each do |key|
        restore_attrs[key] = snapshot[key] if snapshot.key?(key)
      end
      @component.skip_version_track = true
      if @component.update(restore_attrs)
        @component.create_version("update", "系统", "回滚到版本 #{version.version_number}")
        flash[:notice] = "构件已回滚到版本 #{version.version_number}"
      else
        flash[:alert] = "回滚失败"
      end
    else
      flash[:alert] = "指定版本不存在"
    end
    redirect_to project_component_path(@project, @component)
  end

  private

  def find_project
    @project = Project.find(params[:project_id])
  end

  def find_component
    @component = @project.components.find(params[:id])
  end

  def component_params
    params.require(:component).permit(:code, :component_type, :status, :orientation,
      :batch_tag, :material, :position, :layer, :sequence, :length, :width, :height,
      :parent_component_id, :photo_refs_text, :notes)
  end

  def reassembly_params
    if params[:reassembly_record]
      params.require(:reassembly_record).permit(:checked_by, :result, :position_deviation, :verified, :notes)
    else
      params.permit(:checked_by, :result, :position_deviation, :verified, :notes)
    end
  end
end
