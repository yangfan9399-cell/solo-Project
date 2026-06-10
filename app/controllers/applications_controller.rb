class ApplicationsController < ApplicationController
  before_action :require_login
  before_action :set_application, only: [:show, :edit, :update, :review, :approve, :reject]

  def index
    @applications = Application.all.order(created_at: :desc)
    @applications = @applications.where(status: params[:status]) if params[:status].present?
    @applications = @applications.where(user: current_user) if current_user.biz_admin?
  end

  def show
    @track = @application.track
    @client_industry = @application.client_industry
    @reviews = @application.reviews.order(created_at: :desc)
    @contract = @application.contract
    @settlement = @application.settlement
    @histories = @application.application_histories.order(created_at: :desc)
  end

  def new
    @application = Application.new
    @tracks = Track.all
  end

  def create
    @application = Application.new(application_params)
    @application.user = current_user

    if @application.save
      redirect_to @application, notice: "授权申请已创建"
    else
      @tracks = Track.all
      render :new
    end
  end

  def edit
    @tracks = Track.all
  end

  def update
    if params[:application][:status].present?
      if @application.update(status: params[:application][:status])
        @application.application_histories.create(
          action: "submitted",
          operator_id: current_user.id,
          details: "提交审核"
        )
        redirect_to @application, notice: "申请已提交审核"
      else
        @tracks = Track.all
        render :edit
      end
    elsif @application.update(application_params)
      redirect_to @application, notice: "授权申请已更新"
    else
      @tracks = Track.all
      render :edit
    end
  end

  def review
    unless @application.can_be_approved_by?(current_user)
      redirect_to @application, alert: "权限不足"
      return
    end

    @review = Review.new(
      application: @application,
      reviewer: current_user,
      review_type: determine_review_type
    )
  end

  def approve
    unless @application.can_be_approved_by?(current_user)
      redirect_to @application, alert: "权限不足"
      return
    end

    if @application.scenario_out_of_range?
      redirect_to @application, alert: "场景超范围，无法通过审核"
      return
    end

    @review = Review.new(
      application: @application,
      reviewer: current_user,
      review_type: determine_review_type,
      status: "approved",
      comment: params[:comment]
    )

    if @review.save
      if @application.status == "approved"
        create_contract_and_settlement
      end
      redirect_to @application, notice: "审核通过"
    else
      render :review
    end
  end

  def reject
    unless @application.can_be_approved_by?(current_user)
      redirect_to @application, alert: "权限不足"
      return
    end

    @review = Review.new(
      application: @application,
      reviewer: current_user,
      review_type: determine_review_type,
      status: "rejected",
      comment: params[:comment]
    )

    if @review.save
      redirect_to @application, notice: "申请已驳回"
    else
      render :review
    end
  end

  private

  def set_application
    @application = Application.find(params[:id])
  end

  def application_params
    params.require(:application).permit(
      :track_id,
      :client_name,
      :client_industry,
      :client_contact,
      :usage_scenario,
      :territory,
      :start_date,
      :end_date,
      :budget
    )
  end

  def determine_review_type
    case @application.status
    when "pending_copyright"
      "copyright"
    when "pending_legal"
      "legal"
    when "pending_finance"
      "finance"
    end
  end

  def create_contract_and_settlement
    contract = Contract.create!(application: @application)
    Settlement.create!(
      application: @application,
      total_amount: @application.budget || 0,
      copyright_holder_share: 70,
      agent_share: 30
    )
  end
end