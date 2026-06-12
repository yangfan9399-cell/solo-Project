module ApplicationHelper
  include Pagy::Frontend

  def format_time(time)
    return '-' unless time
    time.strftime('%Y-%m-%d %H:%M:%S')
  end

  def format_date(date)
    return '-' unless date
    date.strftime('%Y-%m-%d')
  end

  def status_color_class(status)
    case status.to_s
    when 'pending' then 'bg-yellow-100 text-yellow-800'
    when 'accepted' then 'bg-blue-100 text-blue-800'
    when 'processing' then 'bg-blue-100 text-blue-800'
    when 'reviewing' then 'bg-purple-100 text-purple-800'
    when 'archived' then 'bg-green-100 text-green-800'
    when 'rejected' then 'bg-red-100 text-red-800'
    when 'returned' then 'bg-orange-100 text-orange-800'
    else 'bg-gray-100 text-gray-800'
    end
  end

  def evidence_color_class(ec)
    case ec.to_s
    when 'sufficient' then 'bg-green-100 text-green-800'
    when 'insufficient' then 'bg-red-100 text-red-800'
    when 'pending' then 'bg-yellow-100 text-yellow-800'
    else 'bg-gray-100 text-gray-800'
    end
  end
end

