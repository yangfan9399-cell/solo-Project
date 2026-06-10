module WorkOrdersHelper
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

  def status_color(status)
    {
      draft: 'bg-gray-100 text-gray-800',
      pending_proof: 'bg-yellow-100 text-yellow-800',
      proof_submitted: 'bg-blue-100 text-blue-800',
      color_measured: 'bg-purple-100 text-purple-800',
      customer_confirmed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      in_production: 'bg-orange-100 text-orange-800',
      completed: 'bg-gray-100 text-gray-800'
    }[status&.to_sym] || 'bg-gray-100 text-gray-800'
  end

  def current_user
    '系统用户'
  end
end