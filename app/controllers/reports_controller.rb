class ReportsController < ApplicationController
  before_action :authenticate_user!, except: [:index, :show]
  before_action :set_report, only: [:show, :confirm_pickup, :reject_pickup, :deliver, :request_reissue, :approve_reissue, :reject_reissue]

  def index
    @reports = Report.includes(:exam, :patient).order(created_at: :desc)
    @reports = @reports.where(status: params[:status]) if params[:status].present?
  end

  def show
    @history_records = @report.history_records.order(created_at: :desc)
    @authorization = @report.authorizations.new
  end

  def request_pickup
    @report = Report.find(params[:id])
    if @report.can_request_pickup?
      @report.update!(
        pickup_type: params[:pickup_type],
        status: :pickup_requested
      )
      @report.add_history("pickup_requested", current_user.name, params[:remark])
      redirect_to @report, notice: "领取请求已提交"
    else
      redirect_to @report, alert: "当前状态不允许提交领取请求"
    end
  end

  def confirm_pickup
    if @report.can_confirm?
      @report.update!(status: :confirmed)
      @report.add_history("confirmed", current_user.name)
      redirect_to @report, notice: "报告已确认"
    else
      redirect_to @report, alert: "当前状态不允许确认"
    end
  end

  def reject_pickup
    if @report.pickup_requested? || @report.confirmed?
      @report.update!(status: :exception)
      @report.add_history("exception", current_user.name, params[:reason])
      redirect_to @report, alert: "已拒绝领取请求"
    else
      redirect_to @report, alert: "当前状态不允许拒绝"
    end
  end

  def deliver
    if @report.can_deliver?
      if @report.id_mismatch?
        redirect_to @report, alert: "身份证不符，禁止交付报告"
      else
        @report.update!(status: :delivered)
        @report.add_history("delivered", current_user.name)
        redirect_to @report, notice: "报告已交付"
      end
    else
      redirect_to @report, alert: "当前状态不允许交付"
    end
  end

  def request_reissue
    if @report.can_request_reissue?
      @report.update!(status: :reissue_requested)
      @report.add_history("reissue_requested", current_user.name, params[:remark])
      redirect_to @report, notice: "补打申请已提交，请等待主管审核"
    else
      redirect_to @report, alert: "当前状态不允许申请补打"
    end
  end

  def approve_reissue
    if current_user.can_approve_reissue? && @report.can_approve_reissue?
      @report.update!(status: :reissued)
      @report.add_history("reissued", current_user.name)
      redirect_to @report, notice: "补打已批准"
    else
      redirect_to @report, alert: "无权限或当前状态不允许批准补打"
    end
  end

  def reject_reissue
    if current_user.can_approve_reissue? && @report.reissue_requested?
      @report.update!(status: :delivered)
      @report.add_history("reissue_rejected", current_user.name, params[:reason])
      redirect_to @report, alert: "补打申请已拒绝"
    else
      redirect_to @report, alert: "无权限或当前状态不允许拒绝补打"
    end
  end

  private

  def set_report
    @report = Report.includes(:exam, :patient, :authorizations, :history_records).find(params[:id])
  end
end