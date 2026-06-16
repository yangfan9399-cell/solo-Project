module ApplicationHelper
  def difficulty_class(difficulty)
    case difficulty
    when 'easy' then 'bg-green-500/20 text-green-400 border border-green-500/30'
    when 'medium' then 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
    when 'hard' then 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
    when 'expert' then 'bg-red-500/20 text-red-400 border border-red-500/30'
    else 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
    end
  end

  def difficulty_label(difficulty)
    case difficulty
    when 'easy' then '简单'
    when 'medium' then '中等'
    when 'hard' then '困难'
    when 'expert' then '专家'
    else difficulty
    end
  end

  def difficulty_emoji(difficulty)
    case difficulty
    when 'easy' then '🌱'
    when 'medium' then '🌿'
    when 'hard' then '🌳'
    when 'expert' then '🔥'
    else '🎯'
    end
  end

  def status_class(status)
    case status
    when 'playing' then 'bg-blue-500/20 text-blue-400'
    when 'won' then 'bg-green-500/20 text-green-400'
    when 'lost' then 'bg-red-500/20 text-red-400'
    when 'cancelled' then 'bg-slate-500/20 text-slate-400'
    else 'bg-slate-500/20 text-slate-400'
    end
  end

  def status_label(status)
    case status
    when 'playing' then '进行中'
    when 'won' then '胜利'
    when 'lost' then '失败'
    when 'cancelled' then '已取消'
    else status
    end
  end

  def format_seconds(seconds)
    return '00:00' if seconds.nil? || seconds <= 0
    minutes = seconds / 60
    secs = seconds % 60
    format('%02d:%02d', minutes, secs)
  end

  def weight_bar_color(current, max)
    ratio = current.to_f / max
    if ratio < 0.5
      'bg-green-500'
    elsif ratio < 0.8
      'bg-yellow-500'
    elsif ratio <= 1.0
      'bg-orange-500'
    else
      'bg-red-500'
    end
  end

  def number_with_delimiter(number)
    return '0' if number.nil?
    number.to_s.reverse.gsub(/(\d{3})(?=\d)/, '\\1,').reverse
  end
end
