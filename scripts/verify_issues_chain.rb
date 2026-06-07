#!/usr/bin/env ruby
# frozen_string_literal: true

# = 评审问题类型写入链路验证脚本
#
# 验证内容：
# 1. parse_issues 方法对 ActionController::Parameters 的处理
# 2. 评审记录创建后 issues 字段的保存格式
# 3. 详情页问题标签展示逻辑
# 4. 统计复盘问题类型聚合逻辑
#
# 运行方式: bin/rails runner scripts/verify_issues_chain.rb

require "action_controller"

puts "=" * 60
puts "评审问题类型写入链路验证"
puts "=" * 60
puts

# ========================================
# 测试1: 模拟 parse_issues 方法
# ========================================
puts "[测试1] parse_issues 参数解析测试"
puts "-" * 40

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

# 测试用例1: ActionController::Parameters 数组（真实表单提交格式）
ac_params = [
  ActionController::Parameters.new("type" => "尺码偏小"),
  ActionController::Parameters.new("type" => "面料起球"),
  ActionController::Parameters.new("type" => "肩部不合")
]
result1 = parse_issues(ac_params)
puts "用例1 - ActionController::Parameters 数组:"
puts "  输入: #{ac_params.inspect}"
puts "  输出: #{result1.inspect}"
test1_pass = result1.is_a?(Array) &&
             result1.length == 3 &&
             result1.all? { |r| r.is_a?(Hash) && r.key?("type") } &&
             result1.map { |r| r["type"] } == ["尺码偏小", "面料起球", "肩部不合"]
puts "  结果: #{test1_pass ? '✅ 通过' : '❌ 失败'}"
puts

# 测试用例2: 字符串数组（备用格式）
result2 = parse_issues(["尺码偏大", "版型宽松", ""])
puts "用例2 - 字符串数组(含空值):"
puts "  输入: [\"尺码偏大\", \"版型宽松\", \"\"]"
puts "  输出: #{result2.inspect}"
test2_pass = result2.is_a?(Array) &&
             result2.length == 2 &&
             result2.map { |r| r["type"] } == ["尺码偏大", "版型宽松"]
puts "  结果: #{test2_pass ? '✅ 通过' : '❌ 失败'}"
puts

# 测试用例3: nil 和空值
result3 = parse_issues(nil)
result4 = parse_issues([])
result5 = parse_issues("")
puts "用例3 - 空值处理:"
puts "  nil → #{result3.inspect}"
puts "  [] → #{result4.inspect}"
puts "  '' → #{result5.inspect}"
test3_pass = result3 == [] && result4 == [] && result5 == []
puts "  结果: #{test3_pass ? '✅ 通过' : '❌ 失败'}"
puts

# ========================================
# 测试2: 数据库创建测试评审
# ========================================
puts "[测试2] 数据库评审记录创建测试"
puts "-" * 40

sample = Sample.find_by(style_number: "S2024-004")
unless sample
  puts "❌ 未找到 S2024-004 样衣，跳过数据库测试"
else
  version = sample.current_version
  reviewer = User.reviewer.first

  puts "测试样衣: #{sample.style_number} (#{sample.category})"
  puts "当前版本: v#{version.version_number}"
  puts "评审人: #{reviewer.name}"
  puts

  # 创建测试评审
  test_issues = [
    { "type" => "尺码偏小" },
    { "type" => "面料起球" },
    { "type" => "肩部不合" }
  ]

  review = sample.all_reviews.build(
    verdict: :revise,
    feedback: "【验证脚本测试】尺码偏小二码，面料起球严重，肩部设计不合身。",
    reviewer: reviewer,
    sample_version: version,
    issues: test_issues
  )

  if review.save
    puts "✅ 评审记录创建成功"
    puts "  评审ID: #{review.id}"
    puts "  结论: #{review.verdict}"
    puts "  issues 类型: #{review.issues.class}"
    puts "  issues 内容: #{review.issues.inspect}"

    # 验证数据格式
    db_review = Review.find(review.id)
    test_db_pass = db_review.issues.is_a?(Array) &&
                   db_review.issues.length == 3 &&
                   db_review.issues.all? { |i| i.is_a?(Hash) && i["type"].present? }

    puts "  数据库重新读取验证: #{test_db_pass ? '✅ 通过' : '❌ 失败'}"
    puts

    # ========================================
    # 测试3: 详情页显示逻辑验证
    # ========================================
    puts "[测试3] 详情页问题标签显示逻辑验证"
    puts "-" * 40

    # 模拟详情页的显示逻辑
    display_tags = []
    if db_review.issues.present? && db_review.issues.is_a?(Array) && db_review.issues.any?
      db_review.issues.each do |issue|
        if issue.is_a?(Hash) && issue["type"].present?
          display_tags << issue["type"]
        elsif issue.is_a?(String)
          display_tags << issue
        end
      end
    end

    puts "显示标签: #{display_tags.inspect}"
    test_display_pass = display_tags == ["尺码偏小", "面料起球", "肩部不合"]
    puts "结果: #{test_display_pass ? '✅ 通过' : '❌ 失败'}"
    puts

    # ========================================
    # 测试4: 统计复盘聚合逻辑验证
    # ========================================
    puts "[测试4] 统计复盘问题类型聚合验证"
    puts "-" * 40

    # 模拟 analytics_controller 的 calculate_issue_type_stats 逻辑
    issue_counts = Hash.new(0)
    Review.includes(:sample).find_each do |r|
      Array(r.issues).each do |issue|
        type = issue.is_a?(Hash) ? issue["type"] : issue.to_s
        issue_counts[type] += 1 if type.present?
      end
    end

    sorted_counts = issue_counts.sort_by { |_, v| -v }.to_h

    puts "问题类型统计:"
    sorted_counts.each do |type, count|
      marker = type.in?(["尺码偏小", "面料起球", "肩部不合"]) ? " ← 新提交的" : ""
      puts "  #{type}: #{count}次#{marker}"
    end

    test_stats_pass = issue_counts["尺码偏小"] >= 1 &&
                      issue_counts["面料起球"] >= 1 &&
                      issue_counts["肩部不合"] >= 1
    puts
    puts "结果: #{test_stats_pass ? '✅ 通过 - 新评审数据已纳入统计' : '❌ 失败'}"
    puts

    # ========================================
    # 汇总
    # ========================================
    all_passed = test1_pass && test2_pass && test3_pass && test_db_pass && test_display_pass && test_stats_pass

    puts "=" * 60
    puts "验证汇总"
    puts "=" * 60
    puts
    puts "测试1 - 参数解析: #{test1_pass && test2_pass && test3_pass ? '✅ 全部通过' : '❌ 部分失败'}"
    puts "测试2 - 数据库保存: #{test_db_pass ? '✅ 通过' : '❌ 失败'}"
    puts "测试3 - 详情页显示: #{test_display_pass ? '✅ 通过' : '❌ 失败'}"
    puts "测试4 - 统计聚合: #{test_stats_pass ? '✅ 通过' : '❌ 失败'}"
    puts
    puts "新创建的评审ID: #{review.id}"
    puts "问题类型: #{display_tags.join(', ')}"
    puts
    if all_passed
      puts "🎉 全部验证通过！问题类型写入链路正常工作。"
    else
      puts "⚠️  部分验证失败，请检查代码。"
    end
    puts "=" * 60
  else
    puts "❌ 评审记录创建失败: #{review.errors.full_messages.join(', ')}"
  end
end
