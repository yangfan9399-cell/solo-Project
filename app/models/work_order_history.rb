class WorkOrderHistory < ApplicationRecord
  belongs_to :work_order

  def status_label(status)
    {
      draft: '草稿',
      pending_proof: '等待打样',
      proof_submitted: '打样已提交',
      color_measured: '色差已检测',
      customer_confirmed: '客户已确认',
      rejected: '已拒绝/返工',
      in_production: '批量生产中',
      completed: '已完成'
    }[status&.to_sym] || status
  end

  def previous_status_label
    status_label(previous_status)
  end

  def current_status_label
    status_label(current_status)
  end
end