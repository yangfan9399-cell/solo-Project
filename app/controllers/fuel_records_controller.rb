class FuelRecordsController < ApplicationController
  before_action :set_fuel_record, only: [:show, :edit, :update]

  def index
    @fuel_records = FuelRecord.all
    @fuel_records = @fuel_records.where(vehicle_id: params[:vehicle_id]) if params[:vehicle_id].present?

    if params[:is_abnormal].present?
      @fuel_records = params[:is_abnormal] == 'true' ? @fuel_records.abnormal : @fuel_records.where(is_abnormal: false)
    end

    if params[:start_date].present?
      @fuel_records = @fuel_records.where('record_date >= ?', Date.parse(params[:start_date]))
    end
    if params[:end_date].present?
      @fuel_records = @fuel_records.where('record_date <= ?', Date.parse(params[:end_date]))
    end

    @fuel_records = @fuel_records.includes(:vehicle).order(record_date: :desc)
  end

  def show
  end

  def new
    @fuel_record = FuelRecord.new
    @fuel_record.record_date = Date.today
    @vehicles = Vehicle.order(plate_number: :asc)
  end

  def create
    @fuel_record = FuelRecord.new(fuel_record_params)

    if @fuel_record.save
      respond_to do |format|
        format.turbo_stream
        format.html { redirect_to @fuel_record, notice: '加油记录创建成功。' }
      end
    else
      @vehicles = Vehicle.order(plate_number: :asc)
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    @vehicles = Vehicle.order(plate_number: :asc)
  end

  def update
    if @fuel_record.update(fuel_record_params)
      respond_to do |format|
        format.turbo_stream
        format.html { redirect_to @fuel_record, notice: '加油记录更新成功。' }
      end
    else
      @vehicles = Vehicle.order(plate_number: :asc)
      render :edit, status: :unprocessable_entity
    end
  end

  private

  def set_fuel_record
    @fuel_record = FuelRecord.find(params[:id])
  end

  def fuel_record_params
    params.require(:fuel_record).permit(
      :vehicle_id, :record_date, :fuel_type, :fuel_amount,
      :fuel_cost, :gas_station, :start_mileage, :end_mileage,
      :recorded_by, :notes
    )
  end
end
