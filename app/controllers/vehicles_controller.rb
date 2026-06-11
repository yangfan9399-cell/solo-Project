class VehiclesController < ApplicationController
  before_action :set_vehicle, only: %i[show edit update start_maintenance complete_maintenance start_repair complete_repair approve_trip reject_trip decommission]
  before_action :set_maintenance_plan, only: %i[start_maintenance complete_maintenance]
  before_action :set_repair_record, only: %i[complete_repair]
  before_action :set_trip_record, only: %i[approve_trip reject_trip]

  def index
    @vehicles = Vehicle.includes(:fleet, :vehicle_model, :route)
    @vehicles = @vehicles.where(status: params[:status]) if params[:status].present?
    @vehicles = @vehicles.where(fleet_id: params[:fleet_id]) if params[:fleet_id].present?

    page = (params[:page] || 1).to_i
    per_page = (params[:per_page] || 20).to_i
    offset = (page - 1) * per_page

    @total_count = @vehicles.count
    @total_pages = (@total_count.to_f / per_page).ceil
    @current_page = page
    @vehicles = @vehicles.limit(per_page).offset(offset).order(created_at: :desc)
  end

  def show
    @current_route = @vehicle.route
    @maintenance_plans = @vehicle.maintenance_plans.order(planned_date: :desc)
    @repair_records = @vehicle.repair_records.order(report_date: :desc)
    @fuel_records = @vehicle.fuel_records.order(record_date: :desc).limit(30)
    @abnormal_fuel_count = @fuel_records.select(&:is_abnormal).count
    @inspection_records = @vehicle.inspection_records.order(inspection_date: :desc).limit(10)
    @trip_records = @vehicle.trip_records.order(planned_departure_time: :desc).limit(10)
    @history_nodes = @vehicle.history_nodes.order(happened_at: :desc)
  end

  def new
    @vehicle = Vehicle.new
  end

  def create
    @vehicle = Vehicle.new(vehicle_params)

    respond_to do |format|
      if @vehicle.save
        format.html { redirect_to vehicle_path(@vehicle), notice: '车辆创建成功。' }
        format.json { render :show, status: :created, location: @vehicle }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @vehicle.errors, status: :unprocessable_entity }
      end
    end
  end

  def edit
  end

  def update
    respond_to do |format|
      if @vehicle.update(vehicle_params)
        format.html { redirect_to vehicle_path(@vehicle), notice: '车辆信息更新成功。' }
        format.json { render :show, status: :ok, location: @vehicle }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @vehicle.errors, status: :unprocessable_entity }
      end
    end
  end

  def start_maintenance
    respond_to do |format|
      if @maintenance_plan.update(status: :in_progress)
        @vehicle.reload
        format.turbo_stream
        format.html { redirect_to vehicle_path(@vehicle), notice: '保养已开始。' }
      else
        format.turbo_stream { render turbo_stream: turbo_stream.replace('flash_messages', partial: 'shared/flash_messages', locals: { alert: @maintenance_plan.errors.full_messages.join(', ') }) }
        format.html { redirect_to vehicle_path(@vehicle), alert: @maintenance_plan.errors.full_messages.join(', ') }
      end
    end
  end

  def complete_maintenance
    ActiveRecord::Base.transaction do
      unless @maintenance_plan.all_items_completed?
        create_default_maintenance_items(@maintenance_plan)
      end

      @maintenance_plan.maintenance_items.each do |item|
        item.update!(status: :completed) unless item.completed?
      end

      @maintenance_plan.update!(status: :completed, actual_date: Date.today)
      @vehicle.reload
    end

    respond_to do |format|
      format.turbo_stream
      format.html { redirect_to vehicle_path(@vehicle), notice: '保养已完成。' }
    end
  rescue ActiveRecord::RecordInvalid => e
    respond_to do |format|
      format.turbo_stream { render turbo_stream: turbo_stream.replace('flash_messages', partial: 'shared/flash_messages', locals: { alert: e.message }) }
      format.html { redirect_to vehicle_path(@vehicle), alert: e.message }
    end
  end

  def start_repair
    @repair_record = @vehicle.repair_records.build(repair_params)
    @repair_record.status = :reported
    @repair_record.report_date = Date.today

    respond_to do |format|
      if @repair_record.save
        @vehicle.reload
        format.turbo_stream
        format.html { redirect_to vehicle_path(@vehicle), notice: '维修记录已创建。' }
      else
        format.turbo_stream { render turbo_stream: turbo_stream.replace('flash_messages', partial: 'shared/flash_messages', locals: { alert: @repair_record.errors.full_messages.join(', ') }) }
        format.html { redirect_to vehicle_path(@vehicle), alert: @repair_record.errors.full_messages.join(', ') }
      end
    end
  end

  def complete_repair
    respond_to do |format|
      if @repair_record.update(status: :completed, end_date: Date.today)
        @vehicle.reload
        format.turbo_stream
        format.html { redirect_to vehicle_path(@vehicle), notice: '维修已完成。' }
      else
        format.turbo_stream { render turbo_stream: turbo_stream.replace('flash_messages', partial: 'shared/flash_messages', locals: { alert: @repair_record.errors.full_messages.join(', ') }) }
        format.html { redirect_to vehicle_path(@vehicle), alert: @repair_record.errors.full_messages.join(', ') }
      end
    end
  end

  def approve_trip
    blocking_issues = @trip_record.blocking_issues

    respond_to do |format|
      if blocking_issues.empty? && @trip_record.update(review_status: :approved, reviewer: current_user_name)
        @vehicle.reload
        format.turbo_stream
        format.html { redirect_to vehicle_path(@vehicle), notice: '出车复核已通过。' }
      else
        message = blocking_issues.any? ? "无法通过复核：#{blocking_issues.join('；')}" : (@trip_record.errors.full_messages.join(', ').presence || '无法通过复核')
        format.turbo_stream { render turbo_stream: turbo_stream.replace('flash_messages', partial: 'shared/flash_messages', locals: { alert: message }) }
        format.html { redirect_to vehicle_path(@vehicle), alert: message }
      end
    end
  end

  def reject_trip
    respond_to do |format|
      if @trip_record.update(review_status: :rejected, reviewer: current_user_name, review_note: params[:review_note])
        @vehicle.reload
        format.turbo_stream
        format.html { redirect_to vehicle_path(@vehicle), notice: '出车已驳回。' }
      else
        format.turbo_stream { render turbo_stream: turbo_stream.replace('flash_messages', partial: 'shared/flash_messages', locals: { alert: @trip_record.errors.full_messages.join(', ') }) }
        format.html { redirect_to vehicle_path(@vehicle), alert: @trip_record.errors.full_messages.join(', ') }
      end
    end
  end

  def decommission
    respond_to do |format|
      if @vehicle.update(status: :decommissioned, decommission_date: Date.today)
        @vehicle.history_nodes.create!(
          node_type: :decommissioned,
          title: '车辆停用',
          description: "车辆被停用，原因：#{params[:reason] || '未填写'}",
          operator: current_user_name,
          operator_role: 'admin',
          happened_at: Time.current,
          metadata: { reason: params[:reason] }
        )
        format.turbo_stream
        format.html { redirect_to vehicles_path, notice: '车辆已停用。' }
      else
        format.turbo_stream { render turbo_stream: turbo_stream.replace('flash_messages', partial: 'shared/flash_messages', locals: { alert: @vehicle.errors.full_messages.join(', ') }) }
        format.html { redirect_to vehicle_path(@vehicle), alert: @vehicle.errors.full_messages.join(', ') }
      end
    end
  end

  private

  def set_vehicle
    @vehicle = Vehicle.find(params[:id])
  end

  def set_maintenance_plan
    @maintenance_plan = @vehicle.maintenance_plans.find(params[:maintenance_plan_id])
  end

  def set_repair_record
    @repair_record = @vehicle.repair_records.find(params[:repair_record_id])
  end

  def set_trip_record
    @trip_record = @vehicle.trip_records.find(params[:trip_record_id])
  end

  def vehicle_params
    params.require(:vehicle).permit(
      :plate_number, :vin, :fleet_id, :vehicle_model_id, :route_id,
      :status, :current_mileage, :purchase_date, :last_maintenance_date,
      :next_maintenance_date, :decommission_date, :notes, :insurance_expiry,
      :inspection_expiry, :license_expiry
    )
  end

  def repair_params
    params.require(:repair_record).permit(
      :repair_type, :issue_description, :technician, :workshop,
      :estimated_cost, :start_date
    )
  end

  def create_default_maintenance_items(maintenance_plan)
    default_items = case maintenance_plan.maintenance_type
                    when 'routine'
                      [
                        { name: '更换机油', is_required: true },
                        { name: '更换机油滤清器', is_required: true },
                        { name: '更换空气滤清器', is_required: true },
                        { name: '检查刹车系统', is_required: true },
                        { name: '检查轮胎气压', is_required: true },
                        { name: '检查灯光系统', is_required: false }
                      ]
                    when 'comprehensive'
                      [
                        { name: '更换机油', is_required: true },
                        { name: '更换机油滤清器', is_required: true },
                        { name: '更换空气滤清器', is_required: true },
                        { name: '更换燃油滤清器', is_required: true },
                        { name: '更换变速箱油', is_required: true },
                        { name: '检查刹车片磨损', is_required: true },
                        { name: '检查悬挂系统', is_required: true },
                        { name: '检查转向系统', is_required: true },
                        { name: '检查冷却液', is_required: true },
                        { name: '检查传动皮带', is_required: true }
                      ]
                    when 'emergency'
                      [
                        { name: '应急检查', is_required: true },
                        { name: '问题修复', is_required: true }
                      ]
                    else
                      [{ name: '常规检查', is_required: true }]
                    end

    default_items.each do |item|
      maintenance_plan.maintenance_items.create!(item.merge(status: :pending))
    end
  end

  def current_user_name
    '管理员'
  end
end
