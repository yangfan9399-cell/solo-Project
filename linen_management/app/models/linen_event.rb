class LinenEvent < ApplicationRecord
  EVENT_TYPES = %w[
    created collected washed returned inspected disputed
    discrepancy_confirmed_hotel discrepancy_confirmed_laundry
    discrepancy_resolved claim_created claim_confirmed settled
  ].freeze

  belongs_to :linen_batch
  belongs_to :user

  validates :event_type, presence: true, inclusion: { in: EVENT_TYPES }
  validates :user, presence: true

  scope :chronological, -> { order(created_at: :asc) }
  scope :reverse_chronological, -> { order(created_at: :desc) }

  def event_type_name
    I18n.t("event_types.#{event_type}", default: event_type.humanize)
  end
end
