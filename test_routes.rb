#!/usr/bin/env ruby
require_relative "config/environment"
require "action_controller/test_case"

class RenderTest
  include ActionDispatch::Integration::Runner
  def app
    Rails.application
  end
end

test = RenderTest.new

puts "=" * 60
puts "🧪 直接模拟 HTTP 请求测试"
puts "=" * 60

tests = [
  ["首页", :get, "/"],
  ["实验大厅", :get, "/game_sessions"],
  ["新建实验", :get, "/game_sessions/new"],
  ["实验详情#1", :get, "/game_sessions/1"],
  ["实验详情#2", :get, "/game_sessions/2"],
  ["实验详情#3", :get, "/game_sessions/3"],
  ["实验时间线", :get, "/experiments"],
  ["时间线详情#1", :get, "/experiments/1"],
  ["菌株图鉴", :get, "/strains"],
  ["菌落图谱#1", :get, "/game_sessions/1/colony_map"],
  ["污染差异#2", :get, "/game_sessions/2/contamination_diff"],
  ["批次对比列表", :get, "/game_sessions/batch_comparison_list"],
  ["批次对比详情", :get, "/game_sessions/1/batch_comparison", {compare_with: [2,3]}],
]

pass = 0; fail = 0
tests.each do |name, method, path, params|
  begin
    test.send(method, path, params: params || {})
    code = test.response.status
    if code == 200
      puts "✅ [#{code}] #{name}"
      pass += 1
    else
      puts "❌ [#{code}] #{name}"
      # 找错误信息
      body = test.response.body
      err = body[/(NameError|undefined method|NoMethod|ArgumentError|SyntaxError|uninitialized constant|nil can't be coerced)[^<]{0,150}/]
      puts "     💥 #{err}" if err
      # 找具体行号
      if (idx = body.index(".html.erb:"))
        snippet = body[idx-30..idx+50]
        puts "     📍 #{snippet.gsub(/<[^>]+>/,'')}"
      end
      fail += 1
    end
  rescue => e
    puts "⚠️  [异常] #{name}: #{e.message[0..100]}"
    fail += 1
  end
end

puts ""
puts "=" * 60
puts "📊 最终结果: 通过 #{pass} / 失败 #{fail}"
puts "=" * 60
