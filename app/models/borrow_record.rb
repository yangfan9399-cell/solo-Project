class BorrowRecord < ApplicationRecord
  enum :status, {
    pending: 0,
    confirmed: 1,
    checked_out: 2,
    returning: 3,
    returned: 4,
    damaged: 5,
    compensating: 6,
    compensated: 7,
    repairing: 8,
    cancelled: 9
  }, default: :pending

  enum :damage_type, {
    minor: 0,
    moderate: 1,
    severe: 2,
    total_loss: 3
  }, optional: true

  belongs_to :prop
  belongs_to :crew
  belongs_to :applicant, class_name: "User", optional: true
  belongs_to :confirmer, class_name: "User", optional: true
  belongs_to :auditor, class_name: "User", optional: true

  has_many :inspection_records, dependent: :destroy
  has_one :compensation, dependent: :destroy
  has_one :repair_record, dependent: :destroy

  validates :expected_start_date, presence: true
  validates :expected_end_date, presence: true
  validates :prop_id, presence: true
  validates :crew_id, presence: true
  validate :end_date_after_start_date
  validate :no_conflict, on: :confirm_validation

  def confirm_validation
    run_validations!(:confirm_validation)
  end

  scope :active, -> { where.not(status: [:returned, :cancelled, :compensated]) }
  scope :by_status, ->(status) { where(status: status) if status.present? }
  scope :by_crew, ->(crew_id) { where(crew_id: crew_id) if crew_id.present? }
  scope :by_prop, ->(prop_id) { where(prop_id: prop_id) if prop_id.present? }
  scope :overdue, -> { where("expected_end_date < ?", Date.today).where(status: [:checked_out, :returning]) }
  scope :with_damage, -> {
    left_joins(:compensation, :repair_record)
      .where("damage_type IS NOT NULL OR compensations.id IS NOT NULL OR repair_records.id IS NOT NULL")
      .distinct
  }

  def status_name
    I18n.t("borrow_statuses.#{status}", default: status.humanize)
  end

  def damage_type_name
    return unless damage_type.present?
    I18n.t("damage_types.#{damage_type}", default: damage_type.humanize)
  end

  def duration_days
    (expected_end_date - expected_start_date).to_i + 1
  end

  def actual_duration_days
    return unless checked_out_at && returned_at
    (returned_at.to_date - checked_out_at.to_date).to_i + 1
  end

  def overdue?
    return false unless checked_out? || returning?
    expected_end_date < Date.today
  end

  def has_conflict?
    prop.has_conflict?(expected_start_date, expected_end_date, id)
  end

  def conflicting_records
    prop.conflicting_records(expected_start_date, expected_end_date, id)
  end

  def available_alternative_slots(days_ahead = 30)
    start_date = Date.today
    end_date = start_date + days_ahead.days
    prop.find_available_slots(start_date, end_date, duration_days)
  end

  def confirm_by!(user)
    return false unless pending?
    return false if has_conflict?

    transaction do
      update!(status: :confirmed, confirmer: user, confirmed_at: Time.current)
      prop.borrowed! if prop.available?
    end
    true
  end

  def checkout_by!(user)
    return false unless confirmed?

    transaction do
      update!(status: :checked_out, checked_out_at: Time.current)
      prop.update!(total_borrow_count: prop.total_borrow_count + 1)
      inspection_records.create!(
        inspector: user,
        inspection_type: :checkout,
        condition: :good,
        notes: "出库检查正常"
      )
    end
    true
  end

  def return_by!(user, return_notes = nil, condition = :good)
    return false unless checked_out?

    transaction do
      update!(status: :returning, return_notes: return_notes)
      inspection_records.create!(
        inspector: user,
        inspection_type: :return,
        condition: condition,
        notes: return_notes
      )
    end
    true
  end

  def audit_return!(user, result: :returned, damage_type: nil, damage_description: nil)
    return false unless returning?

    transaction do
      case result
      when :returned
        update!(status: :returned, returned_at: Time.current, auditor: user)
        prop.available!
      when :damaged
        update!(
          status: :damaged,
          auditor: user,
          damage_type: damage_type,
          damage_description: damage_description
        )
        prop.update!(damage_count: prop.damage_count + 1)
      end
    end
    true
  end

  def start_compensation!(user, amount, basis)
    return false unless damaged?

    transaction do
      create_compensation!(
        amount: amount,
        basis: basis,
        handler: user,
        status: :pending
      )
      update!(status: :compensating)
    end
    true
  end

  def start_repair!(user, damage_description, cost = nil)
    return false unless damaged?

    transaction do
      repair_record = prop.repair_records.create!(
        borrow_record: self,
        handler: user,
        damage_description: damage_description,
        cost: cost,
        start_date: Date.today,
        status: :in_progress
      )
      update!(status: :repairing)
      prop.repairing!
      repair_record
    end
  end

  private

  def end_date_after_start_date
    return unless expected_start_date && expected_end_date
    if expected_end_date < expected_start_date
      errors.add(:expected_end_date, "必须晚于开始日期")
    end
  end

  def no_conflict
    return unless prop && expected_start_date && expected_end_date
    if has_conflict?
      errors.add(:base, "该道具在所选时间段内已被借出，存在借调冲突")
    end
  end
end
