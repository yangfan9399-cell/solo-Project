class StoresController < ApplicationController
  def index
    @stores = Store.includes(:region).all
  end

  def show
    @store = Store.find(params[:id])
    @batches = @store.batches.includes(:material).order(created_at: :desc)
  end

  def new
    @store = Store.new
    @regions = Region.all
  end

  def create
    @store = Store.new(store_params)
    if @store.save
      redirect_to @store, notice: "门店创建成功"
    else
      render :new, status: :unprocessable_entity
    end
  end

  private

  def store_params
    params.require(:store).permit(:name, :code, :region_id, :address, :store_type, :status)
  end
end
