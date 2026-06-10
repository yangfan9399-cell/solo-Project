class VisitorsController < ApplicationController
  before_action :set_visitor, only: [:show, :edit, :update, :destroy]

  def index
    @visitors = Visitor.includes(:vehicles).order(created_at: :desc)
  end

  def show
    @vehicles = @visitor.vehicles
    @reservations = @visitor.reservations.includes(:vehicle, :host, :entrance).order(created_at: :desc)
  end

  def new
    @visitor = Visitor.new
    @visitor.vehicles.build
  end

  def create
    @visitor = Visitor.new(visitor_params)

    if @visitor.save
      redirect_to @visitor, notice: '访客信息已创建'
    else
      render :new, status: :unprocessable_entity
    end
  end

  def update
    if @visitor.update(visitor_params)
      redirect_to @visitor, notice: '访客信息已更新'
    else
      render :edit, status: :unprocessable_entity
    end
  end

  private

  def set_visitor
    @visitor = Visitor.includes(:vehicles).find(params[:id])
  end

  def visitor_params
    params.require(:visitor).permit(:name, :phone, :id_card_number, :company, :email)
  end
end
