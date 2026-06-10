module ApplicationHelper
  def status_class(status)
    case status
    when "pending" then "bg-yellow-100 text-yellow-800"
    when "approved" then "bg-blue-100 text-blue-800"
    when "in_transit" then "bg-purple-100 text-purple-800"
    when "received" then "bg-green-100 text-green-800"
    when "rejected" then "bg-red-100 text-red-800"
    when "cancelled" then "bg-gray-100 text-gray-800"
    else "bg-gray-100 text-gray-800"
    end
  end
end
