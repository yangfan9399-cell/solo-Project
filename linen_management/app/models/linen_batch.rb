class LinenBatch < ApplicationRecord
  include AASM if defined?(AASM)

  STATUSES = %w[pending collected washed returned inspected disputed settled].freeze

  belongs_to :hotel
  belongs_to :handover_user, class_name: 'User', optional: true
  belongs_to :return_user, class_name: 'User', optional: true
  belongs_to :inspector, class_name: 'User', optional: true
  belongs_to :finance_user, class_name: 'User', optional: true

  has_many :linen_items, dependent: :destroy
  has_many :damage_claims, dependent: :destroy
  has_many :events, -> { order(created_at: :asc) }, class_name: 'LinenEvent', dependent: :destroy
  has_many :linen_types, through: :linen_items

  validates :batch_number, presence: true, uniqueness: true
  validates :status, presence: true, inclusion: { in: STATUSES }
  validates :hotel, presence: true

  before_validation :generate_batch_number, on: :create

  scope :by_status, ->(status) { where(status: status) if status.present? }
  scope :by_hotel, ->(hotel_id) { where(hotel_id: hotel_id) if hotel_id.present? }
  scope :recent, -> { order(created_at: :desc) }
  scope :with_issues, -> { where(status: %w[disputed]).or(where(id: DamageClaim.select(:linen_batch_id))) }

  def total_quantity_handed
    linen_items.sum(:quantity_handed)
  end

  def total_quantity_returned
    linen_items.sum(:quantity_returned)
  end

  def total_quantity_clean
    linen_items.sum(:quantity_clean)
  end

  def total_quantity_stained
    linen_items.sum(:quantity_stained)
  end

  def total_quantity_damaged
    linen_items.sum(:quantity_damaged)
  end

  def total_quantity_short
    linen_items.sum(:quantity_short)
  end

  def total_damage_amount
    damage_claims.sum(:total_amount)
  end

  def confirmed_damage_amount
    damage_claims.where(confirmed: true).sum(:total_amount)
  end

  def has_quality_issues?
    total_quantity_stained > 0 || total_quantity_damaged > 0
  end

  def has_shortage?
    total_quantity_short > 0
  end

  def discrepancy_confirmed?
    discrepancy_confirmed_by_hotel? && discrepancy_confirmed_by_laundry?
  end

  def can_settle?
    inspected? && all_claims_confirmed?
  end

  def all_claims_confirmed?
    damage_claims.where(confirmed: false).none?
  end

  def status_name
    I18n.t("batch_statuses.#{status}", default: status.humanize)
  end

  def collect!(user)
    return false unless pending?
    update!(status: 'collected', handover_user: user, handover_at: Time.current)
    add_event('collected', user, '客房经办人已交接布草')
  end

  def wash_complete!(user)
    return false unless collected?
    update!(status: 'washed')
    add_event('washed', user, '洗涤厂已完成洗涤')
  end

  def return!(user, items_params = {})
    return false unless washed?
    update!(status: 'returned', return_user: user, return_at: Time.current)
    add_event('returned', user, '洗涤厂已登记返还')
  end

  def inspect!(user, inspection_params = {})
    return false unless returned? || disputed?
    update!(inspector: user, inspected_at: Time.current)

    if has_shortage?
      update!(status: 'disputed', discrepancy_confirmed_by_hotel: false, discrepancy_confirmed_by_laundry: false)
      add_event('disputed', user, '质检发现数量短少，进入争议流程')
    else
      update!(status: 'inspected')
      add_event('inspected', user, '质检员已完成质量复核')
    end
  end

  def confirm_discrepancy!(user, side)
    return false unless disputed?
    if side == 'hotel'
      update!(discrepancy_confirmed_by_hotel: true)
      add_event('discrepancy_confirmed_hotel', user, '酒店方已确认数量差异')
    elsif side == 'laundry'
      update!(discrepancy_confirmed_by_laundry: true)
      add_event('discrepancy_confirmed_laundry', user, '洗涤厂已确认数量差异')
    end

    if discrepancy_confirmed?
      update!(status: 'inspected')
      add_event('discrepancy_resolved', user, '双方已确认差异，可进入结算流程')
    end
  end

  def settle!(user)
    return false unless inspected? && can_settle?
    update!(status: 'settled', finance_user: user, settled_at: Time.current)
    add_event('settled', user, '财务已确认赔损并完成结算')
  end

  def add_event(event_type, user, description = nil)
    events.create!(
      event_type: event_type,
      user: user,
      description: description || event_type.humanize
    )
  end

  def pending?
    status == 'pending'
  end

  def collected?
    status == 'collected'
  end

  def washed?
    status == 'washed'
  end

  def returned?
    status == 'returned'
  end

  def inspected?
    status == 'inspected'
  end

  def disputed?
    status == 'disputed'
  end

  def settled?
    status == 'settled'
  end

  private

  def generate_batch_number
    return if batch_number.present?
    date_prefix = Time.current.strftime('%Y%m%d')
    last_batch = LinenBatch.where('batch_number LIKE ?', "#{date_prefix}%").order(batch_number: :desc).first
    if last_batch && last_batch.batch_number.match(/-(\d{3})$/)
      sequence = Regexp.last_match(1).to_i + 1
    else
      sequence = 1
    end
    self.batch_number = "#{date_prefix}-#{sequence.to_s.rjust(3, '0')}"
  end
end
