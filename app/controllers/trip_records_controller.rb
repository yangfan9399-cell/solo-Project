class TripRecordsController < ApplicationController
  before_action :set_trip_record, only: [:show, :edit, :update, :approve, :reject, :complete]

  def index
    @trip_records = TripRecord.all
    @trip_records = @trip_records.where(review_status: params[:review_status]) if params[:review_status].present?
    @trip_records = @trip_records.where(vehicle_id: params[:vehicle_id]) if params[:vehicle_id].present?
    @trip_records = @trip_records.where(route_id: params[:route_id]) if params[:route_id].present?
    if params[:start_date].present?
      @trip_records = @trip_records.where('planned_departure_time >= ?', Date.parse(params[:start_date]).beginning_of_day)
    end
    if params[:end_date].present?
      @trip_records = @trip_records.where('planned_departure_time <= ?', Date.parse(params[:end_date]).end_of_day)
    end
    @trip_records = @trip_records.order(planned_departure_time: :desc)
  end

  def show
    @vehicle = @trip_record.vehicle
  end

  def new
    @trip_record = TripRecord.new
    @vehicles = Vehicle.available_for_dispatch
    @routes = Route.all
  end

  def create
    @trip_record = TripRecord.new(trip_record_params)
    @trip_record.review_status ||= :pending

    if @trip_record.save
      redirect_to @trip_record, notice: '出车申请已创建，等待队长复核'
    else
      @blocking_issues = @trip_record.blocking_issues if @trip_record.vehicle
      @vehicles = Vehicle.available_for_dispatch
      @routes = Route.all
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    @vehicles = Vehicle.all
    @routes = Route.all
  end

  def update
    if @trip_record.update(trip_record_params)
      redirect_to @trip_record, notice: '出车单已更新'
    else
      @vehicles = Vehicle.all
      @routes = Route.all
      render :edit, status: :unprocessable_entity
    end
  end

  def approve
    unless @trip_record.can_approve?
      redirect_to @trip_record, alert: '当前状态不可复核通过'
      return
    end

    issues = @trip_record.blocking_issues
    if issues.any?
      redirect_to @trip_record, alert: "无法批准出车，存在#{issues.count}项阻止：#{issues.join('；')}"
      return
    end

    ActiveRecord::Base.transaction do
      @trip_record.update!(
        review_status: :approved,
        reviewer: '队长',
        reviewed_at: Time.current
      )
      @trip_record.vehicle.update!(status: :available)
    end

    redirect_to @trip_record, notice: '出车复核已通过'
  end

  def reject
    unless @trip_record.pending?
      redirect_to @trip_record, alert: '当前状态不可复核驳回'
      return
    end

    if params[:review_note].blank?
      redirect_to @trip_record, alert: '请填写驳回理由'
      return
    end

    @trip_record.update!(
      review_status: :rejected,
      reviewer: '队长',
      reviewed_at: Time.current,
      review_note: params[:review_note]
    )

    redirect_to @trip_record, notice: '出车复核已驳回'
  end

  def complete
    unless @trip_record.approved? || @trip_record.is_active?
      redirect_to @trip_record, alert: '当前状态不可完成出车'
      return
    end

    if params[:end_mileage].blank?
      redirect_to @trip_record, alert: '请填写实际里程'
      return
    end

    @trip_record.update!(
      end_mileage: params[:end_mileage],
      actual_return_time: Time.current,
      is_active: false
    )

    redirect_to @trip_record, notice: '出车已完成'
  end

  private

  def set_trip_record
    @trip_record = TripRecord.find(params[:id])
  end

  def trip_record_params
    params.require(:trip_record).permit(
      :vehicle_id,
      :route_id,
      :driver_name,
      :planned_departure_time,
      :planned_return_time,
      :actual_departure_time,
      :actual_return_time,
      :start_mileage,
      :end_mileage,
      :review_status,
      :review_note
    )
  end
end
