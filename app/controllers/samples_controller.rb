class SamplesController < ApplicationController
  before_action :require_login
  before_action :set_sample, only: [:show, :edit, :update, :submit_for_pattern, :start_pattern, :submit_for_review, :start_revision, :finalize, :supervisor_confirm]

  def index
    @samples = Sample.includes(:designer, :pattern_maker, :current_owner)
                   .order(created_at: :desc)
                   .limit(100)

    if params[:category].present?
      @samples = @samples.where(category: params[:category])
    end

    if params[:status].present?
      @samples = @samples.where(status: params[:status])
    end

    if params[:pattern_maker_id].present?
      @samples = @samples.where(pattern_maker_id: params[:pattern_maker_id])
    end

    @categories = Sample.distinct.pluck(:category).compact
    @statuses = Sample.statuses.keys
    @pattern_makers = User.pattern_maker.order(:name)
  end

  def show
    @sample_versions = @sample.sample_versions.includes(:created_by, :reviews).order(version_number: :desc)
    @current_version = @sample.current_version
    @reviews = @sample.all_reviews.includes(:reviewer, :sample_version).order(created_at: :desc)
  end

  def new
    @sample = Sample.new
    @designers = User.designer.order(:name)
    @pattern_makers = User.pattern_maker.order(:name)
  end

  def create
    params[:sample][:size_chart] = parse_size_chart(params[:sample][:size_chart])
    @sample = Sample.new(sample_params)
    @sample.designer = current_user if current_user.designer?
    @sample.status = :draft
    @sample.version_count = 0
    @sample.current_owner = @sample.designer

    if @sample.save
      if @sample.version_count == 0
        @sample.sample_versions.create!(
          version_number: 1,
          fabric: @sample.fabric,
          size_chart: @sample.size_chart,
          description: "初始版本",
          created_by: current_user
        )
        @sample.update!(version_count: 1)
      end

      flash[:notice] = "样衣创建成功"
      redirect_to @sample
    else
      @designers = User.designer.order(:name)
      @pattern_makers = User.pattern_maker.order(:name)
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    @designers = User.designer.order(:name)
    @pattern_makers = User.pattern_maker.order(:name)
  end

  def update
    params[:sample][:size_chart] = parse_size_chart(params[:sample][:size_chart])
    if @sample.update(sample_params)
      flash[:notice] = "样衣信息更新成功"
      redirect_to @sample
    else
      @designers = User.designer.order(:name)
      @pattern_makers = User.pattern_maker.order(:name)
      render :edit, status: :unprocessable_entity
    end
  end

  def submit_for_pattern
    if @sample.draft? && current_user.designer?
      @sample.update!(status: :pattern_making,
                      submitted_at: Time.current,
                      current_owner: @sample.pattern_maker)
      flash[:notice] = "已提交打版"
    end
    redirect_to @sample
  end

  def start_pattern
    if @sample.pattern_making? && current_user.pattern_maker?
      @sample.update!(current_owner: current_user)
      flash[:notice] = "开始打版"
    end
    redirect_to @sample
  end

  def submit_for_review
    if @sample.pattern_making? && current_user.pattern_maker?
      @sample.update!(status: :review,
                      current_owner_id: User.reviewer.first)
      flash[:notice] = "已提交评审"
    end
    redirect_to @sample
  end

  def start_revision
    if @sample.review? && current_user.pattern_maker?
      needs_confirmation = @sample.needs_supervisor_confirmation?
      @sample.update!(status: :revision,
                      current_owner: @sample.pattern_maker,
                      supervisor_confirmation_required: needs_confirmation,
                      supervisor_confirmed: !needs_confirmation)
      flash[:notice] = needs_confirmation ? "已开始改版，需主管确认" : "已开始改版"
    end
    redirect_to @sample
  end

  def finalize
    if @sample.review? && current_user_role?(:reviewer, :supervisor)
      needs_confirm = @sample.supervisor_confirmation_required?
      can_finalize = !needs_confirm || (needs_confirm && @sample.supervisor_confirmed?)

      if can_finalize
        @sample.update!(status: :finalized,
                        finalized_at: Time.current,
                        current_owner: @sample.designer)
        flash[:notice] = "样衣已定版"
      else
        flash[:alert] = "改版超次，需要主管确认后才能定版"
      end
    end
    redirect_to @sample
  end

  def supervisor_confirm
    if current_user.supervisor? && @sample.supervisor_confirmation_required?
      @sample.update!(supervisor_confirmed: true)
      flash[:notice] = "主管已确认"
    end
    redirect_to @sample
  end

  private

  def parse_size_chart(size_chart_param)
    return {} if size_chart_param.blank?
    return size_chart_param if size_chart_param.is_a?(Hash)

    begin
      parsed = JSON.parse(size_chart_param)
      parsed.is_a?(Hash) ? parsed : {}
    rescue JSON::ParserError
      {}
    end
  end

  def set_sample
    @sample = Sample.find(params[:id])
  end

  def sample_params
    params.require(:sample).permit(
      :style_number,
      :category,
      :description,
      :fabric,
      :pattern_maker_id,
      :designer_id,
      size_chart: {}
    )
  end
end
