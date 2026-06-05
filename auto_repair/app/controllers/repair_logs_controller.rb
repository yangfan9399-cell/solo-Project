class RepairLogsController < ApplicationController
  before_action :set_repair_order

  def new
    @repair_log = @repair_order.repair_logs.new
  end

  def create
    @repair_log = @repair_order.repair_logs.new(repair_log_params)
    @repair_log.technician = current_user if current_user&.technician?
    @repair_log.started_at = Time.current

    if @repair_log.save
      redirect_to @repair_order, notice: '维修记录已添加'
    else
      render :new, status: :unprocessable_entity
    end
  end

  def update
    @repair_log = @repair_order.repair_logs.find(params[:id])
    if @repair_log.update(repair_log_params)
      @repair_log.update(completed_at: Time.current) if @repair_log.status == 'completed'
      redirect_to @repair_order, notice: '维修记录已更新'
    else
      render :edit, status: :unprocessable_entity
    end
  end

  private

  def set_repair_order
    @repair_order = RepairOrder.find(params[:repair_order_id])
  end

  def repair_log_params
    params.require(:repair_log).permit(:title, :description, :status)
  end

  def current_user
    @current_user ||= User.find_by(role: 'technician')
  end
end
