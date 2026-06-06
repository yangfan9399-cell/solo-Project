class DashboardController < ApplicationController
  def index
    @props_count = Prop.count
    @available_props = Prop.available.count
    @borrowed_props = Prop.borrowed.count
    @repairing_props = Prop.repairing.count
    @active_borrows = BorrowRecord.active.count
    @overdue_borrows = BorrowRecord.overdue.count
    @crews_count = Crew.count

    @recent_borrows = BorrowRecord.order(created_at: :desc).limit(10).includes(:prop, :crew, :applicant)
    @pending_confirmations = BorrowRecord.pending.order(created_at: :desc).includes(:prop, :crew, :applicant)
    @pending_returns = BorrowRecord.returning.order(created_at: :desc).includes(:prop, :crew)
    @pending_compensations = Compensation.pending.order(created_at: :desc).includes(:borrow_record)

    @props_by_category = Prop.group(:category).count
    @damaged_props_count = BorrowRecord.with_damage.count
    @total_compensation = Compensation.sum(:amount)
  end
end
