module ApplicationHelper
  def status_class(status)
    case status
    when 'draft', 'fault_recorded' then 'bg-gray-100 text-gray-800'
    when 'quote_submitted', 'quote_approved' then 'bg-blue-100 text-blue-800'
    when 'quote_over_budget', 'quote_rejected', 'review_returned' then 'bg-red-100 text-red-800'
    when 'parts_pending', 'parts_out_of_stock' then 'bg-yellow-100 text-yellow-800'
    when 'parts_available', 'in_repair', 'repair_completed', 'under_review' then 'bg-purple-100 text-purple-800'
    when 'review_approved', 'follow_up_scheduled' then 'bg-indigo-100 text-indigo-800'
    when 'follow_up_completed', 'archived' then 'bg-green-100 text-green-800'
    when 'warranty_repair' then 'bg-orange-100 text-orange-800'
    else 'bg-gray-100 text-gray-800'
    end
  end

  def part_status_class(status)
    case status
    when 'pending', 'ordered' then 'bg-yellow-100 text-yellow-800'
    when 'out_of_stock' then 'bg-red-100 text-red-800'
    when 'available', 'used' then 'bg-green-100 text-green-800'
    else 'bg-gray-100 text-gray-800'
    end
  end
end
