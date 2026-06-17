class RunChartsController < ApplicationController
  before_action :set_project, only: [:index, :new, :create]
  before_action :set_run_chart, only: [:show, :edit, :update, :destroy, :workbench, :detect_anomalies, :calibrate, :export_json, :export_summary]

  def index
    @run_charts = @project.run_charts.order(date: :desc)
  end

  def show
    @train_routes = @run_chart.train_routes.order(:train_no)
    @annotations = @run_chart.annotations.order(created_at: :desc)
  end

  def workbench
    @train_routes = @run_chart.train_routes.order(:train_no)
    @stations = Station.joins(:train_route).where(train_routes: { run_chart_id: @run_chart.id }).order(:order)
    @annotations = @run_chart.annotations.where(type: 'anomaly').order(created_at: :desc)
  end

  def new
    @run_chart = @project.run_charts.new
  end

  def create
    @run_chart = @project.run_charts.new(run_chart_params)
    if @run_chart.save
      redirect_to [@project, @run_chart], notice: '运行图创建成功'
    else
      render :new
    end
  end

  def edit
  end

  def update
    if @run_chart.update(run_chart_params)
      redirect_to [@run_chart.project, @run_chart], notice: '运行图更新成功'
    else
      render :edit
    end
  end

  def destroy
    project = @run_chart.project
    @run_chart.destroy
    redirect_to project, notice: '运行图删除成功'
  end

  def calibrate
    @run_chart.update(
      scale_x: params[:scale_x].to_f,
      scale_y: params[:scale_y].to_f,
      offset_x: params[:offset_x].to_f,
      offset_y: params[:offset_y].to_f
    )
    redirect_to workbench_project_run_chart_path(@run_chart.project, @run_chart), notice: '坐标轴标定完成'
  end

  def detect_anomalies
    anomalies = []
    @run_chart.train_routes.each do |route|
      stations = route.stations.order(:order)
      stations.each_with_index do |station, index|
        next if index == 0
        prev_station = stations[index - 1]
        if prev_station.departure_time && station.arrival_time
          if station.arrival_time < prev_station.departure_time
            anomalies << {
              train_no: route.train_no,
              station_name: station.name,
              reason: "到达时间早于前一站出发时间"
            }
          end
        end
        if station.arrival_time && station.departure_time
          if station.departure_time < station.arrival_time
            anomalies << {
              train_no: route.train_no,
              station_name: station.name,
              reason: "出发时间早于到达时间"
            }
          end
        end
      end
    end

    anomalies.each do |anomaly|
      route = @run_chart.train_routes.find_by(train_no: anomaly[:train_no])
      station = route&.stations.find_by(name: anomaly[:station_name])
      if station
        Annotation.create(
          run_chart: @run_chart,
          annotatable: station,
          type: 'anomaly',
          content: anomaly[:reason],
          status: 'pending',
          x: station.x_coordinate,
          y: station.y_coordinate
        )
      end
    end

    redirect_to workbench_project_run_chart_path(@run_chart.project, @run_chart), notice: "检测完成，发现 #{anomalies.count} 个异常"
  end

  def export_json
    data = {
      project: @run_chart.project.as_json(only: [:id, :name, :code]),
      run_chart: @run_chart.as_json(only: [:id, :name, :date, :scale_x, :scale_y, :offset_x, :offset_y]),
      train_routes: @run_chart.train_routes.order(:train_no).map do |route|
        {
          train_no: route.train_no,
          train_type: route.train_type,
          color: route.color,
          status: route.status,
          stations: route.stations.order(:order).map do |station|
            {
              name: station.name,
              order: station.order,
              arrival_time: station.arrival_str,
              departure_time: station.departure_str,
              stop_duration: station.stop_duration,
              x_coordinate: station.x_coordinate,
              y_coordinate: station.y_coordinate
            }
          end
        }
      end,
      annotations: @run_chart.annotations.map do |annotation|
        {
          type: annotation.type,
          content: annotation.content,
          status: annotation.status,
          x: annotation.x,
          y: annotation.y
        }
      end
    }
    send_data JSON.pretty_generate(data), filename: "run_chart_#{@run_chart.id}_#{Date.today}.json", type: 'application/json'
  end

  def export_summary
    summary = {
      export_date: Date.today.to_s,
      project_name: @run_chart.project.name,
      project_code: @run_chart.project.code,
      run_chart_name: @run_chart.name,
      run_chart_date: @run_chart.date.to_s,
      total_routes: @run_chart.total_routes,
      total_stations: @run_chart.total_stations,
      anomalies_count: @run_chart.anomalies_count,
      route_summary: @run_chart.train_routes.order(:train_no).map do |route|
        {
          train_no: route.train_no,
          train_type: route.train_type_label,
          start_station: route.start_station&.name,
          end_station: route.end_station&.name,
          station_count: route.stations.count,
          status: route.status_label
        }
      end
    }
    send_data JSON.pretty_generate(summary), filename: "summary_#{@run_chart.id}_#{Date.today}.json", type: 'application/json'
  end

  private

  def set_project
    @project = Project.find(params[:project_id])
  end

  def set_run_chart
    @run_chart = RunChart.find(params[:id])
  end

  def run_chart_params
    params.require(:run_chart).permit(:name, :image_path, :scale_x, :scale_y, :offset_x, :offset_y, :date)
  end
end
