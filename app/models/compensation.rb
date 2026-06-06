class Compensation < ApplicationRecord
  enum :status, { pending: 0, disputed: 1, resolved: 2, paid: 3 }, default: :pending

  belongs_to :borrow_record
  belongs_to :handler, class_name: "User", optional: true

  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :status, presence: true

  def status_name
    I18n.t("compensation_statuses.#{status}", default: status.humanize)
  end

  def dispute!(reason)
    return false unless pending?
    update!(status: :disputed, dispute_reason: reason, disputed_at: Time.current)
  end

  def resolve!(resolution, new_amount = nil)
    return false unless disputed?
    update!(status: :resolved, resolution: resolution, amount: new_amount || amount, resolved_at: Time.current)
  end

  def pay!
    return false unless resolved? || pending?
    update!(status: :paid, paid_at: Time.current)
    borrow_record.update!(status: :compensated) if borrow_record.damaged? || borrow_record.compensating?
  end
end
