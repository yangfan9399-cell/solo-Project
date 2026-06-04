class ApprovalEscalation < ApplicationRecord
  enum :level, { senior_manager: "senior_manager", general_manager: "general_manager" }
  enum :status, { pending: "pending", approved: "approved", rejected: "rejected" }

  belongs_to :repair_request
  belongs_to :compensation
  belongs_to :approved_by, class_name: "User", optional: true

  validates :level, presence: true
  validates :reason, presence: true

  def approve!(manager, note: nil, adjusted_amount: nil)
    transaction do
      update!(status: :approved, approved_by: manager, review_note: note)
      comp = compensation
      if adjusted_amount.present?
        comp.update!(amount: adjusted_amount, status: :approved, approved_by: manager)
      else
        comp.update!(status: :approved, approved_by: manager)
      end
      repair_request.update!(status: :compensation_approved, manager: manager, resolved_at: Time.current)
      repair_request.status_logs.create!(
        from_status: "compensation_exceeded",
        to_status: "compensation_approved",
        changed_by: manager,
        note: "升级审批通过(#{level == 'senior_manager' ? '高级经理' : '总经理'})#{adjusted_amount.present? ? "，调整金额为 ¥#{adjusted_amount}" : ''}"
      )
    end
  end

  def reject!(manager, note: nil)
    transaction do
      update!(status: :rejected, approved_by: manager, review_note: note)
      compensation.update!(status: :rejected, approved_by: manager, rejection_reason: note)
      repair_request.update!(status: :compensation_rejected, manager: manager)
      repair_request.status_logs.create!(
        from_status: "compensation_exceeded",
        to_status: "compensation_rejected",
        changed_by: manager,
        note: "升级审批驳回(#{level == 'senior_manager' ? '高级经理' : '总经理'})：#{note}"
      )
    end
  end
end
