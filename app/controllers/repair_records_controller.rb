class RepairRecordsController < ApplicationController
  before_action :set_repair_record, only: [:show, :edit, :update, :complete]

  def index
    @repair_records = RepairRecord.all
    @repair_records = @repair_records.where(status: params[:status]) if params[:status].present?
    @repair_records = @repair_records.where(vehicle_id: params[:vehicle_id]) if params[:vehicle_id].present?
    @repair_records = @repair_records.where(repair_type: params[:repair_type]) if params[:repair_type].present?

    @repair_records = @repair_records.includes(:vehicle).order(report_date: :desc)
  end

  def show
  end

  def new
    @repair_record = RepairRecord.new
    @repair_record.report_date = Date.today
    @repair_record.status = :reported
    @vehicles = Vehicle.order(plate_number: :asc)
  end

  def create
    @repair_record = RepairRecord.new(repair_record_params)

    if @repair_record.save
      respond_to do |format|
        format.turbo_stream
        format.html { redirect_to @repair_record, notice: '维修记录创建成功。' }
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
    if @repair_record.update(repair_record_params)
      respond_to do |format|
        format.turbo_stream
        format.html { redirect_to @repair_record, notice: '维修记录更新成功。' }
      end
    else
      @vehicles = Vehicle.order(plate_number: :asc)
      render :edit, status: :unprocessable_entity
    end
  end

  def complete
    if @repair_record.may_complete? || !@repair_record.completed?
      @repair_record.status = :completed
      @repair_record.end_date ||= Date.today

      if @repair_record.save
        respond_to do |format|
          format.turbo_stream
          format.html { redirect_to @repair_record, notice: '维修已标记完成。' }
        end
      else
        respond_to do |format|
          format.turbo_stream { render turbo_stream: turbo_stream.replace(@repair_record, partial: 'repair_records/repair_record', locals: { repair_record: @repair_record }) }
          format.html { redirect_to @repair_record, alert: @repair_record.errors.full_messages.join(', ') }
        end
      end
    else
      respond_to do |format|
        format.html { redirect_to @repair_record, alert: '该维修记录已完成或无法完成。' }
      end
    end
  end

  private

  def set_repair_record
    @repair_record = RepairRecord.find(params[:id])
  end

  def repair_record_params
    params.require(:repair_record).permit(
      :vehicle_id, :report_date, :repair_type, :status,
      :issue_description, :diagnosis, :start_date, :end_date,
      :technician, :location, :parts_cost, :labor_cost,
      :total_cost, :decommission_days, :notes
    )
  end
end
