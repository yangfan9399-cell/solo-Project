require_relative "boot"

require "rails/all"

Bundler.require(*Rails.groups)

module FoodMaterialPlatform
  class Application < Rails::Application
    config.load_defaults 8.0
    config.autoload_lib(ignore: %w[assets tasks])
    config.i18n.default_locale = :"zh-CN"
    config.i18n.available_locales = [:"zh-CN"]
  end
end
