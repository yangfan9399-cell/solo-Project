require "net/http"
require "uri"

BASE = "http://127.0.0.1:3000"

def fetch(uri, cookie = nil)
  req = Net::HTTP::Get.new(URI(uri))
  req["Cookie"] = cookie if cookie
  resp = Net::HTTP.start(URI(uri).hostname, URI(uri).port) { |http| http.request(req) }
  new_cookie = resp["Set-Cookie"]&.split(";")&.first
  cookie = new_cookie if new_cookie
  [resp, cookie]
end

def submit_form(uri, params, cookie, token, method = nil)
  uri_obj = URI(uri)
  if method
    req = Net::HTTP::Post.new(uri_obj)
  else
    req = Net::HTTP::Post.new(uri_obj)
  end
  req["Cookie"] = cookie
  req["Content-Type"] = "application/x-www-form-urlencoded"
  req["X-CSRF-Token"] = token
  req["Accept"] = "text/html"
  req.body = URI.encode_www_form(params)
  Net::HTTP.start(uri_obj.hostname, uri_obj.port) { |http| http.request(req) }
end

puts "=== Test: Edit defect ==="
resp, cookie = fetch("#{BASE}/projects/1/components/1/defects/1/edit")
puts "Edit page HTTP #{resp.code}"
token = resp.body.match(/name="authenticity_token" value="([^"]+)"/)&.[](1)
if token && resp.code == "200"
  resp = submit_form("#{BASE}/projects/1/components/1/defects/1", {
    "_method" => "patch",
    "defect[defect_type]" => "开裂",
    "defect[severity]" => "严重",
    "defect[description]" => "E2E编辑测试-纵向裂缝",
    "defect[location_on_component]" => "梁中段",
    "defect[discovered_at]" => "2026-06-18",
    "defect[repaired]" => "1",
    "defect[repaired_at]" => "2026-06-18",
    "defect[repair_notes]" => "已用传统方法修补"
  }, cookie, token)
  puts "Update HTTP #{resp.code}"
  if resp.code == "302"
    puts "OK: Defect edit works!"
  else
    puts "FAIL: #{resp.message}"
  end
else
  puts "FAIL: Could not get edit page or token"
end

puts ""
puts "=== Test: Create project ==="
resp, cookie = fetch("#{BASE}/projects/new")
token2 = resp.body.match(/name="authenticity_token" value="([^"]+)"/)&.[](1)
if token2
  resp = submit_form("#{BASE}/projects", {
    "project[name]" => "E2E测试项目",
    "project[code]" => "E2E-TEST-001",
    "project[building_type]" => "殿堂",
    "project[era]" => "清代",
    "project[location]" => "测试地点",
    "project[status]" => "普查中",
    "project[description]" => "E2E创建项目测试"
  }, cookie, token2)
  puts "Create project HTTP #{resp.code}"
  if resp.code == "302"
    puts "OK: Project creation works!"
  else
    puts "FAIL: #{resp.message}"
  end
end

puts ""
puts "All E2E tests completed!"
