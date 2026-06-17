require "net/http"
require "uri"

BASE = "http://127.0.0.1:3000"

def fetch(uri, cookie = nil)
  req = Net::HTTP::Get.new(URI(uri))
  req["Cookie"] = cookie if cookie
  Net::HTTP.start(URI(uri).hostname, URI(uri).port) { |http| http.request(req) }
end

def post_form(uri, params, cookie, token)
  req = Net::HTTP::Post.new(URI(uri))
  req["Cookie"] = cookie
  req["Content-Type"] = "application/x-www-form-urlencoded"
  req["X-CSRF-Token"] = token
  req.body = URI.encode_www_form(params)
  Net::HTTP.start(URI(uri).hostname, URI(uri).port) { |http| http.request(req) }
end

resp = fetch("#{BASE}/projects/1/components/1")
cookie = resp["Set-Cookie"]&.split(";")&.first || ""
token = resp.body.match(/name="authenticity_token" value="([^"]+)"/)&.[](1)

if !token
  token_match = resp.body.scan(/authenticity_token.*?value="([^"]+)"/)
  token = token_match.last&.first
end

puts "=== Test: Reassembly check inline form ==="
puts "Got token: #{token ? 'yes' : 'no'}"

if token
  resp = post_form("#{BASE}/projects/1/components/1/reassembly_check", {
    "checked_by" => "赵工",
    "result" => "需调整",
    "notes" => "内联表单提交测试"
  }, cookie, token)
  puts "HTTP #{resp.code} -> #{resp["Location"] || resp.message}"
  if resp.code == "302"
    puts "OK: Inline reassembly check works!"
  else
    puts "FAIL: Expected 302"
    puts resp.body[0..500] if resp.code != "302"
  end
else
  puts "FAIL: No token"
end

puts ""
puts "=== Test: Version rollback ==="
resp = fetch("#{BASE}/projects/1/components/1", cookie)
token2 = resp.body.scan(/authenticity_token.*?value="([^"]+)"/).last&.first
puts "Got token: #{token2 ? 'yes' : 'no'}"

if token2
  resp = post_form("#{BASE}/projects/1/components/1/rollback", {
    "version_number" => "1"
  }, cookie, token2)
  puts "HTTP #{resp.code} -> #{resp["Location"] || resp.message}"
  if resp.code == "302"
    puts "OK: Version rollback works!"
  else
    puts "FAIL: Expected 302"
  end
end

puts ""
puts "=== Test: Update component via form ==="
resp = fetch("#{BASE}/projects/1/components/1/edit", cookie)
token3 = resp.body.match(/name="authenticity_token" value="([^"]+)"/)&.[](1)
puts "Got token: #{token3 ? 'yes' : 'no'}"

if token3
  resp = post_form("#{BASE}/projects/1/components/1", {
    "_method" => "patch",
    "component[code]" => "L-001",
    "component[component_type]" => "梁",
    "component[status]" => "待复装",
    "component[orientation]" => "东",
    "component[position]" => "明间东缝五架梁",
    "component[batch_tag]" => "BATCH-A",
    "component[material]" => "楠木",
    "component[layer]" => "3",
    "component[notes]" => "编辑测试后更新"
  }, cookie, token3)
  puts "HTTP #{resp.code} -> #{resp["Location"] || resp.message}"
  if resp.code == "302"
    puts "OK: Component update works!"
  else
    puts "FAIL: Expected 302"
  end
end

puts ""
puts "All HTTP tests completed!"
