class DefectsController < ApplicationController
  before_action :find_component
  before_action :find_defect, only: [:show, :edit, :update, :destroy]

  def index
    @page = (params[:page] || 1).to_i
    @per_page = 20
    scope = @component.defects.order(created_at: :desc)
    @total_count = scope.count
    @defects = scope.offset((@page - 1) * @per_page).limit(@per_page)
    @total_pages = (@total_count.to_f / @per_page).ceil
  end

  def show
  end

  def new
    @defect = @component.defects.new
    @defect.discovered_at = Date.current
  end

  def create
    @defect = @component.defects.new(defect_params)
    @defect.discovered_at ||= Date.current
    if @defect.save
      flash[:notice] = "缺陷记录创建成功"
      redirect_to project_component_defect_path(@project, @component, @defect)
    else
      flash[:alert] = "缺陷记录创建失败"
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @defect.update(defect_params)
      flash[:notice] = "缺陷记录更新成功"
      redirect_to project_component_defect_path(@project, @component, @defect)
    else
      flash[:alert] = "缺陷记录更新失败"
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @defect.destroy
    flash[:notice] = "缺陷记录已删除"
    redirect_to project_component_defects_path(@project, @component)
  end

  private

  def find_component
    @project = Project.find(params[:project_id])
    @component = @project.components.find(params[:component_id])
  end

  def find_defect
    @defect = @component.defects.find(params[:id])
  end

  def defect_params
    params.require(:defect).permit(:defect_type, :severity, :description,
      :location_on_component, :measured_size, :discovered_at, :repaired,
      :repaired_at, :repair_notes)
  end
end
