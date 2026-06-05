class QuoteItemsController < ApplicationController
  before_action :set_repair_order
  before_action :check_readonly

  def new
    @quote_item = @repair_order.quote_items.new
  end

  def create
    @quote_item = @repair_order.quote_items.new(quote_item_params)

    if @quote_item.save
      @repair_order.add_history(current_user, '添加报价项目', "#{@quote_item.name}: ¥#{@quote_item.total_price}", 'quote')
      redirect_to @repair_order, notice: '报价项目已添加'
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    @quote_item = @repair_order.quote_items.find(params[:id])
  end

  def update
    @quote_item = @repair_order.quote_items.find(params[:id])
    old_price = @quote_item.total_price
    if @quote_item.update(quote_item_params)
      @repair_order.add_history(current_user, '更新报价项目', "#{@quote_item.name}: ¥#{old_price} → ¥#{@quote_item.total_price}", 'quote')
      redirect_to @repair_order, notice: '报价项目已更新'
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @quote_item = @repair_order.quote_items.find(params[:id])
    @quote_item.destroy
    @repair_order.add_history(current_user, '删除报价项目', "#{@quote_item.name}: ¥#{@quote_item.total_price}", 'quote')
    redirect_to @repair_order, notice: '报价项目已删除'
  end

  private

  def set_repair_order
    @repair_order = RepairOrder.find(params[:repair_order_id])
  end

  def check_readonly
    if @repair_order.readonly?
      redirect_to @repair_order, alert: '已归档的维修单不能修改报价明细'
    end
  end

  def quote_item_params
    params.require(:quote_item).permit(:item_type, :name, :description, :quantity, :unit_price)
  end

  def current_user
    @current_user ||= User.first
  end
end
