module ApplicationHelper
  def status_class(status)
    case status.to_sym
    when :initialized then "bg-slate-100 text-slate-700"
    when :in_progress then "bg-info-100 text-info-700"
    when :paused then "bg-warning-100 text-warning-700"
    when :completed then "bg-primary-100 text-primary-700"
    when :abandoned then "bg-slate-200 text-slate-600"
    when :rolled_back then "bg-danger-50 text-danger-700"
    else "bg-slate-100 text-slate-700"
    end
  end

  def status_label(status)
    {
      initialized: "待开始",
      in_progress: "进行中",
      paused: "暂停",
      completed: "已完成",
      abandoned: "已放弃",
      rolled_back: "已回滚"
    }[status.to_sym] || status
  end

  def severity_class(severity)
    case severity.to_sym
    when :critical then "bg-danger-600 text-white"
    when :high then "bg-danger-500 text-white"
    when :medium then "bg-warning-500 text-white"
    else "bg-slate-400 text-white"
    end
  end

  def factor_color(factor)
    if factor >= 0.8
      "text-primary-600"
    elsif factor >= 0.5
      "text-warning-600"
    else
      "text-danger-600"
    end
  end

  def progress_bar_color(percent)
    if percent >= 80
      "bg-primary-500"
    elsif percent >= 50
      "bg-info-500"
    elsif percent >= 20
      "bg-warning-500"
    else
      "bg-danger-500"
    end
  end
end
