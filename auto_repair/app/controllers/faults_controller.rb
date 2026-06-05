class FaultsController < ApplicationController
  before_action :set_repair_order
  before_action :check_readonly

  def new
    @fault = @repair_order.faults.new
  end

  def create
    @fault = @repair_order.faults.new(fault_params)
    @fault.reported_by = service_advisor_user

    if @fault.save
      @repair_order.update(status: 'fault_recorded') if @repair_order.draft?
      @repair_order.add_history(service_advisor_user, '记录故障', @fault.title, 'fault')
      redirect_to @repair_order, notice: '故障已记录'
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    @fault = @repair_order.faults.find(params[:id])
  end

  def update
    @fault = @repair_order.faults.find(params[:id])
    if @fault.update(fault_params)
      @repair_order.add_history(service_advisor_user, '更新故障', "#{@fault.title}: #{@fault.description}", 'fault')
      redirect_to @repair_order, notice: '故障已更新'
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @fault = @repair_order.faults.find(params[:id])
    @fault.destroy
    @repair_order.add_history(service_advisor_user, '删除故障', @fault.title, 'fault')
    redirect_to @repair_order, notice: '故障已删除'
  end

  private

  def set_repair_order
    @repair_order = RepairOrder.find(params[:repair_order_id])
  end

  def check_readonly
    if @repair_order.readonly?
      redirect_to @repair_order, alert: '已归档的维修单不能修改故障记录'
    end
  end

  def fault_params
    params.require(:fault).permit(:title, :description, :severity, :category)
  end

  def service_advisor_user
    @service_advisor_user ||= User.find_by(role: 'service_advisor') || User.first
  end
end
