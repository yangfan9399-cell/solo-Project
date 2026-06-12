module ApplicationHelper
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

  def simple_pagination_nav(pagy)
    return '' if pagy.pages <= 1

    html = +''
    html << '<nav class="inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">'

    if pagy.prev
      html << link_to('上一页', request.params.merge(page: pagy.prev), class: 'relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50')
    else
      html << '<span class="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-300 bg-white border border-gray-300 rounded-l-md cursor-not-allowed">上一页</span>'
    end

    pagy.series.each do |item|
      if item.is_a?(Integer)
        if item == pagy.page
          html << '<span class="relative inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600">' + item.to_s + '</span>'
        else
          html << link_to(item.to_s, request.params.merge(page: item), class: 'relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50')
        end
      elsif item == :gap
        html << '<span class="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300">...</span>'
      end
    end

    if pagy.next
      html << link_to('下一页', request.params.merge(page: pagy.next), class: 'relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50')
    else
      html << '<span class="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-300 bg-white border border-gray-300 rounded-r-md cursor-not-allowed">下一页</span>'
    end

    html << '</nav>'
    html.html_safe
  end
end

