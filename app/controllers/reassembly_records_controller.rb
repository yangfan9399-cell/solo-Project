class ReassemblyRecordsController < ApplicationController
  before_action :find_component
  before_action :find_record, only: [:show, :edit, :update, :destroy]

  def index
    @page = (params[:page] || 1).to_i
    @per_page = 20
    scope = @component.reassembly_records.order(checked_at: :desc)
    @total_count = scope.count
    @reassembly_records = scope.offset((@page - 1) * @per_page).limit(@per_page)
    @total_pages = (@total_count.to_f / @per_page).ceil
  end

  def show
  end

  def new
    @reassembly_record = @component.reassembly_records.new
    @reassembly_record.checked_at = Time.current
  end

  def create
    @reassembly_record = @component.reassembly_records.new(reassembly_record_params)
    @reassembly_record.checked_at ||= Time.current
    if @reassembly_record.save
      flash[:notice] = "复装记录创建成功"
      redirect_to project_component_reassembly_record_path(@project, @component, @reassembly_record)
    else
      flash[:alert] = "复装记录创建失败"
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @reassembly_record.update(reassembly_record_params)
      flash[:notice] = "复装记录更新成功"
      redirect_to project_component_reassembly_record_path(@project, @component, @reassembly_record)
    else
      flash[:alert] = "复装记录更新失败"
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @reassembly_record.destroy
    flash[:notice] = "复装记录已删除"
    redirect_to project_component_reassembly_records_path(@project, @component)
  end

  private

  def find_component
    @project = Project.find(params[:project_id])
    @component = @project.components.find(params[:component_id])
  end

  def find_record
    @reassembly_record = @component.reassembly_records.find(params[:id])
  end

  def reassembly_record_params
    params.require(:reassembly_record).permit(:checked_at, :checked_by, :result,
      :position_deviation, :verified, :notes)
  end
end
