class VersionsController < ApplicationController
  before_action :set_version, only: [:show, :export_json, :export_summary]
  before_action :set_run_chart, only: [:create]

  def index
    if params[:project_id]
      @project = Project.find(params[:project_id])
      @versions = @project.versions.order(created_at: :desc)
    elsif params[:run_chart_id]
      @run_chart = RunChart.find(params[:run_chart_id])
      @versions = @run_chart.versions.order(created_at: :desc)
    else
      @versions = Version.all.order(created_at: :desc)
    end

    @versions = @versions.where("version_no LIKE ? OR batch_no LIKE ?", "%#{params[:keyword]}%", "%#{params[:keyword]}%") if params[:keyword].present?
    @versions = @versions.where(status: params[:status]) if params[:status].present?
  end

  def show
  end

  def create
    version = Version.generate_batch(@run_chart.project, @run_chart)
    redirect_to project_run_chart_workbench_path(@run_chart.project, @run_chart), notice: "版本 #{version.version_no} 已生成"
  end

  def export_json
    if @version.export_path && File.exist?(@version.export_path)
      send_file @version.export_path, filename: "version_#{@version.version_no}.json", type: 'application/json'
    else
      redirect_to @version, alert: '该版本暂无导出文件'
    end
  end

  def export_summary
    if @version.export_summary
      send_data JSON.pretty_generate(@version.export_summary), filename: "summary_#{@version.version_no}.json", type: 'application/json'
    else
      redirect_to @version, alert: '该版本暂无摘要数据'
    end
  end

  private

  def set_version
    @version = Version.find(params[:id])
  end

  def set_run_chart
    @run_chart = RunChart.find(params[:run_chart_id])
  end
end
