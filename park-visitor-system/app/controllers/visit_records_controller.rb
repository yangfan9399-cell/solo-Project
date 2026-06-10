class VisitRecordsController < ApplicationController
  before_action :set_visit_record, only: [:show, :verify, :approve, :block, :record_entry, :record_exit]
  before_action :set_entrances, only: [:record_entry, :record_exit]
  before_action :set_security_supervisors, only: [:approve, :block]

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
    result = GateVerificationService.new(@visit_record).verify(
      license_plate: params[:license_plate],
      guard_id: current_guard_id
    )

    if result[:success]
      redirect_to @visit_record, notice: result[:message]
    else
      redirect_to @visit_record, alert: result[:message]
    end
  end

  def approve
    if @visit_record.may_approve?
      @visit_record.approve!(supervisor_id: current_supervisor_id)
      @visit_record.record_entry!(
        entrance_id: params[:entrance_id] || @visit_record.reservation.entrance_id,
        guard_id: current_guard_id
      )
      redirect_to @visit_record, notice: '已批准放行'
    else
      redirect_to @visit_record, alert: '无法批准'
    end
  end

  def block
    if @visit_record.may_block?
      @visit_record.block!(
        supervisor_id: current_supervisor_id,
        blocking_reason: params[:blocking_reason]
      )
      redirect_to @visit_record, notice: '已拦截车辆'
    else
      redirect_to @visit_record, alert: '无法拦截'
    end
  end

  def record_entry
    if @visit_record.may_enter?
      @visit_record.record_entry!(
        entrance_id: params[:entrance_id],
        guard_id: current_guard_id
      )
      redirect_to @visit_record, notice: '已记录入园'
    else
      redirect_to @visit_record, alert: '无法记录入园'
    end
  end

  def record_exit
    if @visit_record.may_exit?
      @visit_record.record_exit!(
        entrance_id: params[:exit_entrance_id],
        guard_id: current_guard_id
      )
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
    @security_supervisors = Employee.security_supervisor.order(:name)
  end

  def current_guard_id
    params[:guard_id] || @visit_record&.reservation&.entrance&.id
  end

  def current_supervisor_id
    params[:supervisor_id]
  end
end
