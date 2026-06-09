module ApplicationHelper
  def status_badge_class(status)
    case status.to_sym
    when :draft
      'bg-gray-100 text-gray-800'
    when :pending_legal, :pending_seal, :pending_archive
      'bg-yellow-100 text-yellow-800'
    when :legal_approved, :seal_approved, :archived
      'bg-green-100 text-green-800'
    when :legal_rejected, :seal_rejected, :version_conflict, :archive_missing_pages, :approver_absent
      'bg-red-100 text-red-800'
    else
      'bg-gray-100 text-gray-800'
    end
  end

  def format_duration(seconds)
    return 'N/A' if seconds.nil?

    hours = seconds.to_i / 3600
    minutes = (seconds.to_i % 3600) / 60
    secs = seconds.to_i % 60

    if hours > 0
      "#{hours}小时#{minutes}分"
    elsif minutes > 0
      "#{minutes}分#{secs}秒"
    else
      "#{secs}秒"
    end
  end

  def time_ago_in_chinese(time)
    return '' if time.nil?

    seconds = (Time.current - time).to_i

    if seconds < 60
      '刚刚'
    elsif seconds < 3600
      "#{seconds / 60}分钟前"
    elsif seconds < 86400
      "#{seconds / 3600}小时前"
    elsif seconds < 2592000
      "#{seconds / 86400}天前"
    else
      time.strftime('%Y-%m-%d')
    end
  end

  def seal_type_name(seal_type)
    {
      'official' => '公章',
      'contract' => '合同专用章',
      'financial' => '财务专用章',
      'legal' => '法人章'
    }[seal_type.to_s] || seal_type.to_s.humanize
  end

  def anomaly_name(status)
    {
      'version_conflict' => '合同版本不一致',
      'legal_rejected' => '法务审核驳回',
      'seal_rejected' => '印章管理员拒绝',
      'approver_absent' => '审批人缺席',
      'archive_missing_pages' => '归档缺页'
    }[status.to_s] || status.to_s.humanize
  end
end
