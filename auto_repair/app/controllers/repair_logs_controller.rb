class RepairLogsController < ApplicationController
  before_action :set_repair_order
  before_action :check_readonly

  def new
    @repair_log = @repair_order.repair_logs.new
  end

  def create
    @repair_log = @repair_order.repair_logs.new(repair_log_params)
    @repair_log.technician = technician_user
    @repair_log.started_at = Time.current

    if @repair_log.save
      @repair_order.add_history(technician_user, '添加维修记录', @repair_log.title, 'repair')
      redirect_to @repair_order, notice: '维修记录已添加'
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    @repair_log = @repair_order.repair_logs.find(params[:id])
  end

  def update
    @repair_log = @repair_order.repair_logs.find(params[:id])
    if @repair_log.update(repair_log_params)
      @repair_log.update(completed_at: Time.current) if @repair_log.status == 'completed' && @repair_log.completed_at.nil?
      @repair_order.add_history(technician_user, '更新维修记录', "#{@repair_log.title} - #{@repair_log.status}", 'repair')
      redirect_to @repair_order, notice: '维修记录已更新'
    else
      render :edit, status: :unprocessable_entity
    end
  end

  private

  def set_repair_order
    @repair_order = RepairOrder.find(params[:repair_order_id])
  end

  def check_readonly
    if @repair_order.readonly?
      redirect_to @repair_order, alert: '已归档的维修单不能修改维修记录'
    end
  end

  def repair_log_params
    params.require(:repair_log).permit(:title, :description, :status)
  end

  def technician_user
    @technician_user ||= User.find_by(role: 'technician') || User.first
  end
end
