class BatchesController < ApplicationController
  def index
    @batches = Batch.includes(:material, :store).all
    @batches = @batches.where(store_id: params[:store_id]) if params[:store_id].present?
    @batches = @batches.where("expiry_date <= ?", 7.days.from_now.to_date) if params[:near_expiry] == "true"
  end

  def show
    @batch = Batch.find(params[:id])
    @workflow_nodes = @batch.workflow_nodes.order(created_at: :desc)
    @allocation_items = @batch.allocation_items.includes(:allocation)
    @loss_reports = @batch.loss_reports.order(created_at: :desc)
  end

  def new
    @batch = Batch.new
    @materials = Material.all
    @stores = Store.all
  end

  def create
    @batch = Batch.new(batch_params)
    if @batch.save
      redirect_to @batch, notice: "批次创建成功"
    else
      render :new, status: :unprocessable_entity
    end
  end

  private

  def batch_params
    params.require(:batch).permit(:material_id, :store_id, :batch_number, :production_date, :expiry_date, :quantity, :available_quantity, :warning_level)
  end
end
