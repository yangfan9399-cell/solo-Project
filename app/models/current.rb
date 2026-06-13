class Current < ActiveSupport::CurrentAttributes
  attribute :user
  attribute :request_id
  attribute :user_agent
  attribute :ip_address

  resets { Time.zone = nil }

  def user=(user)
    super
    Time.zone = user.respond_to?(:time_zone) ? (user&.time_zone || 'Beijing') : 'Beijing'
  end
end
