require_relative "boot"

require "rails/all"

Bundler.require(*Rails.groups)

module CopyrightPlatform
  class Application < Rails::Application
    config.load_defaults 8.0

    config.autoload_paths << Rails.root.join("app", "services")
    config.autoload_paths << Rails.root.join("app", "policies")

    config.active_storage.service = :local

    config.i18n.default_locale = :zh
    config.time_zone = "Asia/Shanghai"
  end
end