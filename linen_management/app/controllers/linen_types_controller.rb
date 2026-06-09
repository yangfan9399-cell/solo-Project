class LinenTypesController < ApplicationController
  before_action :set_linen_type, only: [:show, :edit, :update, :destroy]

  def index
    @linen_types = LinenType.all.order(:category, :name)
  end

  def show
  end

  def new
    @linen_type = LinenType.new
  end

  def create
    @linen_type = LinenType.new(linen_type_params)

    if @linen_type.save
      redirect_to @linen_type, notice: '布草类型创建成功。'
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @linen_type.update(linen_type_params)
      redirect_to @linen_type, notice: '布草类型更新成功。'
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @linen_type.destroy
    redirect_to linen_types_url, notice: '布草类型已删除。'
  end

  private

  def set_linen_type
    @linen_type = LinenType.find(params[:id])
  end

  def linen_type_params
    params.require(:linen_type).permit(:name, :category, :unit_price)
  end
end
