class SettlementsController < ApplicationController
  before_action :require_login
  before_action :require_role, "admin", "finance"
  before_action :set_settlement, only: [:show, :confirm, :dispute]

  def index
    @settlements = Settlement.all.order(created_at: :desc)
    @settlements = @settlements.where(status: params[:status]) if params[:status].present?
  end

  def show
    @application = @settlement.application
  end

  def confirm
    if @settlement.update(status: "confirmed", confirmed_at: Time.current)
      @settlement.application.update(status: "approved")
      redirect_to @settlement, notice: "结算已确认"
    else
      redirect_to @settlement, alert: "结算确认失败"
    end
  end

  def dispute
    if @settlement.update(status: "disputed", dispute_reason: params[:dispute_reason])
      @settlement.application.update(status: "disputed")
      redirect_to @settlement, notice: "已发起争议"
    else
      redirect_to @settlement, alert: "争议发起失败"
    end
  end

  private

  def set_settlement
    @settlement = Settlement.find(params[:id])
  end
end