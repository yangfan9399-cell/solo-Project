#!/usr/bin/env ruby
# frozen_string_literal: true

# = 评审表单失败回显验证脚本
#
# 验证内容：
# 1. 表单提交失败时，issues 字段是否保留已选值
# 2. 视图层 selected_issue_types 提取逻辑是否正确
# 3. 空状态提示逻辑
#
# 运行方式: bin/rails runner scripts/verify_form_echo.rb

puts "=" * 60
puts "评审表单失败回显验证"
puts "=" * 60
puts

sample = Sample.find_by(style_number: "S2024-004")
reviewer = User.reviewer.first

# ========================================
# 测试1: 模拟控制器 create 动作失败时的状态
# ========================================
puts "[测试1] 控制器失败时的 issues 保留"
puts "-" * 40

# 模拟从 params 解析 issues 的过程
require "action_controller"
mock_params = ActionController::Parameters.new(
  review: {
    verdict: "revise",
    feedback: "",  # 空反馈，触发验证失败
    sample_version_id: sample.current_version.id,
    issues: [
      { type: "尺码偏小" },
      { type: "面料起球" },
      { type: "肩部不合" }
    ]
  }
)

# 模拟 review_params 提取
permitted_params = mock_params.require(:review).permit(
  :verdict,
  :feedback,
  :sample_version_id,
  issues: [:type]
)

# 模拟 parse_issues
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

parsed_issues = parse_issues(permitted_params[:issues])

puts "参数解析结果: #{parsed_issues.inspect}"
test1a = parsed_issues.length == 3 &&
         parsed_issues.all? { |i| i.is_a?(Hash) && i["type"].present? }
puts "解析格式正确: #{test1a ? '✅ 通过' : '❌ 失败'}"

# 构建 review 对象（不保存）
review = sample.all_reviews.build(
  verdict: permitted_params[:verdict],
  feedback: permitted_params[:feedback],
  reviewer: reviewer,
  sample_version: sample.current_version,
  issues: parsed_issues
)

# 验证不通过
is_valid = review.valid?
puts "验证结果: #{is_valid ? '通过（不符合预期）' : '失败（符合预期）'}"
test1b = !is_valid && review.errors[:feedback].present?
puts "反馈必填验证生效: #{test1b ? '✅ 通过' : '❌ 失败'}"

puts "回显 issues: #{review.issues.inspect}"
test1c = review.issues.is_a?(Array) && review.issues.length == 3
puts "回显 issues 数量正确: #{test1c ? '✅ 通过' : '❌ 失败'}"
puts

# ========================================
# 测试2: 视图层 selected_issue_types 提取逻辑
# ========================================
puts "[测试2] 视图层问题类型提取逻辑"
puts "-" * 40

# 模拟视图中的提取逻辑
selected_issue_types = review.issues.to_a.map { |i|
  i.is_a?(Hash) ? i["type"] : i.to_s
}.compact_blank

puts "提取的问题类型: #{selected_issue_types.inspect}"

expected_types = ["尺码偏小", "面料起球", "肩部不合"]
test2a = selected_issue_types == expected_types
puts "提取结果正确: #{test2a ? '✅ 通过' : '❌ 失败'}"

# 测试 checkbox 选中判断
all_issue_types = IssueType.all.pluck(:name)
selected_count = all_issue_types.count { |name| selected_issue_types.include?(name) }
puts "可匹配的问题类型数量: #{selected_count}"
test2b = selected_count == 3
puts "选中判断正确: #{test2b ? '✅ 通过' : '❌ 失败'}"
puts

# ========================================
# 测试3: 边界情况
# ========================================
puts "[测试3] 边界情况"
puts "-" * 40

# 空 issues
review_empty = sample.all_reviews.build(
  verdict: "pass",
  feedback: "",
  reviewer: reviewer,
  sample_version: sample.current_version,
  issues: []
)
selected_empty = review_empty.issues.to_a.map { |i|
  i.is_a?(Hash) ? i["type"] : i.to_s
}.compact_blank
puts "空数组: #{selected_empty.inspect}"
test3a = selected_empty == []
puts "空数组处理正确: #{test3a ? '✅ 通过' : '❌ 失败'}"

# nil issues
review_nil = sample.all_reviews.build(
  verdict: "pass",
  feedback: "",
  reviewer: reviewer,
  sample_version: sample.current_version
)
selected_nil = review_nil.issues.to_a.map { |i|
  i.is_a?(Hash) ? i["type"] : i.to_s
}.compact_blank
puts "nil 值: #{selected_nil.inspect}"
test3b = selected_nil == []
puts "nil 处理正确: #{test3b ? '✅ 通过' : '❌ 失败'}"

# 混合格式（字符串 + Hash）
mixed_issues = [
  { "type" => "尺码偏大" },
  "版型宽松",
  { "type" => "" },
  nil
]
selected_mixed = mixed_issues.compact.map { |i|
  i.is_a?(Hash) ? i["type"] : i.to_s
}.compact_blank
puts "混合格式: #{selected_mixed.inspect}"
test3c = selected_mixed == ["尺码偏大", "版型宽松"]
puts "混合格式处理正确: #{test3c ? '✅ 通过' : '❌ 失败'}"
puts

# ========================================
# 测试4: 空状态提示
# ========================================
puts "[测试4] 问题类型数据状态"
puts "-" * 40

issue_types_count = IssueType.count
puts "问题类型总数: #{issue_types_count}"
puts "分类数: #{IssueType.distinct.count(:category)}"
puts "各分类: #{IssueType.group(:category).count.keys.join(', ')}"
test4 = issue_types_count > 0
puts "问题类型数据存在: #{test4 ? '✅ 通过' : '❌ 失败'}"
puts

# ========================================
# 汇总
# ========================================
all_passed = test1a && test1b && test1c &&
             test2a && test2b &&
             test3a && test3b && test3c &&
             test4

puts "=" * 60
puts "验证汇总"
puts "=" * 60
puts
puts "测试1 - 控制器失败回显: #{test1a && test1b && test1c ? '✅ 全部通过' : '❌ 部分失败'}"
puts "  ├── 参数解析: #{test1a ? '✅ 通过' : '❌ 失败'}"
puts "  ├── 验证生效: #{test1b ? '✅ 通过' : '❌ 失败'}"
puts "  └── 回显保留: #{test1c ? '✅ 通过' : '❌ 失败'}"
puts
puts "测试2 - 视图层提取逻辑: #{test2a && test2b ? '✅ 全部通过' : '❌ 部分失败'}"
puts "  ├── 类型提取: #{test2a ? '✅ 通过' : '❌ 失败'}"
puts "  └── 选中判断: #{test2b ? '✅ 通过' : '❌ 失败'}"
puts
puts "测试3 - 边界情况: #{test3a && test3b && test3c ? '✅ 全部通过' : '❌ 部分失败'}"
puts "  ├── 空数组: #{test3a ? '✅ 通过' : '❌ 失败'}"
puts "  ├── nil 值: #{test3b ? '✅ 通过' : '❌ 失败'}"
puts "  └── 混合格式: #{test3c ? '✅ 通过' : '❌ 失败'}"
puts
puts "测试4 - 数据状态: #{test4 ? '✅ 通过' : '❌ 失败'}"
puts
if all_passed
  puts "🎉 全部验证通过！表单失败回显功能正常工作。"
else
  puts "⚠️  部分验证失败，请检查代码。"
end
puts "=" * 60
