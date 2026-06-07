class ReviewsController < ApplicationController
  before_action :require_login
  before_action :set_sample
  before_action :require_reviewer_role

  def new
    @sample_version = @sample.current_version
    @review = @sample.all_reviews.build
    @review.sample_version = @sample_version
    @issue_types = IssueType.all.group_by(&:category)
  end

  def create
    @sample_version = @sample.sample_versions.find(params[:review][:sample_version_id]) rescue @sample.current_version
    @review = @sample.all_reviews.build(review_params)
    @review.reviewer = current_user
    @review.sample_version = @sample_version
    @review.issues = parse_issues(params[:review][:issues])

    if @review.save
      handle_review_verdict
      flash[:notice] = "评审已提交"
      redirect_to @sample
    else
      @issue_types = IssueType.all.group_by(&:category)
      render :new, status: :unprocessable_entity
    end
  end

  private

  def parse_issues(issues_param)
    return [] if issues_param.blank?

    issues_array = Array.wrap(issues_param).reject(&:blank?)
    issues_array.map do |issue|
      type = if issue.respond_to?(:[]) && issue["type"].present?
               issue["type"]
             elsif issue.is_a?(String) && issue.present?
               issue
             end
      type.present? ? { "type" => type } : nil
    end.compact
  end

  def set_sample
    @sample = Sample.find(params[:sample_id])
  end

  def require_reviewer_role
    unless current_user_role?(:reviewer) || current_user_role?(:supervisor)
      flash[:alert] = "只有评审人或主管可以进行评审"
      redirect_to @sample
    end
  end

  def review_params
    params.require(:review).permit(
      :verdict,
      :feedback,
      :sample_version_id,
      issues: [:type]
    )
  end

  def handle_review_verdict
    case @review.verdict
    when "pass"
      @sample.update!(status: :review, current_owner: @sample.designer)
    when "revise"
      @sample.update!(
        status: :revision,
        current_owner: @sample.pattern_maker,
        supervisor_confirmation_required: @sample.revision_count + 1 >= Sample::MAX_REVISIONS_BEFORE_SUPERVISOR,
        supervisor_confirmed: @sample.revision_count + 1 < Sample::MAX_REVISIONS_BEFORE_SUPERVISOR
      )
    when "finalize"
      needs_confirm = @sample.supervisor_confirmation_required? || (@sample.revision_count >= Sample::MAX_REVISIONS_BEFORE_SUPERVISOR)
      can_finalize = !needs_confirm || (needs_confirm && @sample.supervisor_confirmed?)

      if can_finalize
        @sample.update!(
          status: :finalized,
          finalized_at: Time.current,
          current_owner: @sample.designer
        )
      else
        flash[:alert] = "改版超次，需要主管确认后才能定版"
      end
    end
  end
end
