class MaintenancePlansController < ApplicationController
  before_action :set_maintenance_plan, only: [:show, :edit, :update]

  DEFAULT_ITEMS_TEMPLATE = [
    { name: '更换机油', description: '更换发动机机油和机油滤清器', is_required: true },
    { name: '更换空气滤清器', description: '检查并更换空气滤清器', is_required: true },
    { name: '检查制动系统', description: '检查刹车片、刹车盘及制动液', is_required: true },
    { name: '轮胎检查', description: '检查轮胎磨损、气压及备胎', is_required: true },
    { name: '灯光检查', description: '检查全车灯光及信号', is_required: false },
    { name: '电池检查', description: '检查电池状态及接线端子', is_required: false },
    { name: '防冻液检查', description: '检查冷却液液位及冰点', is_required: true },
    { name: '传动系统检查', description: '检查变速箱油及传动带', is_required: false }
  ].freeze

  def index
    @maintenance_plans = MaintenancePlan.all
    @maintenance_plans = @maintenance_plans.where(status: params[:status]) if params[:status].present?
    @maintenance_plans = @maintenance_plans.where(vehicle_id: params[:vehicle_id]) if params[:vehicle_id].present?

    if params[:start_date].present?
      @maintenance_plans = @maintenance_plans.where('planned_date >= ?', Date.parse(params[:start_date]))
    end
    if params[:end_date].present?
      @maintenance_plans = @maintenance_plans.where('planned_date <= ?', Date.parse(params[:end_date]))
    end

    @maintenance_plans = @maintenance_plans.overdue if params[:overdue] == 'true'

    @maintenance_plans = @maintenance_plans.includes(:vehicle, :maintenance_items).order(planned_date: :desc)
  end

  def show
    @maintenance_items = @maintenance_plan.maintenance_items.order(created_at: :asc)
  end

  def new
    @maintenance_plan = MaintenancePlan.new
    @maintenance_plan.planned_date = Date.today + 7.days
    @vehicles = Vehicle.order(plate_number: :asc)
  end

  def create
    @maintenance_plan = MaintenancePlan.new(maintenance_plan_params)

    if @maintenance_plan.save
      if params[:create_default_items] == 'true'
        create_default_maintenance_items
      end

      respond_to do |format|
        format.turbo_stream
        format.html { redirect_to @maintenance_plan, notice: '保养计划创建成功。' }
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
    if @maintenance_plan.update(maintenance_plan_params)
      respond_to do |format|
        format.turbo_stream
        format.html { redirect_to @maintenance_plan, notice: '保养计划更新成功。' }
      end
    else
      @vehicles = Vehicle.order(plate_number: :asc)
      render :edit, status: :unprocessable_entity
    end
  end

  private

  def set_maintenance_plan
    @maintenance_plan = MaintenancePlan.find(params[:id])
  end

  def maintenance_plan_params
    params.require(:maintenance_plan).permit(
      :vehicle_id, :planned_date, :maintenance_type, :status,
      :scheduled_mileage, :scheduled_by, :notes
    )
  end

  def create_default_maintenance_items
    DEFAULT_ITEMS_TEMPLATE.each do |item_attrs|
      @maintenance_plan.maintenance_items.create!(item_attrs)
    end
  end
end
