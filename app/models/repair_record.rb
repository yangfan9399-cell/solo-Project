class RepairRecord < ApplicationRecord
  enum :status, { pending: 0, in_progress: 1, completed: 2, cancelled: 3 }, default: :pending

  belongs_to :prop
  belongs_to :borrow_record, optional: true
  belongs_to :handler, class_name: "User", optional: true

  validates :status, presence: true

  def status_name
    I18n.t("repair_statuses.#{status}", default: status.humanize)
  end

  def complete!(finish_date = Date.today)
    return false unless in_progress?
    update!(status: :completed, finished_date: finish_date)
    prop.available! if prop.repairing?
    if borrow_record.present? && borrow_record.repairing?
      borrow_record.update!(status: :returned, returned_at: Time.current)
    end
  end
end
