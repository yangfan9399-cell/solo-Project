class PartsController < ApplicationController
  before_action :set_repair_order
  before_action :check_readonly

  def new
    @part = @repair_order.parts.new
  end

  def create
    @part = @repair_order.parts.new(part_params)

    if @part.save
      @repair_order.add_history(current_user, '添加配件', "#{@part.name} (#{@part.status})", 'other')
      redirect_to @repair_order, notice: '配件已添加'
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    @part = @repair_order.parts.find(params[:id])
  end

  def update
    @part = @repair_order.parts.find(params[:id])
    old_status = @part.status
    if @part.update(part_params)
      status_changed = old_status != @part.status ? "状态: #{old_status} → #{@part.status}" : ''
      @repair_order.add_history(current_user, '更新配件', "#{@part.name} #{status_changed}", 'other')
      redirect_to @repair_order, notice: '配件状态已更新'
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @part = @repair_order.parts.find(params[:id])
    @part.destroy
    @repair_order.add_history(current_user, '删除配件', @part.name, 'other')
    redirect_to @repair_order, notice: '配件已删除'
  end

  private

  def set_repair_order
    @repair_order = RepairOrder.find(params[:repair_order_id])
  end

  def check_readonly
    if @repair_order.readonly?
      redirect_to @repair_order, alert: '已归档的维修单不能修改配件'
    end
  end

  def part_params
    params.require(:part).permit(:name, :part_number, :brand, :quantity, :unit_price, :status, :notes, :quote_item_id)
  end

  def current_user
    @current_user ||= User.first
  end
end
