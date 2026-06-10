# Be sure to restart your server when you modify this file.

# Define your application's secret key
Rails.application.credentials.secret_key_base = "a" * 64 rescue nil

if Rails.root.join("config/master.key").exist?
  # Read from master key
  secret_key_base = File.read(Rails.root.join("config/master.key")).strip
else
  # Fallback for development
  secret_key_base = "development_secret_key_base_please_change_in_production"
end

Rails.application.configure do
  config.secret_key_base = secret_key_base
end