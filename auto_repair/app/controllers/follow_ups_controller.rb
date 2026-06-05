class FollowUpsController < ApplicationController
  before_action :set_repair_order

  def new
    @follow_up = @repair_order.follow_ups.new
  end

  def create
    @follow_up = @repair_order.follow_ups.new(follow_up_params)
    @follow_up.user = current_user if current_user&.customer_service?

    if @follow_up.save
      @repair_order.update(status: 'follow_up_scheduled')
      redirect_to @repair_order, notice: '回访已安排'
    else
      render :new, status: :unprocessable_entity
    end
  end

  private

  def set_repair_order
    @repair_order = RepairOrder.find(params[:repair_order_id])
  end

  def follow_up_params
    params.require(:follow_up).permit(:follow_up_at, :contact_method, :satisfaction, :feedback, :notes, :completed)
  end

  def current_user
    @current_user ||= User.find_by(role: 'customer_service')
  end
end
