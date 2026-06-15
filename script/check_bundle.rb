rails_gem = Gem.loaded_specs["rails"]
puma_gem = Gem.loaded_specs["puma"]
sqlite_gem = Gem.loaded_specs["sqlite3"]

puts "Rails gem 路径: #{rails_gem.full_gem_path}"
puts "Puma gem 路径:  #{puma_gem.full_gem_path}"
puts "SQLite3 gem 路径: #{sqlite_gem.full_gem_path}"
puts ""
puts "Bundler 路径: #{Bundler.bundle_path}"
puts "Gemfile 路径: #{Bundler.default_gemfile}"
puts ""

uses_local = rails_gem.full_gem_path.include?("vendor/bundle")
puts "是否使用本地 vendor/bundle: #{uses_local ? '✅ 是' : '❌ 否'}"

unless uses_local
  puts "⚠️  警告: 没有使用项目本地 gems!"
  exit 1
end
