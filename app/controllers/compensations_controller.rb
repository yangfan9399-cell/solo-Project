class CompensationsController < ApplicationController
  before_action :set_compensation, only: [:show, :edit, :update, :dispute, :resolve, :pay]
  before_action :require_crew_leader, only: [:dispute]
  before_action :require_asset_auditor, only: [:edit, :update, :resolve, :pay]

  def index
    @compensations = Compensation.all.includes(borrow_record: [:prop, :crew]).order(created_at: :desc)
    @compensations = @compensations.where(status: params[:status]) if params[:status].present?
  end

  def show
  end

  def edit
  end

  def update
    if @compensation.update(compensation_params)
      redirect_to @compensation, notice: "赔付记录更新成功"
    else
      render :edit
    end
  end

  def dispute
    reason = params[:dispute_reason]
    if @compensation.dispute!(reason)
      redirect_to @compensation, notice: "已提交赔付争议"
    else
      redirect_to @compensation, alert: "提交争议失败"
    end
  end

  def resolve
    resolution = params[:resolution]
    new_amount = params[:new_amount]
    if @compensation.resolve!(resolution, new_amount)
      redirect_to @compensation, notice: "赔付争议已解决"
    else
      redirect_to @compensation, alert: "解决争议失败"
    end
  end

  def pay
    if @compensation.pay!
      redirect_to @compensation, notice: "赔付已完成"
    else
      redirect_to @compensation, alert: "赔付失败"
    end
  end

  private

  def set_compensation
    @compensation = Compensation.find(params[:id])
  end

  def compensation_params
    params.require(:compensation).permit(:amount, :status, :basis, :dispute_reason, :resolution)
  end
end
