class PartsController < ApplicationController
  before_action :set_repair_order

  def new
    @part = @repair_order.parts.new
  end

  def create
    @part = @repair_order.parts.new(part_params)

    if @part.save
      redirect_to @repair_order, notice: '配件已添加'
    else
      render :new, status: :unprocessable_entity
    end
  end

  def update
    @part = @repair_order.parts.find(params[:id])
    if @part.update(part_params)
      redirect_to @repair_order, notice: '配件状态已更新'
    else
      redirect_to @repair_order, alert: '更新失败'
    end
  end

  private

  def set_repair_order
    @repair_order = RepairOrder.find(params[:repair_order_id])
  end

  def part_params
    params.require(:part).permit(:name, :part_number, :brand, :quantity, :unit_price, :status, :notes, :quote_item_id)
  end
end
