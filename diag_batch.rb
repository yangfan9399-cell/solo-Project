#!/usr/bin/env ruby
require_relative "config/environment"

s = GameSession.find(1)
compare_ids = [1, 2, 3]
sessions = GameSession.where(id: compare_ids).includes(:growth_histories, :contamination_results, :operation_details)

def build_comparison_data(sessions)
  sessions.map do |s|
    histories = s.growth_histories.order(:round_number)
    {
      id: s.id,
      code: s.session_code,
      label: "#{s.session_code} #{s.batch_tag.present? ? "(#{s.batch_tag})" : ''}",
      strain: s.target_strain_info[:name],
      status: s.status,
      score: s.final_score,
      coverage_series: histories.pluck(:round_number, :target_coverage),
      zone_series: histories.pluck(:round_number, :target_zone_coverage),
      max_coverage: histories.maximum(:target_coverage) || 0,
      max_zone: histories.maximum(:target_zone_coverage) || 0,
      rounds: s.current_round,
      contaminations: s.contamination_results.detected.count,
      details: s.settlement_details_hash
    }
  end
end

data = build_comparison_data(sessions)
puts "数据条数: #{data.size}"
data.each do |d|
  puts "--- #{d[:code]} ---"
  puts "  score: #{d[:score].inspect} (#{d[:score].class})"
  puts "  rounds: #{d[:rounds].inspect} (#{d[:rounds].class})"
  puts "  max_coverage: #{d[:max_coverage].inspect} (#{d[:max_coverage].class})"
  puts "  max_zone: #{d[:max_zone].inspect} (#{d[:max_zone].class})"
  puts "  details keys: #{d[:details].keys}"
  scores = d[:details]['score_breakdown'] || {}
  puts "  scores: #{scores.inspect}"
end

# 尝试复现第140行的计算
puts "\n尝试计算雷达图维度..."
begin
  data.each do |d|
    scores = d[:details]['score_breakdown'] || {}
    values = [
      (scores['coverage'] || 0).to_f / 40,
      (scores['target_zone'] || 0).to_f / 30,
      (scores['efficiency'] || 0).to_f / 20,
      (scores['cleanliness'] || 0).to_f / 10,
      d[:max_coverage].to_f / 100,
      d[:rounds].to_f / [d[:rounds],20].max
    ]
    puts "  #{d[:code]}: #{values.inspect}"
  end
  puts "✅ 雷达值计算成功"
rescue => e
  puts "❌ 雷达值计算失败: #{e.message}"
  puts e.backtrace.first(5).join("\n")
end

# 尝试 best/worst 比较
puts "\n尝试比较..."
begin
  best = data.max_by { |d| d[:score].to_f }
  worst = data.min_by { |d| d[:score].to_f }
  puts "best: #{best[:code]} #{best[:score]}"
  puts "worst: #{worst[:code]} #{worst[:score]}"
  diff = (best[:max_coverage] - worst[:max_coverage]).round(2)
  puts "覆盖率差: #{diff}"
  puts "✅ 比较成功"
rescue => e
  puts "❌ 比较失败: #{e.message}"
  puts e.backtrace.first(5).join("\n")
end
