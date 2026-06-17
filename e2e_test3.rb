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

def post_form(uri, params, cookie, token)
  uri_obj = URI(uri)
  req = Net::HTTP::Post.new(uri_obj)
  req["Cookie"] = cookie
  req["Content-Type"] = "application/x-www-form-urlencoded"
  req["X-CSRF-Token"] = token
  req["Accept"] = "text/html"
  req.body = URI.encode_www_form(params)
  Net::HTTP.start(uri_obj.hostname, uri_obj.port) { |http| http.request(req) }
end

puts "=== Fetch component show page ==="
resp, cookie = fetch("#{BASE}/projects/1/components/1")
puts "HTTP #{resp.code}, cookie=#{cookie[0..30]}..."

all_tokens = resp.body.scan(/name="authenticity_token" value="([^"]+)"/)
puts "Found #{all_tokens.length} authenticity tokens on page"

form_token = resp.body.match(/id="reassembly-form".*?authenticity_token" value="([^"]+)"/m)&.[](1)
puts "Reassembly form token: #{form_token ? form_token[0..20] + '...' : 'NOT FOUND'}"

if form_token
  puts ""
  puts "=== Test: Reassembly check inline form with form-specific token ==="
  resp = post_form("#{BASE}/projects/1/components/1/reassembly_check", {
    "checked_by" => "赵工",
    "result" => "需调整",
    "notes" => "内联表单提交测试"
  }, cookie, form_token)
  puts "HTTP #{resp.code}"
  if resp.code == "302"
    puts "OK: Inline reassembly check works with correct token!"
  else
    puts "FAIL: #{resp.message}"
    if resp.code == "422"
      if resp.body.include?("Can't verify CSRF token")
        puts "  -> CSRF token mismatch"
      elsif resp.body.include?("param")
        puts "  -> Parameter error"
        error_match = resp.body.match(/param is missing or the value is empty: (\w+)/)
        puts "  -> Missing param: #{error_match[1]}" if error_match
      end
    end
  end
end

puts ""
puts "=== Test: Use first token from page for reassembly check ==="
first_token = all_tokens.first&.first
if first_token && first_token != form_token
  resp = post_form("#{BASE}/projects/1/components/1/reassembly_check", {
    "checked_by" => "钱工",
    "result" => "一致",
    "notes" => "使用页面第一个token测试"
  }, cookie, first_token)
  puts "HTTP #{resp.code}"
  if resp.code == "302"
    puts "OK: Works with first token too!"
  else
    puts "Result: #{resp.code} - #{resp.message}"
  end
end

puts ""
puts "Done!"
