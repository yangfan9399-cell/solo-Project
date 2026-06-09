class DamageClaim < ApplicationRecord
  REASONS = %w[stained damaged shortage other].freeze

  belongs_to :linen_batch
  belongs_to :linen_type
  belongs_to :confirmed_by, class_name: 'User', optional: true

  validates :quantity, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validates :unit_price, presence: true, numericality: { greater_than: 0 }
  validates :total_amount, presence: true, numericality: { greater_than: 0 }
  validates :reason, presence: true, inclusion: { in: REASONS }
  validates :linen_type, uniqueness: { scope: [:linen_batch, :reason] }

  before_validation :calculate_total_amount

  scope :confirmed, -> { where(confirmed: true) }
  scope :unconfirmed, -> { where(confirmed: false) }
  scope :by_reason, ->(reason) { where(reason: reason) if reason.present? }

  def reason_name
    I18n.t("damage_reasons.#{reason}", default: reason.humanize)
  end

  def confirm!(user)
    return false if confirmed?
    update!(confirmed: true, confirmed_by: user, confirmed_at: Time.current)
  end

  private

  def calculate_total_amount
    if quantity.present? && unit_price.present?
      self.total_amount = quantity * unit_price
    end
  end
end
