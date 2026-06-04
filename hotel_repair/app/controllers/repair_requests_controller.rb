class RepairRequestsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_repair_request, only: [:show, :edit, :update, :suggest_transfer, :confirm_transfer, :submit_compensation, :approve_compensation, :reject_compensation, :escalate, :approve_escalation, :reject_escalation, :archive, :cancel, :add_feedback]

  def index
    @repair_requests = RepairRequest.recent
    @repair_requests = @repair_requests.by_status(params[:status]) if params[:status].present?
    @repair_requests = @repair_requests.by_category(params[:category]) if params[:category].present?
    @repair_requests = @repair_requests.by_room_type(params[:room_type]) if params[:room_type].present?
    @repair_requests = @repair_requests.limit(50)
  end

  def show
    @compensation = @repair_request.compensation
    @status_logs = @repair_request.status_logs.order(created_at: :asc)
    @escalations = @repair_request.approval_escalations.order(created_at: :asc)
  end

  def new
    @repair_request = RepairRequest.new
    @rooms = Room.order(:room_number)
  end

  def create
    @repair_request = RepairRequest.new(repair_request_params)
    @repair_request.reporter = current_user
    @repair_request.status = "reported"

    if @repair_request.save
      @repair_request.status_logs.create!(
        from_status: nil,
        to_status: "reported",
        changed_by: current_user,
        note: "创建报修工单"
      )
      redirect_to @repair_request, notice: "报修工单已创建"
    else
      @rooms = Room.order(:room_number)
      render :new, status: :unprocessable_content
    end
  end

  def edit
    @rooms = Room.order(:room_number)
  end

  def update
    if @repair_request.update(repair_request_params)
      redirect_to @repair_request, notice: "工单已更新"
    else
      @rooms = Room.order(:room_number)
      render :edit, status: :unprocessable_content
    end
  end

  def suggest_transfer
    require_front_desk!
    if @repair_request.update(needs_transfer: true, transfer_suggestion: params[:transfer_suggestion], new_room_id: params[:new_room_id])
      old_status = @repair_request.status
      @repair_request.update!(status: "transfer_suggested")
      @repair_request.status_logs.create!(
        from_status: old_status,
        to_status: "transfer_suggested",
        changed_by: current_user,
        note: "前台建议转房#{params[:new_room_id].present? ? "至 #{Room.find_by(id: params[:new_room_id])&.room_number}" : ''}：#{params[:transfer_suggestion]}"
      )
      redirect_to @repair_request, notice: "转房建议已提交"
    else
      redirect_to @repair_request, alert: "转房建议提交失败"
    end
  end

  def confirm_transfer
    require_duty_manager!
    old_status = @repair_request.status
    if @repair_request.update(status: "transfer_confirmed", manager: current_user)
      if @repair_request.new_room.present?
        @repair_request.original_room.update!(status: :under_repair)
        @repair_request.new_room.update!(status: :occupied)
      end
      @repair_request.status_logs.create!(
        from_status: old_status,
        to_status: "transfer_confirmed",
        changed_by: current_user,
        note: "值班经理确认转房"
      )
      redirect_to @repair_request, notice: "转房已确认"
    else
      redirect_to @repair_request, alert: "转房确认失败"
    end
  end

  def submit_compensation
    require_front_desk!
    comp_params = if params[:compensation]
      params.require(:compensation).permit(:amount, :basis, :compensation_type)
    else
      ActionController::Parameters.new({
        amount: params[:compensation_amount],
        basis: params.dig(:compensation, :basis) || params[:compensation_basis],
        compensation_type: params.dig(:compensation, :compensation_type) || params[:compensation_compensation_type] || "room_fee_discount"
      }).permit(:amount, :basis, :compensation_type)
    end
    comp = @repair_request.build_compensation(comp_params)
    comp.limit_amount = Compensation::COMPENSATION_LIMIT

    if comp.exceeds_limit?
      comp.status = :exceeded
      comp.block_reason = "补偿金额 ¥#{comp.amount} 超出审批限额 ¥#{comp.limit_amount}，需升级审批"
    else
      comp.status = :pending
    end

    if comp.save
      old_status = @repair_request.status
      new_status = comp.exceeds_limit? ? "compensation_exceeded" : "compensation_pending"
      @repair_request.update!(status: new_status, needs_compensation: true)
      @repair_request.status_logs.create!(
        from_status: old_status,
        to_status: new_status,
        changed_by: current_user,
        note: comp.exceeds_limit? ? "提交补偿申请(金额超限)：¥#{comp.amount}" : "提交补偿申请：¥#{comp.amount}"
      )
      redirect_to @repair_request, notice: comp.exceeds_limit? ? "补偿申请已提交，但金额超限需升级审批" : "补偿申请已提交"
    else
      redirect_to @repair_request, alert: "补偿申请提交失败：#{comp.errors.full_messages.join('，')}"
    end
  end

  def approve_compensation
    require_duty_manager!
    comp = @repair_request.compensation
    return redirect_to(@repair_request, alert: "无待审批补偿") unless comp&.pending?

    old_status = @repair_request.status
    comp.update!(status: :approved, approved_by: current_user)
    @repair_request.update!(status: :compensation_approved, manager: current_user, resolved_at: Time.current)
    @repair_request.status_logs.create!(
      from_status: old_status,
      to_status: "compensation_approved",
      changed_by: current_user,
      note: "值班经理批准补偿 ¥#{comp.amount}"
    )
    redirect_to @repair_request, notice: "补偿已批准"
  end

  def reject_compensation
    require_duty_manager!
    comp = @repair_request.compensation
    return redirect_to(@repair_request, alert: "无待审批补偿") unless comp&.pending?

    old_status = @repair_request.status
    comp.update!(status: :rejected, approved_by: current_user, rejection_reason: params[:rejection_reason])
    @repair_request.update!(status: :compensation_rejected, manager: current_user)
    @repair_request.status_logs.create!(
      from_status: old_status,
      to_status: "compensation_rejected",
      changed_by: current_user,
      note: "值班经理驳回补偿：#{params[:rejection_reason]}"
    )
    redirect_to @repair_request, notice: "补偿已驳回"
  end

  def escalate
    require_duty_manager!
    comp = @repair_request.compensation
    return redirect_to(@repair_request, alert: "无超限补偿") unless comp&.exceeded?

    level = params[:level] || "senior_manager"
    reason = params[:reason]
    suggested_amount = params[:suggested_amount]

    comp.escalate!(level, reason, suggested_amount: suggested_amount.present? ? suggested_amount.to_f : nil)
    old_status = @repair_request.status
    @repair_request.update!(status: :compensation_exceeded)
    @repair_request.status_logs.create!(
      from_status: old_status,
      to_status: "compensation_exceeded",
      changed_by: current_user,
      note: "升级审批至#{level == 'senior_manager' ? '高级经理' : '总经理'}，原因：#{reason}"
    )
    redirect_to @repair_request, notice: "已升级审批"
  end

  def approve_escalation
    require_duty_manager!
    escalation = @repair_request.approval_escalations.find(params[:escalation_id])
    escalation.approve!(current_user, note: params[:review_note], adjusted_amount: params[:adjusted_amount].present? ? params[:adjusted_amount].to_f : nil)
    redirect_to @repair_request, notice: "升级审批已通过"
  end

  def reject_escalation
    require_duty_manager!
    escalation = @repair_request.approval_escalations.find(params[:escalation_id])
    escalation.reject!(current_user, note: params[:review_note])
    redirect_to @repair_request, notice: "升级审批已驳回"
  end

  def archive
    require_duty_manager!
    old_status = @repair_request.status
    @repair_request.update!(status: :archived, resolved_at: Time.current, manager: current_user)
    @repair_request.status_logs.create!(
      from_status: old_status,
      to_status: "archived",
      changed_by: current_user,
      note: "工单已归档"
    )
    if @repair_request.original_room&.under_repair?
      @repair_request.original_room.update!(status: :available)
    end
    redirect_to @repair_request, notice: "工单已归档"
  end

  def cancel
    old_status = @repair_request.status
    @repair_request.update!(status: :cancelled, resolved_at: Time.current)
    @repair_request.status_logs.create!(
      from_status: old_status,
      to_status: "cancelled",
      changed_by: current_user,
      note: "住客撤销报修：#{params[:cancel_reason].presence || '无原因'}"
    )
    redirect_to @repair_request, notice: "工单已撤销"
  end

  def add_feedback
    require_front_desk!
    if @repair_request.update(customer_feedback: params[:customer_feedback])
      redirect_to @repair_request, notice: "客户反馈已记录"
    else
      redirect_to @repair_request, alert: "反馈记录失败"
    end
  end

  private

  def set_repair_request
    @repair_request = RepairRequest.find(params[:id])
  end

  def repair_request_params
    params.require(:repair_request).permit(:original_room_id, :new_room_id, :repair_category, :repair_reason, :needs_transfer, :needs_compensation, :transfer_suggestion, :hotel_full_reason, :customer_feedback)
  end

  def compensation_params
    params.require(:compensation).permit(:amount, :basis, :compensation_type)
  end
end
