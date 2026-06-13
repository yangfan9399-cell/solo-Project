module ApplicationHelper
  def nav_link_class(path)
    base = 'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium'
    if current_page?(path)
      "#{base} border-blue-500 text-gray-900"
    else
      "#{base} border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
    end
  end

  def state_badge_class(state)
    case state.to_s
    when 'pending' then 'bg-gray-100 text-gray-800'
    when 'accepted' then 'bg-blue-100 text-blue-800'
    when 'processing' then 'bg-yellow-100 text-yellow-800'
    when 'review_pending' then 'bg-purple-100 text-purple-800'
    when 'reviewing' then 'bg-indigo-100 text-indigo-800'
    when 'rejected' then 'bg-red-100 text-red-800'
    when 'archived' then 'bg-green-100 text-green-800'
    else 'bg-gray-100 text-gray-800'
    end
  end

  def button_class_for_event(event)
    base = 'inline-flex items-center px-4 py-2 border shadow-sm text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2'
    case event.to_s
    when 'accept' then "#{base} border-transparent text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
    when 'process' then "#{base} border-transparent text-white bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500"
    when 'submit_review' then "#{base} border-transparent text-white bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
    when 'start_review' then "#{base} border-transparent text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
    when 'archive' then "#{base} border-transparent text-white bg-green-600 hover:bg-green-700 focus:ring-green-500"
    when 'reject' then "#{base} border-transparent text-white bg-red-600 hover:bg-red-700 focus:ring-red-500"
    when 'reprocess' then "#{base} border-transparent text-white bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
    else "#{base} border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-gray-500"
    end
  end

  def event_text(event)
    case event.to_s
    when 'accept' then '受理'
    when 'process' then '开始处理'
    when 'submit_review' then '提交复核'
    when 'start_review' then '开始复核'
    when 'archive' then '确认归档'
    when 'reject' then '退回补证'
    when 'reprocess' then '重新处理'
    else event.to_s.humanize
    end
  end

  def sample_type_badge_class(type)
    case type.to_s
    when 'normal_delivery' then 'bg-green-100 text-green-800'
    when 'qualification_mismatch' then 'bg-red-100 text-red-800'
    when 'time_window_conflict' then 'bg-orange-100 text-orange-800'
    when 'notification_unconfirmed' then 'bg-yellow-100 text-yellow-800'
    else 'bg-gray-100 text-gray-800'
    end
  end

  def defect_type_icon(type)
    case type.to_s
    when 'cleanliness'
      '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" /></svg>'.html_safe
    when 'facility'
      '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>'.html_safe
    when 'odor'
      '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>'.html_safe
    when 'lighting'
      '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>'.html_safe
    else
      '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>'.html_safe
    end
  end

  def format_datetime(datetime)
    return '-' unless datetime
    datetime.strftime('%Y-%m-%d %H:%M:%S')
  end

  def format_date(date)
    return '-' unless date
    date.strftime('%Y-%m-%d')
  end

  def score_color(score)
    return 'text-gray-500' unless score
    if score >= 90
      'text-green-600'
    elsif score >= 70
      'text-yellow-600'
    else
      'text-red-600'
    end
  end

  def trend_icon(value)
    return '' if value.zero?
    if value.positive?
      '<svg class="w-4 h-4 inline text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>'.html_safe
    else
      '<svg class="w-4 h-4 inline text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>'.html_safe
    end
  end
end
