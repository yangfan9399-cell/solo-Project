class ReservationsController < ApplicationController
  before_action :set_reservation, only: [:show, :edit, :update, :destroy, :confirm, :reject]
  before_action :set_employees, only: [:new, :edit, :create, :update]
  before_action :set_entrances, only: [:new, :edit, :create, :update]

  def index
    @reservations = Reservation.includes(:visitor, :vehicle, :host, :entrance).order(created_at: :desc)
  end

  def show
    @visit_record = @reservation.visit_record
  end

  def new
    @reservation = Reservation.new
    @reservation.build_vehicle if @reservation.vehicle.blank?
  end

  def edit
  end

  def create
    @reservation = Reservation.new(reservation_params)

    if @reservation.save
      redirect_to @reservation, notice: '预约已创建'
    else
      render :new, status: :unprocessable_entity
    end
  end

  def update
    if @reservation.update(reservation_params)
      redirect_to @reservation, notice: '预约已更新'
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @reservation.destroy
    redirect_to reservations_url, notice: '预约已删除'
  end

  def confirm
    if @reservation.may_confirm?
      @reservation.confirm!
      @reservation.create_visit_record!
      redirect_to @reservation, notice: '预约已确认'
    else
      redirect_to @reservation, alert: '无法确认预约'
    end
  end

  def reject
    if @reservation.may_reject?
      @reservation.reject!
      redirect_to @reservation, notice: '预约已拒绝'
    else
      redirect_to @reservation, alert: '无法拒绝预约'
    end
  end

  private

  def set_reservation
    @reservation = Reservation.includes(:visitor, :vehicle, :host, :entrance).find(params[:id])
  end

  def set_employees
    @employees = Employee.where(is_security_guard: false).order(:name)
  end

  def set_entrances
    @entrances = Entrance.active.order(:name)
  end

  def reservation_params
    params.require(:reservation).permit(
      :visitor_id, :vehicle_id, :host_id, :entrance_id,
      :scheduled_at, :scheduled_end_at, :purpose, :host_notes,
      vehicle_attributes: [:license_plate, :vehicle_type, :color]
    )
  end
end
