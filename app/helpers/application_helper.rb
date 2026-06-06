module ApplicationHelper
  def status_badge_class(status)
    classes = {
      pending: "bg-amber-100 text-amber-800",
      confirmed: "bg-blue-100 text-blue-800",
      checked_out: "bg-green-100 text-green-800",
      returning: "bg-purple-100 text-purple-800",
      returned: "bg-gray-100 text-gray-800",
      damaged: "bg-red-100 text-red-800",
      compensating: "bg-orange-100 text-orange-800",
      compensated: "bg-teal-100 text-teal-800",
      repairing: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-gray-200 text-gray-600",
      available: "bg-green-100 text-green-800",
      borrowed: "bg-blue-100 text-blue-800",
      available: "bg-green-100 text-green-800",
      borrowed: "bg-blue-100 text-blue-800",
      repairing: "bg-yellow-100 text-yellow-800",
      scrapped: "bg-gray-200 text-gray-600",
      disputed: "bg-red-100 text-red-800",
      resolved: "bg-blue-100 text-blue-800",
      paid: "bg-green-100 text-green-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800"
    }
    classes[status.to_sym] || "bg-gray-100 text-gray-800"
  end

  def prop_status_badge_class(status)
    classes = {
      available: "bg-green-100 text-green-800",
      borrowed: "bg-blue-100 text-blue-800",
      repairing: "bg-yellow-100 text-yellow-800",
      scrapped: "bg-gray-200 text-gray-600"
    }
    classes[status.to_sym] || "bg-gray-100 text-gray-800"
  end

  def damage_type_badge_class(type)
    return "" unless type.present?
    classes = {
      minor: "bg-amber-100 text-amber-800",
      moderate: "bg-orange-100 text-orange-800",
      severe: "bg-red-100 text-red-800",
      total_loss: "bg-gray-800 text-white"
    }
    classes[type.to_sym] || "bg-gray-100 text-gray-800"
  end

  def condition_badge_class(condition)
    classes = {
      good: "bg-green-100 text-green-800",
      minor_issue: "bg-amber-100 text-amber-800",
      damaged: "bg-red-100 text-red-800",
      unusable: "bg-gray-800 text-white"
    }
    classes[condition.to_sym] || "bg-gray-100 text-gray-800"
  end

  def prop_icon(category)
    icons = {
      "家具道具" => "🪑",
      "瓷器道具" => "🏺",
      "布幔道具" => "🎭",
      "金属道具" => "🔔",
      "文书道具" => "📜",
      "服饰道具" => "👘"
    }
    icons[category] || "🎬"
  end

  def format_currency(amount)
    number_to_currency(amount, unit: "¥", precision: 2)
  end

  def format_date(date)
    return "" unless date.present?
    date.strftime("%Y年%m月%d日")
  end

  def format_datetime(datetime)
    return "" unless datetime.present?
    datetime.strftime("%Y年%m月%d日 %H:%M")
  end
end
