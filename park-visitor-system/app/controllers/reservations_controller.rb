class ReservationsController < ApplicationController
  before_action :set_reservation, only: [:show, :edit, :update, :destroy, :confirm, :reject]
  before_action :set_employees, only: [:new, :edit, :create, :update]
  before_action :set_entrances, only: [:new, :edit, :create, :update]
  before_action :set_visitors, only: [:new, :edit, :create, :update]

  def index
    @reservations = Reservation.includes(:visitor, :vehicle, :host, :entrance).order(created_at: :desc)
  end

  def show
    @visit_record = @reservation.visit_record
  end

  def new
    @reservation = Reservation.new
  end

  def edit
  end

  def create
    ActiveRecord::Base.transaction do
      visitor = find_or_create_visitor
      vehicle = find_or_create_vehicle(visitor)

      @reservation = Reservation.new(
        visitor: visitor,
        vehicle: vehicle,
        host_id: reservation_params[:host_id],
        entrance_id: reservation_params[:entrance_id],
        scheduled_at: reservation_params[:scheduled_at],
        scheduled_end_at: reservation_params[:scheduled_end_at],
        purpose: reservation_params[:purpose],
        status: :pending
      )

      if @reservation.save
        redirect_to @reservation, notice: '预约已创建'
      else
        render :new, status: :unprocessable_entity
      end
    rescue ActiveRecord::RecordInvalid => e
      flash[:alert] = e.message
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

  def set_visitors
    @visitors = Visitor.order(:name)
  end

  def find_or_create_visitor
    if params[:reservation][:visitor_id].present?
      Visitor.find(params[:reservation][:visitor_id])
    elsif params[:visitor_name].present? || params[:visitor_phone].present?
      Visitor.find_or_create_by!(
        phone: params[:visitor_phone]
      ) do |v|
        v.name = params[:visitor_name]
        v.company = params[:visitor_company]
      end
    else
      raise ActiveRecord::RecordInvalid.new(Visitor.new), '请选择或创建访客'
    end
  end

  def find_or_create_vehicle(visitor)
    license_plate = params[:reservation][:license_plate].to_s.strip.upcase
    raise ActiveRecord::RecordInvalid.new(Vehicle.new), '车牌号不能为空' if license_plate.blank?

    Vehicle.find_or_create_by!(
      license_plate: license_plate
    ) do |v|
      v.visitor = visitor
      v.vehicle_type = params[:reservation][:vehicle_type] || 'car'
      v.color = params[:reservation][:color]
      v.active = true
    end
  end

  def reservation_params
    params.require(:reservation).permit(
      :visitor_id, :host_id, :entrance_id,
      :scheduled_at, :scheduled_end_at, :purpose, :host_notes
    )
  end
end
