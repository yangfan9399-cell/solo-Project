module Admin
  class StatisticsController < ApplicationController
    before_action :authenticate_admin!

    def index
      @exam_type_stats = exam_type_statistics
      @pickup_type_stats = pickup_type_statistics
      @exception_stats = exception_statistics
      @daily_stats = daily_statistics
      @wait_time_stats = wait_time_statistics
    end

    private

    def exam_type_statistics
      Report.joins(:exam).group("exams.exam_type").count
    end

    def pickup_type_statistics
      Report.where.not(pickup_type: nil).group(:pickup_type).count
    end

    def exception_statistics
      Report.exception.group(:remark).count
    end

    def daily_statistics
      Report.group("DATE(issue_date)").count
    end

    def wait_time_statistics
      stats = {
        '0-1天' => 0,
        '1-3天' => 0,
        '3-7天' => 0,
        '7天以上' => 0
      }
      Report.delivered.each do |report|
        if report.exam && report.created_at
          wait_days = (report.created_at - report.exam.exam_date).to_f / (24 * 60 * 60)
          if wait_days <= 1
            stats['0-1天'] += 1
          elsif wait_days <= 3
            stats['1-3天'] += 1
          elsif wait_days <= 7
            stats['3-7天'] += 1
          else
            stats['7天以上'] += 1
          end
        end
      end
      stats
    end
  end
end