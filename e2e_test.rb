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

puts "=== Step 0: Get CSRF token ==="
resp = fetch("#{BASE}/projects/1/components/new")
cookie = resp["Set-Cookie"]&.split(";")&.first || ""
token = resp.body.match(/name="authenticity_token" value="([^"]+)"/)&.[](1)
if token
  puts "OK: Got CSRF token"
else
  puts "FAIL: Could not get CSRF token"
  exit 1
end

puts ""
puts "=== Step 1: Create component via POST ==="
resp = post_form("#{BASE}/projects/1/components", {
  "component[code]" => "E2E-001",
  "component[component_type]" => "柱",
  "component[status]" => "在原位",
  "component[orientation]" => "南",
  "component[position]" => "明间正中南柱",
  "component[batch_tag]" => "BATCH-E2E",
  "component[material]" => "松木",
  "component[layer]" => "1",
  "component[notes]" => "端到端测试构件"
}, cookie, token)
puts "HTTP #{resp.code} -> #{resp["Location"] || resp.message}"
if resp.code == "302"
  puts "OK: Component created, redirect to #{resp["Location"]}"
  new_component_url = resp["Location"]
else
  puts "FAIL: Expected 302 redirect"
  puts resp.body[0..500] if resp.code == "422"
end

puts ""
puts "=== Step 2: Get new token for defect form ==="
resp = fetch("#{BASE}/projects/1/components", cookie)
token2 = resp.body.match(/name="authenticity_token" value="([^"]+)"/)&.[](1)
if token2
  puts "OK: Got CSRF token #2"
else
  puts "FAIL: Could not get second CSRF token"
end

puts ""
puts "=== Step 3: Get defect form ==="
resp = fetch("#{BASE}/projects/1/components/1/defects/new", cookie)
token3 = resp.body.match(/name="authenticity_token" value="([^"]+)"/)&.[](1)
if token3
  puts "OK: Got CSRF token #3"
else
  puts "FAIL: Could not get defect form CSRF token"
end

puts ""
puts "=== Step 4: Create defect via POST ==="
resp = post_form("#{BASE}/projects/1/components/1/defects", {
  "defect[defect_type]" => "虫蛀",
  "defect[severity]" => "中等",
  "defect[description]" => "柱根虫蛀痕迹",
  "defect[location_on_component]" => "柱根",
  "defect[discovered_at]" => "2026-06-18"
}, cookie, token3)
puts "HTTP #{resp.code} -> #{resp["Location"] || resp.message}"
if resp.code == "302"
  puts "OK: Defect created, redirect to #{resp["Location"]}"
else
  puts "FAIL: Expected 302 redirect"
  if resp.code == "422"
    if resp.body.include?("authenticity_token")
      puts "  (CSRF token mismatch - need fresh token per request)"
    end
  end
end

puts ""
puts "=== Step 5: Get reassembly record form ==="
resp = fetch("#{BASE}/projects/1/components/1/reassembly_records/new", cookie)
token4 = resp.body.match(/name="authenticity_token" value="([^"]+)"/)&.[](1)
if token4
  puts "OK: Got CSRF token #4"
  puts ""
  puts "=== Step 6: Create reassembly record via POST ==="
  resp = post_form("#{BASE}/projects/1/components/1/reassembly_records", {
    "reassembly_record[checked_by]" => "王工",
    "reassembly_record[result]" => "一致",
    "reassembly_record[notes]" => "E2E核对测试",
    "reassembly_record[checked_at]" => "2026-06-18T10:00:00"
  }, cookie, token4)
  puts "HTTP #{resp.code} -> #{resp["Location"] || resp.message}"
  if resp.code == "302"
    puts "OK: Reassembly record created"
  else
    puts "FAIL: Expected 302 redirect"
  end
else
  puts "FAIL: Could not get reassembly form CSRF token"
end

puts ""
puts "E2E HTTP tests completed!"
