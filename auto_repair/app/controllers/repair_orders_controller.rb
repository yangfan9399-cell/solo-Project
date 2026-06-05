class RepairOrdersController < ApplicationController
  before_action :set_repair_order, only: %i[show edit update destroy submit_quote approve_quote reject_quote start_repair complete_repair review_complete review_return complete_followup archive create_warranty_repair]
  before_action :check_readonly, only: %i[edit update destroy submit_quote approve_quote reject_quote start_repair complete_repair review_complete review_return complete_followup archive]

  def index
    @repair_orders = RepairOrder.includes(:vehicle).order(created_at: :desc).all
  end

  def show
    @vehicle = @repair_order.vehicle
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
      @repair_order.add_history(current_user, '创建维修单', nil, 'other')
      redirect_to @repair_order, notice: '维修单已创建'
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @repair_order.update(repair_order_params)
      @repair_order.add_history(current_user, '更新维修单', nil, 'other')
      redirect_to @repair_order, notice: '维修单已更新'
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def submit_quote
    @repair_order.total_amount = @repair_order.quote_total

    if @repair_order.over_budget?
      @repair_order.status = 'quote_over_budget'
      @repair_order.quote_approved = false
      notes = "报价超出预算 ¥#{@repair_order.quote_total - @repair_order.budget_limit}"
      @repair_order.save!
      @repair_order.add_history(current_user, '提交报价', notes, 'quote')
      redirect_to @repair_order, alert: '报价超出预算，需店长审批'
    else
      @repair_order.status = 'quote_submitted'
      @repair_order.quote_approved = true
      @repair_order.save!
      @repair_order.add_history(current_user, '提交报价', '报价在预算内，自动确认', 'quote')
      redirect_to @repair_order, notice: '报价已提交并确认'
    end
  end

  def approve_quote
    unless current_user.manager?
      return redirect_to @repair_order, alert: '只有店长可以审批报价'
    end

    @repair_order.transaction do
      @repair_order.update!(status: 'quote_approved', quote_approved: true)
      @repair_order.add_history(current_user, '审批通过', params[:notes], 'quote')
    end
    redirect_to @repair_order, notice: '报价已审批通过'
  end

  def reject_quote
    unless current_user.manager?
      return redirect_to @repair_order, alert: '只有店长可以拒绝报价'
    end

    @repair_order.transaction do
      @repair_order.update!(status: 'quote_rejected')
      @repair_order.add_history(current_user, '审批拒绝', params[:notes], 'quote')
    end
    redirect_to @repair_order, notice: '报价已拒绝，请调整后重新提交'
  end

  def start_repair
    if @repair_order.parts_out_of_stock?
      @repair_order.update!(status: 'parts_pending')
      redirect_to @repair_order, alert: '存在缺货配件，无法开始维修'
    else
      @repair_order.transaction do
        @repair_order.update!(status: 'in_repair')
        @repair_order.add_history(current_user, '开始维修', nil, 'repair')
      end
      redirect_to @repair_order, notice: '维修已开始'
    end
  end

  def complete_repair
    @repair_order.transaction do
      @repair_order.update!(status: 'repair_completed')
      @repair_order.add_history(current_user, '完成维修', nil, 'repair')
    end
    redirect_to @repair_order, notice: '维修已完成'
  end

  def review_complete
    unless current_user.manager?
      return redirect_to @repair_order, alert: '只有店长可以复核费用'
    end

    @repair_order.transaction do
      @repair_order.update!(status: 'review_approved', manager_note: params[:notes])
      @repair_order.add_history(current_user, '复核通过', params[:notes], 'review')
    end
    redirect_to @repair_order, notice: '费用复核通过'
  end

  def review_return
    unless current_user.manager?
      return redirect_to @repair_order, alert: '只有店长可以退回复核'
    end

    @repair_order.transaction do
      @repair_order.update!(status: 'review_returned', manager_note: params[:notes])
      @repair_order.add_history(current_user, '复核退回', params[:notes], 'review')
    end
    redirect_to @repair_order, notice: '已退回，技师需检查维修记录'
  end

  def complete_followup
    unless current_user.customer_service?
      return redirect_to @repair_order, alert: '只有客服可以完成回访'
    end

    @repair_order.transaction do
      @repair_order.update!(status: 'follow_up_completed', follow_up_note: params[:notes])
      @repair_order.add_history(current_user, '完成回访', params[:notes], 'followup')
    end
    redirect_to @repair_order, notice: '质保回访已完成'
  end

  def archive
    @repair_order.transaction do
      @repair_order.update!(archived: true, status: 'archived')
      @repair_order.add_history(current_user, '归档', nil, 'archive')
    end
    redirect_to @repair_order, notice: '维修单已归档'
  end

  def create_warranty_repair
    new_order = @repair_order.create_warranty_repair_order!(current_user)
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

  def current_user
    @current_user ||= User.first
  end
end
