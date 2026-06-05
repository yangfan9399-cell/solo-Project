require_relative "boot"

require "rails/all"

Bundler.require(*Rails.groups)

module AutoRepair
  class Application < Rails::Application
    config.load_defaults 8.0
    config.time_zone = "Beijing"
    config.i18n.default_locale = :zh
  end
end
