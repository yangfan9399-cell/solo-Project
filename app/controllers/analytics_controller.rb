class AnalyticsController < ApplicationController
  before_action :require_login

  def index
    @total_samples = Sample.count
    @finalized_samples = Sample.finalized.count
    @in_progress_samples = Sample.where.not(status: :finalized).count

    @by_category = Sample.group(:category).count
    @by_status = Sample.statuses.keys.index_with { |s| Sample.where(status: s).count }

    @by_pattern_maker = Sample.joins(:pattern_maker)
                             .where.not(pattern_maker_id: nil)
                             .group("users.name")
                             .count
                             .sort_by { |_, v| -v }
                             .to_h

    @finalized_by_pattern_maker = Sample.finalized
                                       .joins(:pattern_maker)
                                       .where.not(pattern_maker_id: nil)
                                       .group("users.name")
                                       .count
                                       .sort_by { |_, v| -v }
                                       .to_h

    @avg_revisions_by_pattern_maker = Sample.finalized
                                          .joins(:pattern_maker)
                                          .where.not(pattern_maker_id: nil)
                                          .group("users.name")
                                          .average("version_count - 1")
                                          .transform_values { |v| v.round(1) }
                                          .sort_by { |_, v| -v }
                                          .to_h

    @cycle_days_stats = calculate_cycle_days_stats
    @issue_type_stats = calculate_issue_type_stats
    @cycle_by_category = calculate_cycle_by_category
  end

  private

  def calculate_cycle_days_stats
    finalized = Sample.finalized.where.not(submitted_at: nil).where.not(finalized_at: nil)
    return { avg: 0, min: 0, max: 0 } if finalized.empty?

    days = finalized.map { |s| (s.finalized_at - s.submitted_at).to_i / 1.day }
    {
      avg: days.sum / days.size,
      min: days.min,
      max: days.max,
      count: days.size
    }
  end

  def calculate_issue_type_stats
    issue_counts = Hash.new(0)
    Review.includes(:sample).find_each do |review|
      Array(review.issues).each do |issue|
        type = issue.is_a?(Hash) ? issue["type"] : issue.to_s
        issue_counts[type] += 1 if type.present?
      end
    end
    issue_counts.sort_by { |_, v| -v }.to_h
  end

  def calculate_cycle_by_category
    result = {}
    categories = Sample.finalized.distinct.pluck(:category).compact
    categories.each do |cat|
      samples = Sample.finalized.where(category: cat)
                               .where.not(submitted_at: nil, finalized_at: nil)
      next if samples.empty?

      days = samples.map { |s| (s.finalized_at - s.submitted_at).to_i / 1.day }
      result[cat] = {
        count: samples.size,
        avg_days: days.sum / days.size,
        min_days: days.min,
        max_days: days.max
      }
    end
    result.sort_by { |_, v| -v[:count] }.to_h
  end
end
