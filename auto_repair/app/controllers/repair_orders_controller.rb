class RepairOrdersController < ApplicationController
  before_action :set_repair_order, only: %i[show edit update destroy submit_quote approve_quote reject_quote start_repair complete_repair review_complete review_return complete_followup archive create_warranty_repair]
  before_action :check_readonly, only: %i[edit update destroy submit_quote approve_quote reject_quote start_repair complete_repair review_complete review_return complete_followup archive]

  def index
    @repair_orders = RepairOrder.includes(:vehicle).order(created_at: :desc).all
  end

  def show
    @vehicle = @repair_order.vehicle
    @current_manager = User.find_by(role: 'manager')
    @current_customer_service = User.find_by(role: 'customer_service')
  end

  def new
    @vehicle = Vehicle.find(params[:vehicle_id]) if params[:vehicle_id]
    @repair_order = RepairOrder.new
    @repair_order.vehicle = @vehicle if @vehicle
  end

  def create
    @repair_order = RepairOrder.new(repair_order_params)
    @repair_order.status = 'draft'

    if @repair_order.save
      @repair_order.add_history(service_advisor_user, '创建维修单', nil, 'other')
      redirect_to @repair_order, notice: '维修单已创建'
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @repair_order.update(repair_order_params)
      @repair_order.add_history(service_advisor_user, '更新维修单', nil, 'other')
      redirect_to @repair_order, notice: '维修单已更新'
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def submit_quote
    @repair_order.total_amount = @repair_order.quote_total
    user = service_advisor_user

    if @repair_order.over_budget?
      @repair_order.transaction do
        @repair_order.update!(status: 'quote_over_budget', quote_approved: false)
        notes = "报价超出预算 ¥#{@repair_order.quote_total - @repair_order.budget_limit}"
        @repair_order.add_history(user, '提交报价', notes, 'quote')
      end
      redirect_to @repair_order, alert: '报价超出预算，需店长审批'
    else
      @repair_order.transaction do
        @repair_order.update!(status: 'quote_submitted', quote_approved: true)
        @repair_order.add_history(user, '提交报价', '报价在预算内，自动确认', 'quote')
      end
      redirect_to @repair_order, notice: '报价已提交并确认'
    end
  end

  def approve_quote
    user = manager_user

    @repair_order.transaction do
      @repair_order.update!(
        status: 'quote_approved',
        quote_approved: true,
        manager_note: params[:notes]
      )
      @repair_order.add_history(user, '审批通过', params[:notes].presence || '店长审批通过', 'quote')
    end
    redirect_to @repair_order, notice: '报价已审批通过'
  end

  def reject_quote
    user = manager_user

    @repair_order.transaction do
      @repair_order.update!(
        status: 'quote_rejected',
        manager_note: params[:notes]
      )
      @repair_order.add_history(user, '审批拒绝', params[:notes].presence || '店长审批拒绝', 'quote')
    end
    redirect_to @repair_order, notice: '报价已拒绝，请调整后重新提交'
  end

  def start_repair
    user = technician_user

    if @repair_order.parts_out_of_stock?
      @repair_order.update!(status: 'parts_pending')
      redirect_to @repair_order, alert: '存在缺货配件，无法开始维修'
    else
      @repair_order.transaction do
        @repair_order.update!(status: 'in_repair')
        @repair_order.add_history(user, '开始维修', nil, 'repair')
      end
      redirect_to @repair_order, notice: '维修已开始'
    end
  end

  def complete_repair
    user = technician_user

    @repair_order.transaction do
      @repair_order.update!(status: 'repair_completed')
      @repair_order.add_history(user, '完成维修', nil, 'repair')
    end
    redirect_to @repair_order, notice: '维修已完成'
  end

  def review_complete
    user = manager_user

    @repair_order.transaction do
      @repair_order.update!(
        status: 'review_approved',
        manager_note: params[:notes]
      )
      @repair_order.add_history(user, '复核通过', params[:notes].presence || '费用复核通过', 'review')
    end
    redirect_to @repair_order, notice: '费用复核通过'
  end

  def review_return
    user = manager_user

    @repair_order.transaction do
      @repair_order.update!(
        status: 'review_returned',
        manager_note: params[:notes]
      )
      @repair_order.add_history(user, '复核退回', params[:notes].presence || '请检查维修记录', 'review')
    end
    redirect_to @repair_order, notice: '已退回，技师需检查维修记录'
  end

  def complete_followup
    user = customer_service_user

    @repair_order.transaction do
      @repair_order.update!(
        status: 'follow_up_completed',
        follow_up_note: params[:notes]
      )
      @repair_order.add_history(user, '完成回访', params[:notes].presence || '质保回访完成', 'followup')
    end
    redirect_to @repair_order, notice: '质保回访已完成'
  end

  def archive
    user = manager_user

    @repair_order.transaction do
      @repair_order.update!(archived: true, status: 'archived')
      @repair_order.add_history(user, '归档', nil, 'archive')
    end
    redirect_to @repair_order, notice: '维修单已归档'
  end

  def create_warranty_repair
    user = service_advisor_user
    new_order = @repair_order.create_warranty_repair_order!(user)
    redirect_to new_order, notice: '质保返修单已创建'
  end

  private

  def set_repair_order
    @repair_order = RepairOrder.find(params[:id])
  end

  def check_readonly
    if @repair_order.readonly?
      redirect_to @repair_order, alert: '已归档的维修单不能修改'
    end
  end

  def repair_order_params
    params.require(:repair_order).permit(:vehicle_id, :service_advisor_id, :technician_id, :customer_description, :budget_limit, :warranty_months)
  end

  def manager_user
    @manager_user ||= User.find_by(role: 'manager') || User.first
  end

  def customer_service_user
    @customer_service_user ||= User.find_by(role: 'customer_service') || User.first
  end

  def service_advisor_user
    @service_advisor_user ||= User.find_by(role: 'service_advisor') || User.first
  end

  def technician_user
    @technician_user ||= User.find_by(role: 'technician') || User.first
  end
end
