class ExperimentsController < ApplicationController
  SAMPLE_CATEGORIES = {
    "过热停止生长正常完成" => "SEED-OVERHEAT",
    "增长模拟触发异常" => "SEED-ABNORMAL",
    "实验记录回滚重算" => "SEED-ROLLBACK"
  }.freeze

  def index
    @sessions = GameSession.includes(:growth_histories, :contamination_results, :operation_details)
                          .order(created_at: :desc)
                          .limit(30)
    @sample_categories = SAMPLE_CATEGORIES
  end

  def show
    @session = GameSession.includes(:growth_histories, :contamination_results, :operation_details)
                         .find(params[:id])
    @timeline = build_timeline(@session)
    @sample_categories = SAMPLE_CATEGORIES
  end

  private

  def build_timeline(session)
    events = []
    session.growth_histories.order(:round_number).each do |h|
      events << {
        round: h.round_number,
        type: :growth,
        label: h.event_type_label,
        description: h.event_description,
        data: h,
        created_at: h.created_at
      }
    end
    session.contamination_results.order(:round_number).each do |c|
      events << {
        round: c.round_number,
        type: :contamination,
        label: "污染事件：#{c.contaminant_name}",
        description: c.event_description,
        severity: c.severity,
        data: c,
        created_at: c.created_at
      }
    end
    session.operation_details.order(:round_number, :created_at).each do |op|
      events << {
        round: op.round_number,
        type: :operation,
        label: op.operation_label,
        description: op.operation_note,
        data: op,
        created_at: op.created_at
      }
    end
    events.sort_by! { |e| [e[:round], e[:created_at]] }
  end
end
