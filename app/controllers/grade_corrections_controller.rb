class GradeCorrectionsController < ApplicationController
  before_action :require_login
  before_action :set_grade_correction, only: [:show, :edit, :update, :accept, :start_processing, :submit_for_review, :approve, :reject, :return_to_processor, :reprocess, :reopen, :add_business_record, :add_attachment, :processing, :review]

  def index
    @q = GradeCorrection.ransack(params[:q])
    scope = @q.result.includes(:current_owner, :processing_nodes).order(created_at: :desc)
    scope = scope.with_block_reason if params[:by_block].present?
    @pagy, @grade_corrections = pagy(scope, items: 20)
    authorize @grade_corrections
  end

  def show
    authorize @grade_correction
    @diff_records = @grade_correction.diff_records.order(created_at: :desc)
    @attachments = @grade_correction.attachments.order(created_at: :desc)
  end

  def new
    @grade_correction = GradeCorrection.new
    authorize @grade_correction
  end

  def create
    @grade_correction = GradeCorrection.new(grade_correction_params)
    @grade_correction.current_owner = current_user
    @grade_correction.current_user = current_user
    authorize @grade_correction

    if @grade_correction.save
      redirect_to @grade_correction, notice: '申请创建成功'
    else
      render :new
    end
  end

  def edit
    authorize @grade_correction
  end

  def update
    authorize @grade_correction
    @grade_correction.current_user = current_user

    if @grade_correction.update(grade_correction_params)
      redirect_to @grade_correction, notice: '更新成功'
    else
      render :edit
    end
  end

  def accept
    authorize @grade_correction
    @grade_correction.accept!(operator: current_user, content: params[:content])
    redirect_to @grade_correction, notice: '已受理'
  end

  def start_processing
    authorize @grade_correction
    @grade_correction.start_processing!(operator: current_user, content: params[:content])
    redirect_to @grade_correction, notice: '已开始处理'
  end

  def submit_for_review
    authorize @grade_correction
    @grade_correction.submit_for_review!(operator: current_user, content: params[:content])
    redirect_to @grade_correction, notice: '已提交复核'
  end

  def approve
    authorize @grade_correction
    @grade_correction.approve!(operator: current_user, content: params[:content], conclusion: params[:conclusion])
    redirect_to @grade_correction, notice: '复核通过，已归档'
  end

  def reject
    authorize @grade_correction
    @grade_correction.reject!(
      operator: current_user,
      content: params[:content],
      block_reason: params[:block_reason],
      remedy_path: params[:remedy_path]
    )
    redirect_to @grade_correction, notice: '已驳回申请'
  end

  def return_to_processor
    authorize @grade_correction
    @grade_correction.return_to_processor!(
      operator: current_user,
      content: params[:content],
      remedy_path: params[:remedy_path]
    )
    redirect_to @grade_correction, notice: '已退回补证'
  end

  def reprocess
    authorize @grade_correction
    @grade_correction.reprocess!(operator: current_user, content: params[:content])
    redirect_to @grade_correction, notice: '已重新处理'
  end

  def reopen
    authorize @grade_correction
    @grade_correction.reopen!(operator: current_user, content: params[:content])
    redirect_to @grade_correction, notice: '已重新打开申请'
  end

  def add_business_record
    authorize @grade_correction
    node = @grade_correction.processing_nodes.create!(
      node_type: 'processing',
      operator: current_user,
      content: params[:content] || '补充业务记录',
      status: @grade_correction.status,
      on_site_explanation: params[:on_site_explanation],
      business_record: params[:business_record]
    )
    redirect_to @grade_correction, notice: '已添加业务记录'
  end

  def add_attachment
    authorize @grade_correction
    node = @grade_correction.latest_node || @grade_correction.processing_nodes.first
    @grade_correction.attachments.create!(
      processing_node: node,
      file_name: params[:file_name],
      file_type: params[:file_type],
      description: params[:description],
      evidence_type: params[:evidence_type]
    )
    redirect_to @grade_correction, notice: '已添加附件'
  end

  def processing
    authorize @grade_correction
    @diff_records = @grade_correction.diff_records.order(created_at: :desc)
    @attachments = @grade_correction.attachments.order(created_at: :desc)
  end

  def review
    authorize @grade_correction
    @diff_records = @grade_correction.diff_records.order(created_at: :desc)
    @attachments = @grade_correction.attachments.order(created_at: :desc)
  end

  def filter
    index
  end

  private

  def set_grade_correction
    @grade_correction = GradeCorrection.find(params[:id])
  end

  def grade_correction_params
    params.require(:grade_correction).permit(
      :application_no, :student_name, :student_id, :course_name, :course_code,
      :original_score, :corrected_score, :application_reason, :source,
      :applicant, :application_date, :critical_time, :responsible_party,
      :amount, :evidence_conclusion, :block_reason, :remedy_path
    )
  end
end
