class TrainRoutesController < ApplicationController
  before_action :set_run_chart, only: [:index, :new, :create]
  before_action :set_train_route, only: [:show, :edit, :update, :destroy]

  def index
    @train_routes = @run_chart.train_routes.order(:train_no)
  end

  def show
    @stations = @train_route.stations.order(:order)
    @annotations = @train_route.annotations.order(created_at: :desc)
  end

  def new
    @train_route = @run_chart.train_routes.new(status: 'draft')
    3.times { @train_route.stations.build }
  end

  def create
    @train_route = @run_chart.train_routes.new(train_route_params)
    if @train_route.save
      redirect_to [@run_chart.project, @run_chart, @train_route], notice: '列车径路创建成功'
    else
      render :new
    end
  end

  def edit
    @stations = @train_route.stations.order(:order)
  end

  def update
    if @train_route.update(train_route_params)
      redirect_to [@train_route.run_chart.project, @train_route.run_chart, @train_route], notice: '列车径路更新成功'
    else
      render :edit
    end
  end

  def destroy
    run_chart = @train_route.run_chart
    @train_route.destroy
    redirect_to [run_chart.project, run_chart], notice: '列车径路删除成功'
  end

  private

  def set_run_chart
    @run_chart = RunChart.find(params[:run_chart_id])
  end

  def set_train_route
    @train_route = TrainRoute.find(params[:id])
  end

  def train_route_params
    params.require(:train_route).permit(
      :train_no, :train_type, :color, :status, :path_data,
      stations_attributes: [:id, :name, :arrival_time, :departure_time, :x_coordinate, :y_coordinate, :stop_duration, :order, :_destroy]
    )
  end
end
