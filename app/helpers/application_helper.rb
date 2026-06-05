module ApplicationHelper
  def status_class(status)
    case status
    when 'active' then 'bg-green-100 text-green-800'
    when 'refund_pending' then 'bg-yellow-100 text-yellow-800'
    when 'refund_approved' then 'bg-blue-100 text-blue-800'
    when 'refund_rejected' then 'bg-red-100 text-red-800'
    when 'archived' then 'bg-gray-100 text-gray-800'
    else 'bg-gray-100 text-gray-800'
    end
  end

  def status_text(status)
    case status
    when 'active' then '进行中'
    when 'refund_pending' then '退款待复核'
    when 'refund_approved' then '退款已批准'
    when 'refund_rejected' then '退款已退回'
    when 'archived' then '已归档'
    else status
    end
  end

  def review_status_class(status)
    case status
    when 'pending' then 'bg-yellow-100 text-yellow-800'
    when 'approved' then 'bg-green-100 text-green-800'
    when 'rejected' then 'bg-red-100 text-red-800'
    when 'archived' then 'bg-gray-100 text-gray-800'
    when 'disputed' then 'bg-red-100 text-red-800'
    else 'bg-gray-100 text-gray-800'
    end
  end

  def review_status_text(status)
    case status
    when 'pending' then '待复核'
    when 'approved' then '已批准'
    when 'rejected' then '已退回'
    when 'archived' then '已归档'
    when 'disputed' then '争议中'
    else status
    end
  end
end
