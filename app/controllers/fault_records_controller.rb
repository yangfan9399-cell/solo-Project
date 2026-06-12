class FaultRecordsController < ApplicationController
  before_action :set_fault_record, only: [:show, :edit, :update, :process_record, :accept, :assign_handler,
                                          :submit_review, :start_review, :review_pass, :return_supplement,
                                          :reopen, :upload_evidence, :review]

  def index
    @q = FaultRecord.ransack(params[:q])
    @fault_records = @q.result.order(created_at: :desc).page(params[:page]).per(20)
    @status_counts = FaultRecord.status_counts
    @abnormal_counts = FaultRecord.abnormal_type_counts
    @line_counts = FaultRecord.line_fault_counts
    @daily_counts = FaultRecord.daily_fault_counts(14)

    respond_to do |format|
      format.html
      format.turbo_stream
    end
  end

  def show
    authorize @fault_record
    @diff_snapshots = @fault_record.diff_snapshots.order(created_at: :desc)
    @evidence_attachments = @fault_record.evidence_attachments.order(created_at: :desc)
    @workflow_nodes = @fault_record.workflow_nodes.includes(:operator).order(created_at: :asc)
  end

  def review
    authorize @fault_record, :show?
    @diff_snapshots = @fault_record.diff_snapshots.order(created_at: :desc)
    @evidence_attachments = @fault_record.evidence_attachments.order(created_at: :desc)
    @workflow_nodes = @fault_record.workflow_nodes.includes(:operator).order(created_at: :asc)
  end

  def dashboard
    @status_counts = FaultRecord.status_counts
    @abnormal_counts = FaultRecord.abnormal_type_counts
    @line_counts = FaultRecord.line_fault_counts
    @daily_counts = FaultRecord.daily_fault_counts(30)
    @avg_duration = FaultRecord.avg_processing_duration
    @total_records = FaultRecord.count
    @archived_count = FaultRecord.archived_records.count
    @abnormal_count = FaultRecord.abnormal.count
    @processing_count = FaultRecord.processing.count
    @pending_count = FaultRecord.pending_review.count
  end

  def new
    @fault_record = FaultRecord.new
    authorize @fault_record
  end

  def create
    @fault_record = FaultRecord.new(fault_record_params)
    @fault_record.ticket_no ||= generate_ticket_no
    @fault_record.reported_at ||= Time.current
    @fault_record.reporter = current_user
    authorize @fault_record

    if @fault_record.save
      redirect_to @fault_record, notice: "故障记录已创建"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    authorize @fault_record
  end

  def update
    authorize @fault_record

    if @fault_record.update(fault_record_params)
      @fault_record.log_info_update(operator: current_user, comment: params[:comment]) if params[:comment].present?

      respond_to do |format|
        format.html { redirect_to @fault_record, notice: "记录已更新" }
        format.turbo_stream do
          render turbo_stream: [
            turbo_stream.replace("list_row_#{@fault_record.id}", partial: "fault_records/fault_record", locals: { fault_record: @fault_record }),
            turbo_stream.replace("flash_notices", partial: "shared/flash")
          ]
        end
      end
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def process_record
    authorize @fault_record, :process_record?

    if params[:fault_record].present?
      if @fault_record.update(process_params)
        @fault_record.log_info_update(operator: current_user, comment: params[:comment])
        respond_to_fault_record_update("处理记录已更新")
      else
        render :show, status: :unprocessable_entity
      end
    end
  end

  def accept
    authorize @fault_record, :accept?
    @fault_record.accept!(operator: current_user, comment: params[:comment])
    respond_to_fault_record_update("已受理")
  end

  def assign_handler
    authorize @fault_record, :assign_handler?
    handler = User.find(params[:handler_id])
    @fault_record.current_owner = handler
    @fault_record.assign_for_processing!(operator: current_user, comment: "分配给 #{handler.name} 处理")
    respond_to_fault_record_update("已分配处理人")
  end

  def submit_review
    authorize @fault_record, :submit_review?
    @fault_record.submit_for_review!(operator: current_user, comment: params[:comment] || "处理完成，提交复核")
    respond_to_fault_record_update("已提交复核")
  end

  def start_review
    authorize @fault_record, :start_review?
    @fault_record.start_review!(operator: current_user, comment: params[:comment] || "开始复核")
    respond_to_fault_record_update("已开始复核")
  end

  def review_pass
    authorize @fault_record, :review_pass?
    @fault_record.review_pass!(operator: current_user, comment: params[:comment] || "复核通过")
    respond_to_fault_record_update("复核通过，已归档")
  end

  def return_supplement
    authorize @fault_record, :return_supplement?
    @fault_record.return_for_supplement!(operator: current_user, comment: params[:comment] || "需要补充材料")
    respond_to_fault_record_update("已退回补证")
  end

  def reopen
    authorize @fault_record, :reopen?
    @fault_record.reopen!(operator: current_user, comment: params[:comment] || "重新处理")
    respond_to_fault_record_update("已重新处理，生成新节点")
  end

  def upload_evidence
    authorize @fault_record, :upload_evidence?

    if params[:evidence_attachment].present?
      attachment_params = params.require(:evidence_attachment).permit(:attachment_type, :description, :file_name, :content_type, :file_size)
      node = @fault_record.workflow_nodes.create!(
        node_type: :evidence_upload,
        from_status: FaultRecord.current_statuses[@fault_record.current_status],
        to_status: FaultRecord.current_statuses[@fault_record.current_status],
        operator: current_user,
        action_type: :upload_evidence,
        comment: "上传证据附件",
        snapshot_data: @fault_record.attributes.slice(*FaultRecord::TRACKED_FIELDS),
        processed_at: Time.current
      )
      @fault_record.evidence_attachments.create!(attachment_params.merge(uploaded_by: current_user, workflow_node: node))
      respond_to_fault_record_update("证据已上传")
    else
      redirect_to @fault_record, alert: "请选择证据附件"
    end
  end

  private

  def respond_to_fault_record_update(notice_message)
    @status_counts = FaultRecord.status_counts
    @abnormal_counts = FaultRecord.abnormal_type_counts
    @line_counts = FaultRecord.line_fault_counts
    @daily_counts = FaultRecord.daily_fault_counts(14)

    respond_to do |format|
      format.html { redirect_to @fault_record, notice: notice_message }
      format.turbo_stream do
        flash[:notice] = notice_message
        render turbo_stream: [
          turbo_stream.replace("list_row_#{@fault_record.id}", partial: "fault_records/fault_record", locals: { fault_record: @fault_record }),
          turbo_stream.replace("flash_notices", partial: "shared/flash"),
          turbo_stream.replace("dashboard_stats", partial: "fault_records/dashboard_stats",
            status_counts: @status_counts,
            abnormal_counts: @abnormal_counts,
            line_counts: @line_counts,
            daily_counts: @daily_counts)
        ]
      end
    end
  end

  def set_fault_record
    @fault_record = FaultRecord.find(params[:id])
  end

  def fault_record_params
    params.require(:fault_record).permit(
      :source_type, :line_name, :station_name, :platform_door_no,
      :fault_type, :fault_level, :fault_description, :reported_at,
      :responsible_unit, :responsible_person,
      :maintenance_window_start, :maintenance_window_end,
      :actual_start_at, :actual_end_at,
      :estimated_cost, :actual_cost,
      :notified_confirmation, :handler_qualified,
      :on_site_description, :business_record, :conclusion, :basis_doc,
      :remediation_path, :is_archived
    )
  end

  def process_params
    params.require(:fault_record).permit(:on_site_description, :business_record)
  end

  def generate_ticket_no
    "PD-#{Time.current.strftime('%Y%m%d')}-#{rand(1000..9999)}"
  end
end
