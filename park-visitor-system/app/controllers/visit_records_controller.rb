class VisitRecordsController < ApplicationController
  before_action :set_visit_record, only: [:show, :verify, :approve, :block, :record_entry, :record_exit]
  before_action :set_entrances, only: [:show, :record_entry, :record_exit]
  before_action :set_security_supervisors, only: [:show, :approve, :block]
  before_action :set_guards, only: [:show, :verify, :approve, :record_entry, :record_exit]

  def index
    @visit_records = VisitRecord.includes(
      reservation: [:visitor, :vehicle, :host, :entrance]
    ).order(created_at: :desc)
  end

  def show
    @reservation = @visit_record.reservation
  end

  def pending_verification
    @visit_records = VisitRecord.pending_verification.includes(
      reservation: [:visitor, :vehicle, :host, :entrance]
    ).order(created_at: :desc)

    render 'pending_list'
  end

  def pending_approval
    @visit_records = VisitRecord.pending_approval.includes(
      reservation: [:visitor, :vehicle, :host, :entrance]
    ).order(created_at: :desc)

    render 'pending_list'
  end

  def verify
    guard = current_guard
    result = GateVerificationService.new(@visit_record).verify(
      license_plate: params[:license_plate],
      guard: guard
    )

    if result[:success]
      redirect_to @visit_record, notice: result[:message]
    else
      redirect_to @visit_record, alert: result[:message]
    end
  end

  def approve
    license_plate = @visit_record.reservation.vehicle.license_plate

    if Blacklist.is_blacklisted?(license_plate)
      supervisor = current_supervisor || current_guard
      @visit_record.block!(
        supervisor: supervisor,
        blocking_reason: "该车辆在黑名单中"
      )
      redirect_to @visit_record, alert: '该车辆在黑名单中，已自动拦截'
      return
    end

    supervisor = current_supervisor
    entrance = current_entrance
    guard = current_guard

    if @visit_record.may_approve? && supervisor && entrance && guard
      @visit_record.approve!(supervisor: supervisor, entrance: entrance, guard: guard)
      redirect_to @visit_record, notice: '已批准放行'
    else
      redirect_to @visit_record, alert: '无法批准，请检查参数'
    end
  end

  def block
    supervisor = current_supervisor || current_guard

    if @visit_record.may_block? && supervisor
      @visit_record.block!(
        supervisor: supervisor,
        blocking_reason: params[:blocking_reason]
      )
      redirect_to @visit_record, notice: '已拦截车辆'
    else
      redirect_to @visit_record, alert: '无法拦截'
    end
  end

  def record_entry
    entrance = current_entrance
    guard = current_guard

    if @visit_record.may_enter? && entrance && guard
      @visit_record.record_entry!(entrance: entrance, guard: guard)
      redirect_to @visit_record, notice: '已记录入园'
    else
      redirect_to @visit_record, alert: '无法记录入园'
    end
  end

  def record_exit
    entrance = current_entrance
    guard = current_guard

    if @visit_record.may_exit? && entrance && guard
      @visit_record.record_exit!(entrance: entrance, guard: guard)
      redirect_to @visit_record, notice: '已记录离园'
    else
      redirect_to @visit_record, alert: '无法记录离园'
    end
  end

  private

  def set_visit_record
    @visit_record = VisitRecord.includes(
      reservation: [:visitor, :vehicle, :host, :entrance]
    ).find(params[:id])
  end

  def set_entrances
    @entrances = Entrance.active.order(:name)
  end

  def set_security_supervisors
    @security_supervisors = Employee.where(is_security_supervisor: true).order(:name)
  end

  def set_guards
    @guards = Employee.where(is_security_guard: true).order(:name)
  end

  def current_guard
    guard_id = params[:guard_id].to_i
    return nil if guard_id.zero?
    @guards&.find(guard_id) || Employee.find_by(id: guard_id)
  end

  def current_supervisor
    supervisor_id = params[:supervisor_id].to_i
    return nil if supervisor_id.zero?
    @security_supervisors&.find(supervisor_id) || Employee.find_by(id: supervisor_id)
  end

  def current_entrance
    entrance_id = params[:entrance_id].to_i
    return nil if entrance_id.zero?
    @entrances&.find(entrance_id) || Entrance.find_by(id: entrance_id)
  end
end
