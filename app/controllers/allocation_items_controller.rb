class AllocationItemsController < ApplicationController
  def new
    @allocation_item = AllocationItem.new
    @allocation = Allocation.find(params[:allocation_id])
    @batches = Batch.where(store_id: @allocation.source_store_id).where("available_quantity > 0")
  end

  def create
    @allocation = Allocation.find(params[:allocation_id])
    @allocation_item = @allocation.items.new(allocation_item_params)

    if @allocation_item.save
      redirect_to @allocation, notice: "调拨物品已添加"
    else
      render :new, status: :unprocessable_entity
    end
  end

  private

  def allocation_item_params
    params.require(:allocation_item).permit(:batch_id, :quantity)
  end
end
