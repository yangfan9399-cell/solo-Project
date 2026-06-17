class AnomaliesController < ApplicationController
  before_action :set_project
  before_action :set_anomaly, only: %i[resolve]

  def index
    @anomalies = @project.anomalies.order(created_at: :desc)
    @anomalies = @anomalies.by_type(params[:anomaly_type]) if params[:anomaly_type].present?
    @anomalies = @anomalies.where(resolved: params[:resolved] == "true") if params[:resolved].present?
  end

  def resolve
    @anomaly.update!(resolved: true)

    respond_to do |format|
      format.html { redirect_to project_anomalies_path(@project), notice: "异常已标记为已解决。" }
      format.turbo_stream
      format.json { render json: @anomaly, status: :ok }
    end
  end

  private

  def set_project
    @project = Project.find(params[:project_id])
  end

  def set_anomaly
    @anomaly = @project.anomalies.find(params[:id])
  end
end
