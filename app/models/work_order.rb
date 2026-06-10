class WorkOrder < ApplicationRecord
  belongs_to :customer
  has_many :proofs, dependent: :destroy
  has_many :work_order_histories, dependent: :destroy

  enum :status, %i[draft pending_proof proof_submitted color_measured customer_confirmed rejected in_production completed]

  def latest_proof
    proofs.order(version: :desc).first
  end

  def latest_color_measurement
    latest_proof&.color_measurements&.order(measured_at: :desc)&.first
  end

  def has_color_deviation?
    latest_color_measurement&.is_qualified == false
  end

  def can_proceed_to_production?
    customer_confirmed? && !has_color_deviation?
  end

  def update_status(new_status, operator, remark = nil)
    return false unless valid_status_transition?(new_status)

    previous_status = self.status
    self.status = new_status
    save!

    WorkOrderHistory.create!(
      work_order: self,
      previous_status: previous_status,
      current_status: new_status,
      operator: operator,
      action: status_action(new_status),
      remark: remark
    )
    true
  end

  def valid_status_transition?(new_status)
    transitions = {
      draft: [:pending_proof],
      pending_proof: [:proof_submitted],
      proof_submitted: [:color_measured],
      color_measured: [:customer_confirmed, :rejected],
      customer_confirmed: [:in_production],
      rejected: [:pending_proof],
      in_production: [:completed],
      completed: []
    }
    transitions[status.to_sym]&.include?(new_status.to_sym)
  end

  def status_action(status)
    {
      draft: '创建工单',
      pending_proof: '提交工单等待打样',
      proof_submitted: '提交打样',
      color_measured: '完成色差检测',
      customer_confirmed: '客户确认',
      rejected: '客户拒绝/返工',
      in_production: '进入批量生产',
      completed: '工单完成'
    }[status.to_sym]
  end
end