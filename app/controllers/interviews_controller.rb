class InterviewsController < ApplicationController
  before_action :set_interview, only: [:show, :edit, :update, :destroy, :submit_for_review, :brand_review, :legal_review, :publish_review, :publish, :reject, :add_sensitive_item, :cover_sensitive_item, :upload_authorization]

  def index
    @interviews = Interview.all.order(created_at: :desc)
  end

  def show
    @review_records = @interview.review_records.order(created_at: :asc)
    @change_histories = @interview.change_histories.order(created_at: :desc)
    @sensitive_items = @interview.sensitive_items
    @authorization = @interview.authorization
  end

  def new
    @interview = Interview.new
    @respondents = Respondent.all
  end

  def create
    @interview = Interview.new(interview_params)
    @interview.user = current_user
    @interview.status = :draft

    if @interview.save
      redirect_to @interview, notice: '访谈稿创建成功'
    else
      @respondents = Respondent.all
      render :new
    end
  end

  def edit
    @respondents = Respondent.all
  end

  def update
    old_attributes = @interview.attributes.slice('title', 'content', 'publish_date', 'channel', 'respondent_id')
    
    if @interview.update(interview_params)
      new_attributes = @interview.attributes.slice('title', 'content', 'publish_date', 'channel', 'respondent_id')
      changed_fields = old_attributes.select { |k, v| v != new_attributes[k] }.keys
      
      if changed_fields.present?
        @interview.change_histories.create(
          user: current_user,
          changed_fields: changed_fields,
          previous_values: old_attributes.slice(*changed_fields),
          new_values: new_attributes.slice(*changed_fields),
          comment: params[:comment]
        )
      end
      
      redirect_to @interview, notice: '访谈稿更新成功'
    else
      @respondents = Respondent.all
      render :edit
    end
  end

  def submit_for_review
    @interview.status = :pending_brand_review
    @interview.save!
    @interview.review_records.create(
      reviewer: current_user,
      stage: :brand_review,
      status: :pending,
      comment: params[:comment]
    )
    
    redirect_to @interview, notice: '已提交品牌审核'
  end

  def brand_review
    if params[:approve] == 'true'
      @interview.status = :pending_legal_review
      @interview.save!
      @interview.review_records.create(
        reviewer: current_user,
        stage: :brand_review,
        status: :approved,
        comment: params[:comment]
      )
      redirect_to @interview, notice: '品牌审核通过'
    else
      @interview.status = :rejected
      @interview.save!
      @interview.review_records.create(
        reviewer: current_user,
        stage: :brand_review,
        status: :rejected,
        comment: params[:comment]
      )
      redirect_to @interview, notice: '品牌审核退回'
    end
  end

  def legal_review
    if params[:approve] == 'true'
      @interview.status = :pending_publish
      @interview.save!
      
      if @interview.authorization
        @interview.authorization.update(approved: true, approved_at: Time.current)
      end
      
      @interview.review_records.create(
        reviewer: current_user,
        stage: :legal_review,
        status: :approved,
        comment: params[:comment]
      )
      redirect_to @interview, notice: '法务复核通过，授权文件已批准'
    else
      @interview.status = :rejected
      @interview.save!
      @interview.review_records.create(
        reviewer: current_user,
        stage: :legal_review,
        status: :rejected,
        comment: params[:comment]
      )
      redirect_to @interview, notice: '法务复核退回'
    end
  end

  def publish_review
    if params[:approve] == 'true'
      @interview.review_records.create(
        reviewer: current_user,
        stage: :publish_review,
        status: :approved,
        comment: params[:comment]
      )
      redirect_to @interview, notice: '发布审核通过'
    else
      @interview.status = :rejected
      @interview.save!
      @interview.review_records.create(
        reviewer: current_user,
        stage: :publish_review,
        status: :rejected,
        comment: params[:comment]
      )
      redirect_to @interview, notice: '发布审核退回'
    end
  end

  def publish
    if @interview.can_publish?
      @interview.status = :published
      @interview.save!
      @interview.review_records.create(
        reviewer: current_user,
        stage: :publish_review,
        status: :approved,
        comment: '已发布'
      )
      redirect_to @interview, notice: '发布成功'
    else
      errors = []
      errors << '授权文件缺失或未批准' unless @interview.authorized?
      errors << '存在未遮盖的敏感信息' if @interview.has_uncovered_sensitive_items?
      errors << '状态不允许发布' unless @interview.pending_publish?
      redirect_to @interview, alert: "发布失败：#{errors.join('；')}"
    end
  end

  def reject
    @interview.status = :rejected
    @interview.save!
    @interview.review_records.create(
      reviewer: current_user,
      stage: @interview.review_stage,
      status: :rejected,
      comment: params[:comment]
    )
    redirect_to @interview, notice: '已退回'
  end

  def add_sensitive_item
    @interview.sensitive_items.create(
      content: params[:content],
      position: params[:position],
      start_index: params[:start_index],
      end_index: params[:end_index],
      covered: false
    )
    redirect_to @interview, notice: '敏感项已添加'
  end

  def cover_sensitive_item
    sensitive_item = @interview.sensitive_items.find(params[:sensitive_item_id])
    sensitive_item.update(covered: true)
    redirect_to @interview, notice: '敏感项已遮盖'
  end

  def upload_authorization
    @authorization = @interview.authorization || @interview.build_authorization
    @authorization.update(
      file_path: params[:file_path],
      approved: false,
      approved_at: nil,
      user: current_user
    )
    redirect_to @interview, notice: '授权文件已上传，待法务复核批准'
  end

  def statistics
    @by_channel = Interview.group(:channel).count
    @by_respondent_type = Interview.joins(:respondent).group('respondents.type').count
    @by_status = Interview.group(:status).count
    
    @rejected_reasons = ReviewRecord.where(status: :rejected).group(:comment).count
    
    @avg_review_duration = ReviewRecord.where(status: [:approved, :rejected]).average('EXTRACT(EPOCH FROM (created_at - (SELECT MIN(created_at) FROM review_records r WHERE r.interview_id = review_records.interview_id))) / 3600')
    
    @completed_interviews = Interview.where(status: [:published, :rejected])
    @total_duration = @completed_interviews.joins(:review_records).group(:id).average('EXTRACT(EPOCH FROM (MAX(review_records.created_at) - MIN(review_records.created_at))) / 3600')
  end

  private

  def set_interview
    @interview = Interview.find(params[:id])
  end

  def interview_params
    params.require(:interview).permit(:title, :content, :publish_date, :channel, :respondent_id)
  end

  def current_user
    User.first || User.create(name: '系统用户', email: 'system@example.com', role: :operator)
  end
end