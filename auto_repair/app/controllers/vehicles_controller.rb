class VehiclesController < ApplicationController
  def index
    @vehicles = Vehicle.all.order(created_at: :desc)
  end

  def show
    @vehicle = Vehicle.find(params[:id])
    @repair_orders = @vehicle.repair_orders.order(created_at: :desc)
  end

  def new
    @vehicle = Vehicle.new
  end

  def create
    @vehicle = Vehicle.new(vehicle_params)
    if @vehicle.save
      redirect_to @vehicle, notice: '车辆已创建'
    else
      render :new, status: :unprocessable_entity
    end
  end

  private

  def vehicle_params
    params.require(:vehicle).permit(:plate_number, :vin, :brand, :model, :color, :year, :mileage, :owner_name, :owner_phone)
  end
end
