class PageMappingsController < ApplicationController
  before_action :set_project
  before_action :set_page_mapping, only: %i[update destroy]

  def index
    @page_mappings = @project.page_mappings.order(:pdf_page_index)
    @page_mappings = @page_mappings.by_status(params[:status]) if params[:status].present?
  end

  def create
    @page_mapping = @project.page_mappings.build(page_mapping_params)

    respond_to do |format|
      if @page_mapping.save
        format.html { redirect_to project_page_mappings_path(@project), notice: "页码映射创建成功。" }
        format.turbo_stream
      else
        format.html { redirect_to project_page_mappings_path(@project), alert: "创建失败: #{@page_mapping.errors.full_messages.join('，')}" }
      end
    end
  end

  def update
    respond_to do |format|
      if @page_mapping.update(page_mapping_params)
        format.html { redirect_to project_page_mappings_path(@project), notice: "页码映射更新成功。" }
        format.turbo_stream
        format.json { render :show, status: :ok, location: [@project, @page_mapping] }
      else
        format.html { redirect_to project_page_mappings_path(@project), alert: "更新失败: #{@page_mapping.errors.full_messages.join('，')}" }
        format.json { render json: @page_mapping.errors, status: :unprocessable_content }
      end
    end
  end

  def batch_update
    mappings_params = params[:page_mappings] || []

    ActiveRecord::Base.transaction do
      mappings_params.each do |mapping_data|
        mapping = @project.page_mappings.find(mapping_data[:id])
        mapping.update!(mapping_data.permit(:actual_page_number, :status, :notes))
      end
    end

    redirect_to project_page_mappings_path(@project), notice: "批量更新成功。"
  rescue ActiveRecord::RecordInvalid => e
    redirect_to project_page_mappings_path(@project), alert: "批量更新失败: #{e.message}"
  end

  def batch_number
    numberer = PageMappingBatchNumberer.new(@project, batch_number_params)
    count = numberer.number!

    redirect_to project_page_mappings_path(@project), notice: "已为#{count}条映射编号。"
  end

  def destroy
    @page_mapping.destroy!

    respond_to do |format|
      format.html { redirect_to project_page_mappings_path(@project), notice: "页码映射已删除。", status: :see_other }
      format.turbo_stream
    end
  end

  def generate_mappings
    total_pages = @project.total_pages

    if total_pages.blank? || total_pages <= 0
      redirect_to project_page_mappings_path(@project), alert: "请先设置项目总页数。"
      return
    end

    @project.page_mappings.destroy_all

    (1..total_pages).each do |i|
      @project.page_mappings.create!(pdf_page_index: i, actual_page_number: i, status: PageMapping::NORMAL)
    end

    redirect_to project_page_mappings_path(@project), notice: "已生成#{total_pages}条页码映射。"
  end

  private

  def set_project
    @project = Project.find(params[:project_id])
  end

  def set_page_mapping
    @page_mapping = @project.page_mappings.find(params[:id])
  end

  def page_mapping_params
    params.expect(page_mapping: [:pdf_page_index, :actual_page_number, :status, :notes])
  end

  def batch_number_params
    params.permit(:start_number, :prefix, :suffix, :increment).with_defaults(start_number: 1, increment: 1)
  end
end
