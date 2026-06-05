class FaultsController < ApplicationController
  before_action :set_repair_order

  def new
    @fault = @repair_order.faults.new
  end

  def create
    @fault = @repair_order.faults.new(fault_params)
    @fault.reported_by = current_user if current_user

    if @fault.save
      @repair_order.update(status: 'fault_recorded') if @repair_order.draft?
      @repair_order.add_history(current_user, '记录故障', @fault.title, 'fault')
      redirect_to @repair_order, notice: '故障已记录'
    else
      render :new, status: :unprocessable_entity
    end
  end

  private

  def set_repair_order
    @repair_order = RepairOrder.find(params[:repair_order_id])
  end

  def fault_params
    params.require(:fault).permit(:title, :description, :severity, :category)
  end

  def current_user
    @current_user ||= User.first
  end
end
