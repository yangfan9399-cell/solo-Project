module Admin
  class StatisticsController < ApplicationController
    before_action :authenticate_admin!

    def index
      @exam_type_stats = exam_type_statistics
      @pickup_type_stats = pickup_type_statistics
      @exception_stats = exception_statistics
      @daily_stats = daily_statistics
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
  end
end