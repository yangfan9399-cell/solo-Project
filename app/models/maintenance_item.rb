class MaintenanceItem < ApplicationRecord
  belongs_to :maintenance_plan

  validates :name, presence: true
  validates :is_required, inclusion: { in: [true, false] }

  enum :status, {
    pending: 'pending',
    completed: 'completed',
    skipped: 'skipped'
  }

  before_save :set_completed_at, if: :will_save_change_to_status?

  private

  def set_completed_at
    if completed? && status_changed? && completed_at.nil?
      self.completed_at = Time.current
    end
  end
end
