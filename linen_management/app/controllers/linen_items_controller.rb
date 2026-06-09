class LinenItemsController < ApplicationController
  before_action :set_linen_batch
  before_action :set_linen_item, only: [:edit, :update, :destroy]

  def new
    @linen_item = @linen_batch.linen_items.new
    @linen_types = LinenType.where.not(id: @linen_batch.linen_types.pluck(:id)).order(:name)
  end

  def create
    @linen_item = @linen_batch.linen_items.new(linen_item_params)

    if @linen_item.save
      redirect_to @linen_batch, notice: '布草明细添加成功。'
    else
      @linen_types = LinenType.where.not(id: @linen_batch.linen_types.pluck(:id)).order(:name)
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    @linen_types = LinenType.all.order(:name)
  end

  def update
    if @linen_item.update(linen_item_params)
      redirect_to @linen_batch, notice: '布草明细更新成功。'
    else
      @linen_types = LinenType.all.order(:name)
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @linen_item.destroy
    redirect_to @linen_batch, notice: '布草明细已删除。'
  end

  private

  def set_linen_batch
    @linen_batch = LinenBatch.find(params[:linen_batch_id])
  end

  def set_linen_item
    @linen_item = @linen_batch.linen_items.find(params[:id])
  end

  def linen_item_params
    params.require(:linen_item).permit(
      :linen_type_id, :quantity_handed, :quantity_returned,
      :quantity_clean, :quantity_stained, :quantity_damaged, :quantity_short
    )
  end
end
