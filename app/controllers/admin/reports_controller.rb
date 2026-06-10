module Admin
  class ReportsController < ApplicationController
    before_action :authenticate_admin!
    before_action :set_report, only: [:show, :approve_reissue, :reject_reissue]

    def index
      @reports = Report.includes(:exam, :patient).order(created_at: :desc)
      @reports = @reports.where(status: params[:status]) if params[:status].present?
    end

    def show
      @history_records = @report.history_records.order(created_at: :desc)
    end

    def approve_reissue
      if @report.can_approve_reissue?
        @report.update!(status: :reissued)
        @report.add_history("reissued", current_user.name)
        redirect_to admin_report_path(@report), notice: "补打已批准"
      else
        redirect_to admin_report_path(@report), alert: "当前状态不允许批准补打"
      end
    end

    def reject_reissue
      if @report.reissue_requested?
        @report.update!(status: :delivered)
        @report.add_history("reissue_rejected", current_user.name, params[:reason])
        redirect_to admin_report_path(@report), alert: "补打申请已拒绝"
      else
        redirect_to admin_report_path(@report), alert: "当前状态不允许拒绝补打"
      end
    end

    private

    def set_report
      @report = Report.includes(:exam, :patient, :authorizations, :history_records).find(params[:id])
    end
  end
end