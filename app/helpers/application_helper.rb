module ApplicationHelper
  def status_badge(status)
    case status
    when 'active', 'approved'
      tag.span(status_label(status), class: 'badge bg-success')
    when 'pending'
      tag.span(status_label(status), class: 'badge bg-warning')
    when 'expired', 'blocked', 'rejected'
      tag.span(status_label(status), class: 'badge bg-danger')
    when 'renewed'
      tag.span(status_label(status), class: 'badge bg-info')
    when 'document_missing'
      tag.span(status_label(status), class: 'badge bg-danger')
    when 'scope_exceeded'
      tag.span(status_label(status), class: 'badge bg-warning')
    when 'no_license'
      tag.span(status_label(status), class: 'badge bg-secondary')
    else
      tag.span(status, class: 'badge bg-secondary')
    end
  end

  def status_label(status)
    case status
    when 'active' then '正常'
    when 'pending' then '待审核'
    when 'expired' then '已到期'
    when 'blocked' then '已阻断'
    when 'approved' then '已通过'
    when 'rejected' then '已拒绝'
    when 'renewed' then '已续约'
    when 'document_missing' then '文件缺失'
    when 'scope_exceeded' then '范围超限'
    when 'no_license' then '无授权'
    when 'legal_reviewed' then '法务已复核'
    when 'operations_confirmed' then '运营已确认'
    when 'removed' then '已下架'
    else status
    end
  end

  def material_type_label(type)
    case type
    when 'image' then '图片'
    when 'video' then '视频'
    when 'audio' then '音频'
    when 'text' then '文本'
    when 'graphic' then '图形'
    when 'font' then '字体'
    else type
    end
  end

  def channel_label(channel)
    case channel
    when 'web' then '网站'
    when 'ios' then 'iOS'
    when 'android' then 'Android'
    when 'h5' then 'H5'
    when 'mini_program' then '小程序'
    else channel
    end
  end

  def risk_reason_label(reason)
    case reason
    when 'expired' then '授权到期'
    when 'scope_exceeded' then '使用范围超限'
    when 'document_missing' then '授权文件缺失'
    when 'none' then '无风险'
    else reason
    end
  end
end