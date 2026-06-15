class GameSessionsController < ApplicationController
  before_action :set_game_session, only: [
    :show, :adjust_temperature, :add_nutrient, :adjust_moisture, :adjust_ph,
    :place_antibiotic, :simulate_growth, :simulate_contamination, :finalize,
    :rollback, :recalculate, :colony_map, :contamination_diff, :batch_comparison
  ]

  def index
    scope = GameSession.order(created_at: :desc)
    scope = scope.where(status: params[:status]) if params[:status].present?
    scope = scope.where("batch_tag LIKE ?", "%#{params[:batch_tag]}%") if params[:batch_tag].present?
    limit = (params[:per] || 50).to_i
    @game_sessions = scope.limit(limit).to_a
  end

  def batch_comparison_list
    @batch_groups = GameSession.where.not(batch_tag: [nil, ""])
                               .order(created_at: :desc)
                               .group_by(&:batch_tag)
  end

  def new
    @game_session = GameSession.new
    @strains = GameSession::STRAINS.map { |id, s| [s[:name], id, s] }
  end

  def create
    @game_session = GameSession.new(game_session_params)
    @game_session.status = :initialized

    if @game_session.save
      redirect_to @game_session, notice: "培养皿已准备就绪，开始实验吧！"
    else
      @strains = GameSession::STRAINS.map { |id, s| [s[:name], id, s] }
      render :new, status: :unprocessable_entity
    end
  end

  def show
    @engine = GameEngine.new(@game_session)
    @temp_factor = @engine.calculate_temperature_factor
    @moisture_factor = @engine.calculate_moisture_factor
    @ph_factor = @engine.calculate_ph_factor
    @strain_info = @game_session.target_strain_info
    @histories = @game_session.growth_histories.order(round_number: :desc).limit(10)
    @contaminations = @game_session.contamination_results.detected.order(round_number: :desc).limit(5)
    @operations = @game_session.operation_details.order(round_number: :desc, created_at: :desc).limit(15)
  end

  def adjust_temperature
    adjustment = params[:temperature].to_f
    return redirect_to @game_session, alert: "温度调整幅度无效" if adjustment.abs > 10

    engine = GameEngine.new(@game_session)
    new_temp = [(@game_session.temperature.to_f + adjustment).round(2), 10.0, 60.0].sort[1]
    actual_adjustment = (new_temp - @game_session.temperature.to_f).round(2)

    OperationDetail.create!(
      game_session: @game_session,
      round_number: @game_session.current_round,
      operation_type: :adjust_temperature,
      temperature_adjustment: actual_adjustment,
      operation_note: "温度调整 #{actual_adjustment > 0 ? '+' : ''}#{actual_adjustment}°C → #{new_temp}°C",
      executed_at: Time.current
    )

    @game_session.temperature = new_temp
    @game_session.save!

    redirect_to @game_session, notice: "温度已调整为 #{new_temp}°C"
  end

  def add_nutrient
    amount = params[:amount].to_f
    return redirect_to @game_session, alert: "营养添加量无效" if amount <= 0 || amount > 50

    OperationDetail.create!(
      game_session: @game_session,
      round_number: @game_session.current_round,
      operation_type: :add_nutrient,
      nutrient_adjustment: amount.round(2),
      operation_note: "添加营养 #{amount} 单位",
      executed_at: Time.current
    )

    @game_session.current_nutrient_level = (@game_session.current_nutrient_level.to_f + amount).round(2)
    @game_session.save!

    redirect_to @game_session, notice: "已补充 #{amount} 单位营养"
  end

  def adjust_moisture
    adjustment = params[:moisture].to_f
    return redirect_to @game_session, alert: "水分调整幅度无效" if adjustment.abs > 30

    engine = GameEngine.new(@game_session)
    last_moisture = @game_session.operation_details
                                .where(operation_type: [:adjust_moisture, :simulate_growth])
                                .order(round_number: :desc).first
    current_moisture = last_moisture&.moisture_level || 50.0
    new_moisture = [(current_moisture + adjustment).round(2), 0.0, 100.0].sort[1]
    actual_adjustment = (new_moisture - current_moisture).round(2)

    OperationDetail.create!(
      game_session: @game_session,
      round_number: @game_session.current_round,
      operation_type: :adjust_moisture,
      moisture_adjustment: actual_adjustment,
      moisture_level: new_moisture,
      operation_note: "水分调整 #{actual_adjustment > 0 ? '+' : ''}#{actual_adjustment}% → #{new_moisture}%",
      executed_at: Time.current
    )

    redirect_to @game_session, notice: "水分已调整为 #{new_moisture}%"
  end

  def adjust_ph
    adjustment = params[:ph].to_f
    return redirect_to @game_session, alert: "pH调整幅度无效" if adjustment.abs > 2

    new_ph = [(@game_session.ph_level.to_f + adjustment).round(2), 3.0, 11.0].sort[1]
    actual_adjustment = (new_ph - @game_session.ph_level.to_f).round(2)

    OperationDetail.create!(
      game_session: @game_session,
      round_number: @game_session.current_round,
      operation_type: :adjust_ph,
      ph_adjustment: actual_adjustment,
      operation_note: "pH调整 #{actual_adjustment > 0 ? '+' : ''}#{actual_adjustment} → #{new_ph}",
      executed_at: Time.current
    )

    @game_session.ph_level = new_ph
    @game_session.save!

    redirect_to @game_session, notice: "pH 已调整为 #{new_ph}"
  end

  def place_antibiotic
    x = params[:x].to_i
    y = params[:y].to_i
    radius = params[:radius].to_f
    ab_type = params[:type] || "weak"
    radius_map = { "weak" => 2.5, "medium" => 3.5, "strong" => 4.5 }
    effective_radius = radius_map[ab_type] || radius_map["weak"]

    return redirect_to @game_session, alert: "位置无效" if x < 0 || x >= GameSession::GRID_SIZE || y < 0 || y >= GameSession::GRID_SIZE

    OperationDetail.create!(
      game_session: @game_session,
      round_number: @game_session.current_round,
      operation_type: :place_antibiotic,
      antibiotic_radius: effective_radius,
      antibiotic_position_x: x,
      antibiotic_position_y: y,
      antibiotic_type: ab_type,
      operation_note: "放置抑菌圈(#{ab_type}) @ [#{x}, #{y}] 半径#{effective_radius}",
      executed_at: Time.current
    )

    redirect_to @game_session, notice: "抑菌圈已放置 [#{x}, #{y}]"
  end

  def simulate_growth
    if @game_session.current_round >= @game_session.max_rounds
      return redirect_to @game_session, alert: "已达到最大回合数，请结算实验"
    end

    next_round = @game_session.current_round + 1
    engine = GameEngine.new(@game_session)

    moisture_level = 50.0
    last_moisture = @game_session.operation_details.where(operation_type: [:adjust_moisture, :simulate_growth]).order(round_number: :desc).first
    moisture_level = last_moisture&.moisture_level || 50.0

    OperationDetail.create!(
      game_session: @game_session,
      round_number: next_round,
      operation_type: :simulate_growth,
      moisture_level: moisture_level,
      operation_note: "第 #{next_round} 轮生长模拟",
      executed_at: Time.current
    )

    result = engine.simulate_growth!(next_round)

    if rand < 0.25 || next_round % 5 == 0
      engine = GameEngine.new(@game_session)
      contamination = engine.simulate_contamination!(next_round)
    end

    notice = if result[:overheated]
               "⚠️ 温度异常！第 #{next_round} 轮菌落生长停止"
             elsif result[:growth_stopped]
               "⚠️ 第 #{next_round} 轮：生长条件不满足，停止生长"
             else
               "第 #{next_round} 轮完成：覆盖率 #{result[:coverage]}%，目标区域 #{result[:zone_coverage]}%"
             end
    notice += " 🔬 检测到污染！" if contamination && contamination[:detected]

    redirect_to @game_session, notice: notice
  end

  def simulate_contamination
    contaminant_id = params[:contaminant_id]&.to_i
    engine = GameEngine.new(@game_session)
    round = @game_session.current_round > 0 ? @game_session.current_round : 1
    result = engine.simulate_contamination!(round, contaminant_id)

    if result[:detected]
      redirect_to @game_session, notice: "🔬 污染实验：#{result[:contaminant].contaminant_name} 入侵成功，#{result[:contaminant_cells].size} 个细胞"
    else
      redirect_to @game_session, alert: "污染模拟失败"
    end
  end

  def finalize
    engine = GameEngine.new(@game_session)
    engine.finalize_settlement!

    details = @game_session.settlement_details_hash
    score = @game_session.final_score

    outcome_label = case details["outcome"]
                    when "success" then "🎉 实验成功！"
                    when "partial" then "✅ 部分成功"
                    else "❌ 实验失败"
                    end

    redirect_to @game_session, notice: "#{outcome_label} 总分：#{score} 分"
  end

  def rollback
    target_round = params[:round].to_i
    engine = GameEngine.new(@game_session)

    if engine.rollback_to_round!(target_round)
      OperationDetail.create!(
        game_session: @game_session,
        round_number: target_round,
        operation_type: :rollback,
        operation_note: "回滚至第 #{target_round} 轮",
        executed_at: Time.current
      )
      redirect_to @game_session, notice: "已回滚至第 #{target_round} 轮"
    else
      redirect_to @game_session, alert: "回滚失败：无效的回合数"
    end
  end

  def recalculate
    if @game_session.rolled_back? || params[:force]
      engine = GameEngine.new(@game_session)
      (@game_session.current_round + 1..@game_session.max_rounds).each do |r|
        break if r > @game_session.max_rounds
        result = engine.simulate_growth!(r)
        break if result[:overheated]
      end
      engine.finalize_settlement!

      OperationDetail.create!(
        game_session: @game_session,
        round_number: @game_session.current_round,
        operation_type: :recalculate,
        operation_note: "重新计算至 #{@game_session.current_round} 轮并结算",
        executed_at: Time.current
      )
      redirect_to @game_session, notice: "已重新计算并结算，得分 #{@game_session.final_score}"
    else
      redirect_to @game_session, alert: "仅回滚状态可以重算，或使用 force=true 强制"
    end
  end

  def colony_map
    @histories = @game_session.growth_histories.order(:round_number)
    @coverage_data = @histories.pluck(:round_number, :target_coverage, :target_zone_coverage)
    @factor_data = @histories.map { |h| [h.round_number, h.temperature_factor, h.moisture_factor, h.antibiotic_factor] }
  end

  def contamination_diff
    @contamination = @game_session.contamination_results.find(params[:contamination_id]) if params[:contamination_id]
    @contaminations = @game_session.contamination_results.detected.order(round_number: :asc)
  end

  def batch_comparison
    compare_ids = [@game_session.id]
    compare_ids += params[:compare_with]&.map(&:to_i) || []
    @sessions = GameSession.where(id: compare_ids.uniq).includes(:growth_histories, :contamination_results, :operation_details)
    @comparison_data = build_comparison_data(@sessions)
  end

  private

  def set_game_session
    @game_session = GameSession.find(params[:id])
  end

  def game_session_params
    params.require(:game_session).permit(
      :player_name, :target_strain_id, :initial_nutrient_level,
      :temperature, :ph_level, :max_rounds, :target_coverage, :batch_tag, :notes
    )
  end

  def build_comparison_data(sessions)
    sessions.map do |s|
      histories = s.growth_histories.order(:round_number)
      settlement = s.settlement_details_hash
      scores = settlement['score_breakdown'] || {}
      {
        id: s.id,
        code: s.session_code || "UNKNOWN-#{s.id}",
        label: "#{s.session_code} #{s.batch_tag.present? ? "(#{s.batch_tag})" : ''}",
        strain: s.target_strain_info[:name] || '未知菌株',
        status: s.status || 'initialized',
        score: s.final_score.present? ? s.final_score.to_f.round(2) : nil,
        coverage_series: histories.pluck(:round_number, :target_coverage).map{|r,c| [r.to_i, c.to_f]},
        zone_series: histories.pluck(:round_number, :target_zone_coverage).map{|r,z| [r.to_i, z.to_f]},
        max_coverage: (histories.maximum(:target_coverage) || 0).to_f,
        max_zone: (histories.maximum(:target_zone_coverage) || 0).to_f,
        rounds: s.current_round.to_i,
        contaminations: s.contamination_results.detected.count,
        details: settlement
      }
    end
  end
end
