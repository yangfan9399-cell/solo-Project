module ApplicationHelper
  def status_badge(status, options = {})
    colors = {
      'available' => 'bg-green-100 text-green-800',
      'in_maintenance' => 'bg-blue-100 text-blue-800',
      'under_repair' => 'bg-orange-100 text-orange-800',
      'decommissioned' => 'bg-red-100 text-red-800',
      'pending_review' => 'bg-yellow-100 text-yellow-800',
      'pending' => 'bg-yellow-100 text-yellow-800',
      'in_progress' => 'bg-blue-100 text-blue-800',
      'completed' => 'bg-green-100 text-green-800',
      'overdue' => 'bg-red-100 text-red-800',
      'cancelled' => 'bg-gray-100 text-gray-800',
      'reported' => 'bg-yellow-100 text-yellow-800',
      'diagnosing' => 'bg-purple-100 text-purple-800',
      'parts_pending' => 'bg-amber-100 text-amber-800',
      'approved' => 'bg-green-100 text-green-800',
      'rejected' => 'bg-red-100 text-red-800',
      'decommission' => 'bg-red-100 text-red-800',
      'pass' => 'bg-green-100 text-green-800',
      'fail' => 'bg-red-100 text-red-800',
      'conditional' => 'bg-yellow-100 text-yellow-800',
      'routine' => 'bg-slate-100 text-slate-800',
      'comprehensive' => 'bg-indigo-100 text-indigo-800',
      'emergency' => 'bg-red-100 text-red-800',
      'breakdown' => 'bg-red-100 text-red-800',
      'preventive' => 'bg-blue-100 text-blue-800',
      'accident' => 'bg-rose-100 text-rose-800',
      'pre_departure' => 'bg-emerald-100 text-emerald-800',
      'special' => 'bg-violet-100 text-violet-800'
    }

    color_class = colors[status.to_s] || 'bg-gray-100 text-gray-800'
    size_class = options[:size] == :sm ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'

    content_tag(:span,
                I18n.t("enums.#{options[:enum_scope]}.#{status}", default: status.to_s.humanize),
                class: "inline-flex items-center rounded-md font-medium #{color_class} #{size_class} #{options[:class]}")
  end

  def icon(name, options = {})
    size = options[:size] || 16
    class_name = options[:class] || ''
    icons = {
      wrench: '<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="%s"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>',
      tools: '<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="%s"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path><path d="M7 14l3 3"></path></svg>',
      truck: '<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="%s"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"></path><path d="M15 18H9"></path><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"></path><circle cx="17" cy="18" r="2"></circle><circle cx="7" cy="18" r="2"></circle></svg>',
      clipboard_check: '<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="%s"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="m9 14 2 2 4-4"></path></svg>',
      gauge: '<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="%s"><path d="m12 14 4-4"></path><path d="M3.34 19a10 10 0 1 1 17.32 0"></path></svg>',
      alert_triangle: '<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="%s"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>',
      ban: '<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="%s"><circle cx="12" cy="12" r="10"></circle><path d="m4.93 4.93 14.14 14.14"></path></svg>',
      circle: '<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="%s"><circle cx="12" cy="12" r="10"></circle></svg>',
      check: '<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="%s"><path d="M20 6 9 17l-5-5"></path></svg>',
      x: '<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="%s"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>',
      fuel: '<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="%s"><line x1="3" x2="15" y1="22" y2="22"></line><line x1="4" x2="14" y1="9" y2="9"></line><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"></path><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"></path></svg>',
      calendar: '<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="%s"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" x2="16" y1="2" y2="6"></line><line x1="8" x2="8" y1="2" y2="6"></line><line x1="3" x2="21" y1="10" y2="10"></line></svg>',
      users: '<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="%s"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
      map_pin: '<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="%s"><path d="M20 10c0 7-8 12-8 12s-8-5-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
      home: '<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="%s"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
      bar_chart: '<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="%s"><line x1="12" x2="12" y1="20" y2="10"></line><line x1="18" x2="18" y1="20" y2="4"></line><line x1="6" x2="6" y1="20" y2="16"></line></svg>',
      plus: '<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="%s"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>',
      search: '<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="%s"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>',
      filter: '<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="%s"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>'
    }

    (icons[name.to_s] || icons['circle']).html_safe % [size, size, class_name]
  end

  def format_date(date, format = :default)
    return '-' unless date
    case format
    when :short then date.strftime('%m-%d')
    when :full then date.strftime('%Y年%m月%d日')
    when :datetime then date.strftime('%Y-%m-%d %H:%M')
    when :time then date.strftime('%H:%M')
    else date.strftime('%Y-%m-%d')
    end
  end

  def format_money(amount)
    return '-' if amount.nil?
    number_to_currency(amount, unit: '¥', precision: 2, locale: :zh)
  end

  def format_number(num, options = {})
    return '-' if num.nil?
    precision = options[:precision] || 1
    unit = options[:unit] || ''
    number_with_precision(num, precision: precision, delimiter: ',') + unit
  end

  def progress_bar(percent, options = {})
    color = options[:color] || progress_color(percent)
    height = options[:height] || 'h-2'
    label = options[:label] ? content_tag(:span, "#{percent}%", class: 'text-xs text-gray-500 ml-2') : ''
    content_tag(:div, class: "flex items-center #{options[:class]}") do
      content_tag(:div, class: "flex-1 bg-gray-200 rounded-full #{height} overflow-hidden") do
        content_tag(:div, nil,
                    class: "#{height} rounded-full transition-all duration-500 #{color}",
                    style: "width: #{[percent, 100].min}%")
      end + label
    end
  end

  def progress_color(percent)
    case percent
    when 0..30 then 'bg-red-500'
    when 31..70 then 'bg-yellow-500'
    when 71..100 then 'bg-green-500'
    else 'bg-blue-500'
    end
  end

  def vehicle_age(purchase_date)
    return '-' unless purchase_date
    years = ((Date.today - purchase_date) / 365.25).round(1)
    "#{years}年"
  end

  def nav_link_to(name, path, options = {})
    is_active = current_page?(path)
    link_to name, path, class: "nav-link #{is_active ? 'active' : ''} #{options[:class]}"
  end

  def turbo_flash_stream
    turbo_stream_action_tag(:replace, :flash, template: render(partial: 'shared/flash'))
  end
end
