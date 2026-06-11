class InspectionRecordsController < ApplicationController
  before_action :set_inspection_record, only: [:show, :edit, :update]

  def index
    @inspection_records = InspectionRecord.all
    @inspection_records = @inspection_records.where(vehicle_id: params[:vehicle_id]) if params[:vehicle_id].present?
    @inspection_records = @inspection_records.where(inspection_type: params[:inspection_type]) if params[:inspection_type].present?
    @inspection_records = @inspection_records.where(overall_result: params[:overall_result]) if params[:overall_result].present?

    @inspection_records = @inspection_records.includes(:vehicle).order(inspection_date: :desc)
  end

  def show
  end

  def new
    @inspection_record = InspectionRecord.new
    @inspection_record.inspection_date = Date.today
    @inspection_record.overall_result = :pass
    @vehicles = Vehicle.order(plate_number: :asc)
  end

  def create
    @inspection_record = InspectionRecord.new(inspection_record_params)

    if @inspection_record.save
      respond_to do |format|
        format.turbo_stream
        format.html { redirect_to @inspection_record, notice: '检查记录创建成功。' }
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
    if @inspection_record.update(inspection_record_params)
      respond_to do |format|
        format.turbo_stream
        format.html { redirect_to @inspection_record, notice: '检查记录更新成功。' }
      end
    else
      @vehicles = Vehicle.order(plate_number: :asc)
      render :edit, status: :unprocessable_entity
    end
  end

  private

  def set_inspection_record
    @inspection_record = InspectionRecord.find(params[:id])
  end

  def inspection_record_params
    params.require(:inspection_record).permit(
      :vehicle_id, :inspector, :inspection_date, :inspection_type,
      :overall_result, :issues_found, :brakes_status, :tires_status,
      :lights_status, :steering_status, :oil_status, :water_status,
      :cleaning_status, :remarks
    )
  end
end
