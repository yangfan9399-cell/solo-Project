class RepairRecordsController < ApplicationController
  before_action :set_repair_record, only: [:show, :edit, :update, :complete]
  before_action :require_asset_auditor, only: [:edit, :update, :complete]

  def index
    @repair_records = RepairRecord.all.includes(:prop, :handler).order(created_at: :desc)
    @repair_records = @repair_records.where(status: params[:status]) if params[:status].present?
  end

  def show
  end

  def edit
  end

  def update
    if @repair_record.update(repair_record_params)
      redirect_to @repair_record, notice: "维修记录更新成功"
    else
      render :edit
    end
  end

  def complete
    finish_date = params[:finished_date] || Date.today
    if @repair_record.complete!(finish_date)
      redirect_to @repair_record, notice: "维修已完成，道具已恢复可用状态"
    else
      redirect_to @repair_record, alert: "完成维修失败"
    end
  end

  private

  def set_repair_record
    @repair_record = RepairRecord.find(params[:id])
  end

  def repair_record_params
    params.require(:repair_record).permit(:damage_description, :repair_method, :cost, :start_date, :expected_finish_date, :status)
  end
end
