class LossReportsController < ApplicationController
  def index
    @loss_reports = LossReport.includes(:batch, :batch => :material, :reporter, :reviewer).all
    @loss_reports = @loss_reports.where(status: params[:status]) if params[:status].present?
    @loss_reports = @loss_reports.order(created_at: :desc)
  end

  def show
    @loss_report = LossReport.find(params[:id])
    @batch = @loss_report.batch
    @workflow_nodes = @loss_report.workflow_nodes.order(created_at: :desc)
    @allocation = @loss_report.allocation
  end

  def new
    @loss_report = LossReport.new
    @loss_report.allocation_id = params[:allocation_id] if params[:allocation_id].present?
    @batches = Batch.where(status: ["in_stock", "allocated"])
  end

  def create
    @loss_report = LossReport.new(loss_report_params)
    @loss_report.report_number = LossReport.generate_number

    if @loss_report.save
      @batch = @loss_report.batch
      @batch.update(
        available_quantity: @batch.available_quantity - @loss_report.quantity,
        status: :lost
      )

      redirect_to @loss_report, notice: "报损单创建成功"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def approve
    @loss_report = LossReport.find(params[:id])
    if @loss_report.pending?
      @loss_report.update(status: :approved, reviewer_id: current_user.id)
      @loss_report.workflow_nodes.create!(node_type: "loss_report_approved", actor: current_user, metadata: {})
      redirect_to @loss_report, notice: "报损单已批准"
    else
      redirect_to @loss_report, alert: "报损单状态不允许批准"
    end
  end

  def reject_approval
    @loss_report = LossReport.find(params[:id])
    if @loss_report.pending?
      @loss_report.update(status: :rejected, reviewer_id: current_user.id)
      redirect_to @loss_report, notice: "报损单已驳回"
    else
      redirect_to @loss_report, alert: "报损单状态不允许驳回"
    end
  end

  private

  def loss_report_params
    params.require(:loss_report).permit(:allocation_id, :batch_id, :reporter_id, :loss_type, :quantity, :reason)
  end

  def current_user
    @current_user ||= User.first
  end
end
