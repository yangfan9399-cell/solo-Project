# Be sure to restart your server when you modify this file.

# Define your application's secret key base for signing cookies
Rails.application.secret_key_base = ENV.fetch("SECRET_KEY_BASE") { SecureRandom.hex(64) }
