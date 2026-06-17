class ProjectsController < ApplicationController
  before_action :set_project, only: %i[show edit update destroy detect_anomalies]

  def index
    @projects = Project.all
    @projects = @projects.by_status(params[:status]) if params[:status].present?
    @projects = @projects.search(params[:q]) if params[:q].present?
    @projects = @projects.includes(:anomalies)
  end

  def show
    @page_mappings = @project.page_mappings.order(:pdf_page_index)
    @anomalies = @project.anomalies.unresolved
    @batches = @project.batches.order(created_at: :desc)
  end

  def new
    @project = Project.new
  end

  def create
    @project = Project.new(project_params)

    respond_to do |format|
      if @project.save
        format.html { redirect_to @project, notice: "项目创建成功。" }
        format.json { render :show, status: :created, location: @project }
      else
        format.html { render :new, status: :unprocessable_content }
        format.json { render json: @project.errors, status: :unprocessable_content }
      end
    end
  end

  def edit
  end

  def update
    respond_to do |format|
      if @project.update(project_params)
        format.html { redirect_to @project, notice: "项目更新成功。", status: :see_other }
        format.json { render :show, status: :ok, location: @project }
      else
        format.html { render :edit, status: :unprocessable_content }
        format.json { render json: @project.errors, status: :unprocessable_content }
      end
    end
  end

  def destroy
    @project.destroy!

    respond_to do |format|
      format.html { redirect_to projects_path, notice: "项目已删除。", status: :see_other }
      format.json { head :no_content }
    end
  end

  def detect_anomalies
    @project.anomalies.where(resolved: false).destroy_all

    @project.page_mappings.find_each do |mapping|
      if mapping.actual_page_number.blank? && mapping.status == PageMapping::NORMAL
        @project.anomalies.create!(
          anomaly_type: Anomaly::MISSING,
          page_mapping: mapping,
          description: "PDF第#{mapping.pdf_page_index}页缺少实际页码"
        )
      end

      if mapping.status != PageMapping::NORMAL
        @project.anomalies.create!(
          anomaly_type: mapping.status,
          page_mapping: mapping,
          description: "PDF第#{mapping.pdf_page_index}页状态异常: #{mapping.status}"
        )
      end
    end

    @project.page_mappings
      .select(:actual_page_number)
      .where.not(actual_page_number: nil)
      .group(:actual_page_number)
      .having("COUNT(*) > 1")
      .each do |dup|
        mappings = @project.page_mappings.where(actual_page_number: dup.actual_page_number)
        mappings.each do |mapping|
          @project.anomalies.create!(
            anomaly_type: Anomaly::DUPLICATE,
            page_mapping: mapping,
            description: "实际页码#{dup.actual_page_number}存在重复"
          )
        end
      end

    redirect_to @project, notice: "异常检测完成，发现#{@project.anomalies.unresolved.count}个异常。"
  end

  private

  def set_project
    @project = Project.find(params.expect(:id))
  end

  def project_params
    params.expect(project: [:name, :description, :pdf_filename, :total_pages, :status])
  end
end
