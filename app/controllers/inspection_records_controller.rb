class InspectionRecordsController < ApplicationController
  before_action :set_inspection_record, only: [:show, :edit, :update, :handle, :review, :workflow_event]

  def index
    authorize InspectionRecord

    @q = policy_scope(InspectionRecord).ransack(params[:q])
    @records = @q.result.includes(:handler, :reviewer, :workflow_nodes)
                 .order(created_at: :desc)
                 .page(params[:page])

    @statistics = InspectionRecord.statistics
    @sample_types = InspectionRecord.sample_type.values
    @defect_types = InspectionRecord.defect_type.values
    @states = InspectionRecord.current_state.values

    respond_to do |format|
      format.html
      format.turbo_stream
      format.json { render json: @records }
    end
  end

  def show
    authorize @record

    @workflow_nodes = @record.workflow_nodes.includes(:operator, :evidence_attachments, :correction_record)
    @block_info = @record.block_info
    @available_events = @record.available_events(current_user)
    @latest_correction = @record.correction_records.last
    @attachments = @record.evidence_attachments.group_by(&:workflow_node_id)

    respond_to do |format|
      format.html
      format.turbo_stream
    end
  end

  def new
    authorize InspectionRecord
    attrs = { inspection_time: Time.current }
    attrs[:handler_id] = current_user.id if current_user.handler?
    @record = InspectionRecord.new(attrs)
  end

  def create
    authorize InspectionRecord

    @record = InspectionRecord.new(inspection_record_params)
    @record.handler_id ||= current_user.id if current_user.handler?

    if @record.save
      redirect_to @record, notice: '巡检记录已创建成功'
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    authorize @record
    redirect_to @record, alert: '已归档记录无法编辑' if @record.archived?
  end

  def update
    authorize @record

    if @record.archived?
      redirect_to @record, alert: '已归档记录无法编辑'
      return
    end

    if @record.update(inspection_record_params)
      broadcast_updates

      respond_to do |format|
        format.html { redirect_to @record, notice: '记录已更新' }
        format.turbo_stream { render turbo_stream: turbo_stream.replace(@record, partial: 'inspection_records/record', locals: { record: @record }) }
      end
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def handle
    authorize @record, :handle?
    @correction = CorrectionRecord.new(inspection_record: @record)
    @available_events = @record.available_events(current_user)
    @workflow_nodes = @record.workflow_nodes.includes(:operator, :evidence_attachments, :correction_record)
    @block_info = @record.block_info
  end

  def review
    authorize @record, :review?
    @available_events = @record.available_events(current_user)
    @workflow_nodes = @record.workflow_nodes.includes(:operator, :evidence_attachments, :correction_record)
    @block_info = @record.block_info
  end

  def workflow_event
    event = params[:event].to_sym
    authorize @record, "#{event}?"

    remark = params[:remark]
    ActiveRecord::Base.transaction do
      if [:archive, :reject].include?(event)
        if params[:block_reason].present? || params[:remedy_path].present? || params[:review_comment].present?
          @record.update(
            block_reason: params[:block_reason],
            remedy_path: params[:remedy_path],
            review_comment: params[:review_comment]
          )
        end
      end

      if @record.send(:"may_#{event}?")
        @record.send(:"#{event}!", remark: remark)
        broadcast_updates
      end
    end

    respond_to do |format|
      format.html { redirect_to @record, notice: '操作成功' }
      format.turbo_stream { render :show }
    end
  rescue StateMachines::InvalidTransition => e
    redirect_to @record, alert: "操作失败：#{e.message}"
  end

  def dashboard
    authorize InspectionRecord, :dashboard?

    @handler_records = current_user.handler? ? current_user.handled_records.active : InspectionRecord.active
    @reviewer_records = current_user.reviewer? ? InspectionRecord.by_state(['review_pending', 'reviewing']) : []
    @statistics = InspectionRecord.statistics
    @trend_data = InspectionRecord.trend_data(14)
  end

  def review_dashboard
    authorize InspectionRecord, :review_dashboard?

    @statistics = InspectionRecord.statistics
    @pending_review = InspectionRecord.by_state('review_pending').order(created_at: :desc)
    @reviewing = InspectionRecord.by_state('reviewing').order(created_at: :desc)
    @recently_archived = InspectionRecord.by_state('archived').order(archived_at: :desc).limit(10)
  end

  def handler_dashboard
    authorize InspectionRecord, :handler_dashboard?

    @statistics = InspectionRecord.statistics
    @my_tasks = current_user.handled_records.active.order(created_at: :desc)
    @overdue = current_user.handled_records.overdue.order(deadline: :asc)
    @rejected = current_user.handled_records.by_state('rejected').order(updated_at: :desc)
  end

  def statistics
    authorize InspectionRecord, :statistics?

    @statistics = InspectionRecord.statistics
    @trend_data = InspectionRecord.trend_data(30)
    @by_sample_type = InspectionRecord.group(:sample_type).count
    @by_defect_type = InspectionRecord.group(:defect_type).count
    @by_state = InspectionRecord.group(:current_state).count
  end

  private

  def set_inspection_record
    @record = InspectionRecord.find(params[:id])
  end

  def inspection_record_params
    params.require(:inspection_record).permit(
      :toilet_name, :toilet_address, :inspection_time, :defect_type,
      :description, :defect_level, :score_before, :score_after,
      :department, :responsible_unit, :responsible_person, :contact_phone,
      :handler_id, :reviewer_id, :deadline, :fine_amount, :reward_amount,
      :evidence_conclusion, :source, :sample_type, :block_reason,
      :remedy_path, :basis, :conclusion, :review_comment
    )
  end

  def broadcast_updates
    Turbo::StreamsChannel.broadcast_replace_to(
      'inspection_records',
      target: "inspection_record_#{@record.id}",
      partial: 'inspection_records/record',
      locals: { record: @record }
    )

    Turbo::StreamsChannel.broadcast_replace_to(
      "inspection_record_#{@record.id}",
      target: 'record_detail',
      partial: 'inspection_records/detail',
      locals: { record: @record }
    )

    Turbo::StreamsChannel.broadcast_replace_to(
      'dashboard_statistics',
      target: 'statistics_panel',
      partial: 'inspection_records/statistics_panel',
      locals: { statistics: InspectionRecord.statistics }
    )
  end
end
