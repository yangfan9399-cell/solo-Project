class Prop < ApplicationRecord
  enum :status, { available: 0, borrowed: 1, repairing: 2, scrapped: 3 }, default: :available

  has_many :borrow_records
  has_many :crews, through: :borrow_records
  has_many :repair_records

  validates :name, presence: true
  validates :category, presence: true
  validates :status, presence: true

  scope :by_category, ->(category) { where(category: category) if category.present? }
  scope :by_status, ->(status) { where(status: status) if status.present? }

  def self.categories
    distinct.order(:category).pluck(:category).compact
  end

  def current_borrow_record
    borrow_records.where(status: [:pending, :confirmed, :checked_out, :returning]).order(created_at: :desc).first
  end

  CONFLICT_STATUSES = [:confirmed, :checked_out, :returning, :damaged, :compensating, :repairing]

  def has_conflict?(start_date, end_date, exclude_record_id = nil)
    scope = borrow_records.where(status: CONFLICT_STATUSES)
    scope = scope.where.not(id: exclude_record_id) if exclude_record_id.present?
    scope.where(
      "expected_start_date <= ? AND expected_end_date >= ?",
      end_date, start_date
    ).exists?
  end

  def conflicting_records(start_date, end_date, exclude_record_id = nil)
    scope = borrow_records.where(status: CONFLICT_STATUSES)
    scope = scope.where.not(id: exclude_record_id) if exclude_record_id.present?
    scope.where(
      "expected_start_date <= ? AND expected_end_date >= ?",
      end_date, start_date
    ).includes(:crew)
  end

  def find_available_slots(start_date, end_date, duration_days = 3)
    slots = []
    existing = borrow_records
      .where(status: CONFLICT_STATUSES)
      .where("expected_end_date >= ? AND expected_start_date <= ?", start_date, end_date)
      .order(:expected_start_date)

    current_date = start_date.to_date

    existing.each do |record|
      if current_date < record.expected_start_date
        gap_end = [record.expected_start_date - 1, end_date.to_date].min
        if (gap_end - current_date).to_i >= duration_days
          slots << { start_date: current_date, end_date: gap_end }
        end
      end
      current_date = [current_date, record.expected_end_date + 1].max
      break if current_date > end_date.to_date
    end

    if current_date <= end_date.to_date
      slots << { start_date: current_date, end_date: end_date.to_date }
    end

    slots
  end
end
