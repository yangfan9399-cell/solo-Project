class DashboardController < ApplicationController
  before_action :require_login

  def index
    @statistics = GradeCorrection.statistics
    @q = GradeCorrection.ransack(params[:q])
    scope = @q.result.includes(:current_owner, :processing_nodes).order(created_at: :desc)
    @pagy = SimplePaginator.new(scope, params[:page] || 1, 10)
    @grade_corrections = @pagy.records
    @monthly_data = GradeCorrection.monthly_statistics
  end

  def review
    @statistics = GradeCorrection.statistics
    @pending_review = GradeCorrection.by_status('reviewing').includes(:current_owner, :processing_nodes)
    @in_processing = GradeCorrection.by_status('processing').includes(:current_owner, :processing_nodes)
    @returned = GradeCorrection.by_status('returned').includes(:current_owner, :processing_nodes)
  end

  def statistics
    @pending_count = GradeCorrection.by_status('pending').count
    @processing_count = GradeCorrection.by_status('processing').count
    @reviewing_count = GradeCorrection.by_status('reviewing').count
    @archived_count = GradeCorrection.by_status('archived').count
    @rejected_count = GradeCorrection.by_status('rejected').count
    @returned_count = GradeCorrection.by_status('returned').count
    @unconfirmed_count = GradeCorrection.notification_unconfirmed.count
    @blocked_count = GradeCorrection.with_block_reason.count

    @source_counts = GradeCorrection.group(:source).count
    @evidence_counts = GradeCorrection.group(:evidence_conclusion).count

    @assignee_counts = GradeCorrection.where.not(current_owner_id: nil).group(:current_owner_id).count.transform_keys do |id|
      User.find_by(id: id)
    end.compact

    score_diffs = GradeCorrection.where.not(corrected_score: nil).where.not(original_score: nil)
                                  .pluck(Arel.sql('corrected_score - original_score')).compact
    @score_diff_ranges = {
      '0-5分' => score_diffs.count { |d| d <= 5 },
      '6-10分' => score_diffs.count { |d| d > 5 && d <= 10 },
      '11-20分' => score_diffs.count { |d| d > 10 && d <= 20 },
      '20分以上' => score_diffs.count { |d| d > 20 }
    }

    amounts = GradeCorrection.pluck(:amount).compact
    @total_amount = amounts.sum
    @avg_amount = amounts.any? ? amounts.sum / amounts.size : 0

    processing_times = GradeCorrection.where(status: :archived)
      .joins(:processing_nodes)
      .where(processing_nodes: { node_type: ['accept', 'approve'] })
      .group('grade_corrections.id')
      .pluck(Arel.sql('EXTRACT(EPOCH FROM (MAX(processing_nodes.created_at) - MIN(processing_nodes.created_at))) / 3600'))
    @avg_processing_hours = processing_times.any? ? processing_times.sum / processing_times.size : 0
    @min_processing_hours = processing_times.min || 0
    @max_processing_hours = processing_times.max || 0

    @field_change_counts = DiffRecord.group(:field_name).count
  end
end
