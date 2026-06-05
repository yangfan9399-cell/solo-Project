class FollowUpsController < ApplicationController
  before_action :set_repair_order
  before_action :check_readonly

  def new
    @follow_up = @repair_order.follow_ups.new
  end

  def create
    @follow_up = @repair_order.follow_ups.new(follow_up_params)
    @follow_up.user = customer_service_user

    if @follow_up.save
      @repair_order.update(status: 'follow_up_scheduled') unless @repair_order.follow_up_scheduled?
      @repair_order.add_history(customer_service_user, '安排回访', "方式: #{@follow_up.contact_method}", 'followup')
      redirect_to @repair_order, notice: '回访已安排'
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    @follow_up = @repair_order.follow_ups.find(params[:id])
  end

  def update
    @follow_up = @repair_order.follow_ups.find(params[:id])
    if @follow_up.update(follow_up_params)
      status_text = @follow_up.completed? ? "已完成 - #{@follow_up.satisfaction}" : "已更新"
      @repair_order.add_history(customer_service_user, '更新回访记录', "#{status_text}: #{@follow_up.feedback}", 'followup')
      redirect_to @repair_order, notice: '回访记录已更新'
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def complete
    @follow_up = @repair_order.follow_ups.find(params[:id])
  end

  def mark_complete
    @follow_up = @repair_order.follow_ups.find(params[:id])
    user = customer_service_user

    @repair_order.transaction do
      @follow_up.update!(
        satisfaction: params[:satisfaction].presence || params[:follow_up][:satisfaction],
        feedback: params[:feedback].presence || params[:follow_up][:feedback],
        notes: params[:notes].presence || params[:follow_up][:notes] || params[:feedback].presence || params[:follow_up][:feedback],
        completed: true,
        follow_up_at: Time.current,
        user: user
      )
      @repair_order.update!(status: 'follow_up_completed', follow_up_note: @follow_up.feedback)
      @repair_order.add_history(user, '完成回访', @follow_up.feedback.presence || '质保回访完成', 'followup')
    end
    redirect_to @repair_order, notice: '质保回访已完成'
  end

  private

  def set_repair_order
    @repair_order = RepairOrder.find(params[:repair_order_id])
  end

  def check_readonly
    if @repair_order.readonly?
      redirect_to @repair_order, alert: '已归档的维修单不能修改回访记录'
    end
  end

  def follow_up_params
    params.require(:follow_up).permit(:follow_up_at, :contact_method, :satisfaction, :feedback, :notes, :completed)
  end

  def customer_service_user
    @customer_service_user ||= User.find_by(role: 'customer_service') || User.first
  end
end
