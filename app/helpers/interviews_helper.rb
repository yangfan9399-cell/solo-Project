module InterviewsHelper
  def status_label(status)
    labels = {
      draft: '草稿',
      pending_brand_review: '待品牌审核',
      pending_legal_review: '待法务复核',
      pending_publish: '待发布',
      published: '已发布',
      rejected: '已退回'
    }
    labels[status.to_sym] || status.to_s.humanize
  end

  def status_class(status)
    classes = {
      draft: 'bg-gray-100 text-gray-800',
      pending_brand_review: 'bg-yellow-100 text-yellow-800',
      pending_legal_review: 'bg-orange-100 text-orange-800',
      pending_publish: 'bg-blue-100 text-blue-800',
      published: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }
    classes[status.to_sym] || 'bg-gray-100 text-gray-800'
  end

  def channel_label(channel)
    labels = {
      website: '官网',
      wechat: '微信',
      weibo: '微博',
      douyin: '抖音',
      xiaohongshu: '小红书',
      other: '其他'
    }
    labels[channel.to_sym] || channel.to_s.humanize
  end

  def respondent_type_label(type)
    labels = {
      employee: '员工',
      customer: '客户',
      partner: '合作伙伴',
      expert: '专家',
      other: '其他'
    }
    labels[type.to_sym] || type.to_s.humanize
  end

  def review_stage_label(stage)
    labels = {
      brand_review: '品牌审核',
      legal_review: '法务复核',
      publish_review: '发布确认'
    }
    labels[stage.to_sym] || stage.to_s.humanize
  end

  def review_status_label(status)
    labels = {
      pending: '待审核',
      approved: '已通过',
      rejected: '已退回'
    }
    labels[status.to_sym] || status.to_s.humanize
  end

  def review_status_class(status)
    classes = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }
    classes[status.to_sym] || 'bg-gray-100 text-gray-800'
  end

  def field_label(field)
    labels = {
      'title' => '标题',
      'content' => '内容',
      'publish_date' => '发布日期',
      'channel' => '发布渠道',
      'respondent_id' => '受访者'
    }
    labels[field] || field.humanize
  end

  def format_value(field, value)
    case field
    when 'publish_date'
      value.present? ? Date.parse(value).strftime('%Y-%m-%d') : '未设置'
    when 'channel'
      channel_label(value)
    when 'respondent_id'
      respondent = Respondent.find_by(id: value)
      respondent&.name || '未指定'
    else
      value.presence || '空'
    end
  end
end