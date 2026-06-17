class StationsController < ApplicationController
  before_action :set_train_route
  before_action :set_station, only: [:show, :edit, :update, :destroy]

  def index
    @stations = @train_route.stations.order(:order)
  end

  def show
  end

  def new
    @station = @train_route.stations.new
  end

  def edit
  end

  def create
    @station = @train_route.stations.new(station_params)
    @station.order = @train_route.stations.count + 1
    
    if @station.save
      redirect_to project_run_chart_workbench_path(
        @train_route.run_chart.project, @train_route.run_chart
      ), notice: '站点已添加'
    else
      render :new
    end
  end

  def update
    if @station.update(station_params)
      redirect_to project_run_chart_workbench_path(
        @train_route.run_chart.project, @train_route.run_chart
      ), notice: '站点已更新'
    else
      render :edit
    end
  end

  def destroy
    @station.destroy
    redirect_to project_run_chart_workbench_path(
      @train_route.run_chart.project, @train_route.run_chart
    ), notice: '站点已删除'
  end

  private

  def set_train_route
    @train_route = TrainRoute.find(params[:train_route_id])
  end

  def set_station
    @station = @train_route.stations.find(params[:id])
  end

  def station_params
    params.require(:station).permit(
      :name, :arrival_time, :departure_time, :stop_duration,
      :x_coordinate, :y_coordinate, :order
    )
  end
end