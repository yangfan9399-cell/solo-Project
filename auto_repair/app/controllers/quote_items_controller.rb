class QuoteItemsController < ApplicationController
  before_action :set_repair_order

  def new
    @quote_item = @repair_order.quote_items.new
  end

  def create
    @quote_item = @repair_order.quote_items.new(quote_item_params)

    if @quote_item.save
      redirect_to @repair_order, notice: '报价项目已添加'
    else
      render :new, status: :unprocessable_entity
    end
  end

  private

  def set_repair_order
    @repair_order = RepairOrder.find(params[:repair_order_id])
  end

  def quote_item_params
    params.require(:quote_item).permit(:item_type, :name, :description, :quantity, :unit_price)
  end
end
