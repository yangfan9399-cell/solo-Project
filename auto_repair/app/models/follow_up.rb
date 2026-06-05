class FollowUp < ApplicationRecord
  belongs_to :repair_order
  belongs_to :user, optional: true

  CONTACT_METHODS = %w[phone wechat sms email].freeze
  SATISFACTIONS = %w[very_satisfied satisfied neutral dissatisfied very_dissatisfied].freeze
end
