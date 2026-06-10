class License < ApplicationRecord
  belongs_to :material
  has_many :usage_scenarios, dependent: :nullify

  LICENSE_TYPES = %w[exclusive non_exclusive].freeze
  STATUSES = %w[active expired scope_exceeded document_missing renewed].freeze
  RISK_REASONS = %w[expired scope_exceeded document_missing none].freeze

  validates :licensor, presence: true
  validates :license_type, presence: true, inclusion: { in: LICENSE_TYPES }
  validates :start_date, presence: true
  validates :end_date, presence: true
  validates :status, presence: true, inclusion: { in: STATUSES }
  validates :risk_reason, inclusion: { in: RISK_REASONS }, allow_blank: true

  validate :end_date_after_start_date

  def end_date_after_start_date
    return unless start_date && end_date

    errors.add(:end_date, 'must be after start date') if end_date <= start_date
  end

  def expired?
    end_date < Date.today
  end

  def active?
    status == 'active' && !expired?
  end

  def update_status!
    if contract_file.blank?
      update(status: 'document_missing', risk_reason: 'document_missing')
    elsif expired?
      update(status: 'expired', risk_reason: 'expired')
    else
      update(status: 'active', risk_reason: 'none')
    end
  end

  def renew(new_end_date)
    update(end_date: new_end_date, status: 'renewed', risk_reason: 'none')
  end
end