class AllocationsController < ApplicationController
  def index
    @allocations = Allocation.includes(:source_store, :target_store, :creator).all
    @allocations = @allocations.where(status: params[:status]) if params[:status].present?
    @allocations = @allocations.order(created_at: :desc)
  end

  def show
    @allocation = Allocation.find(params[:id])
    @items = @allocation.items.includes({ batch: :material })
    @workflow_nodes = @allocation.workflow_nodes.order(created_at: :desc)
  end

  def new
    @allocation = Allocation.new
    @stores = Store.all
    @batches = Batch.where(status: "in_stock").where("available_quantity > 0")
  end

  def create
    @allocation = Allocation.new(allocation_params)
    @allocation.allocation_number = Allocation.generate_number
    if @allocation.save
      redirect_to @allocation, notice: "调拨单创建成功"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def approve
    @allocation = Allocation.find(params[:id])
    if @allocation.pending?
      @allocation.update(status: :approved)
      @allocation.workflow_nodes.create!(node_type: "allocation_approved", actor: current_user, metadata: {})
      redirect_to @allocation, notice: "调拨单已批准"
    else
      redirect_to @allocation, alert: "调拨单状态不允许批准"
    end
  end

  def mark_in_transit
    @allocation = Allocation.find(params[:id])
    if @allocation.approved?
      @allocation.update(status: :in_transit)
      redirect_to @allocation, notice: "调拨单已发货"
    else
      redirect_to @allocation, alert: "调拨单状态不允许发货"
    end
  end

  def receive
    @allocation = Allocation.find(params[:id])
    if @allocation.in_transit?
      @allocation.items.each do |item|
        item.update(status: :received)
      end
      @allocation.update(status: :received)
      redirect_to @allocation, notice: "调拨单已收货"
    else
      redirect_to @allocation, alert: "调拨单状态不允许收货"
    end
  end

  def reject
    @allocation = Allocation.find(params[:id])
    if @allocation.in_transit?
      @allocation.update(status: :rejected)
      redirect_to new_loss_report_path(allocation_id: @allocation.id), notice: "请创建报损单"
    else
      redirect_to @allocation, alert: "调拨单状态不允许拒收"
    end
  end

  private

  def allocation_params
    params.require(:allocation).permit(:source_store_id, :target_store_id, :creator_id, :remark)
  end

  def current_user
    @current_user ||= User.first
  end
end
