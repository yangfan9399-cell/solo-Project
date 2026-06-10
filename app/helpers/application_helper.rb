module ApplicationHelper
  def status_badge(status)
    badges = {
      draft: 'bg-gray-100 text-gray-700',
      pending_copyright: 'bg-blue-100 text-blue-700',
      pending_legal: 'bg-indigo-100 text-indigo-700',
      pending_finance: 'bg-purple-100 text-purple-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      disputed: 'bg-orange-100 text-orange-700'
    }
    badges[status.to_sym] || 'bg-gray-100 text-gray-700'
  end

  def status_text(status)
    texts = {
      draft: '草稿',
      pending_copyright: '版权审核中',
      pending_legal: '法务审核中',
      pending_finance: '财务审核中',
      approved: '已通过',
      rejected: '已驳回',
      disputed: '争议中'
    }
    texts[status.to_sym] || status
  end

  def scenario_text(scenario)
    texts = {
      tv_ad: '电视广告',
      online_video: '线上视频',
      live_stream: '直播',
      film: '影视',
      radio: '广播',
      other: '其他'
    }
    texts[scenario.to_sym] || scenario
  end

  def scenario_badge(scenario)
    badges = {
      tv_ad: 'bg-blue-100 text-blue-700',
      online_video: 'bg-indigo-100 text-indigo-700',
      live_stream: 'bg-purple-100 text-purple-700',
      film: 'bg-orange-100 text-orange-700',
      radio: 'bg-cyan-100 text-cyan-700',
      other: 'bg-gray-100 text-gray-700'
    }
    badges[scenario.to_sym] || 'bg-gray-100 text-gray-700'
  end

  def review_badge(status)
    badges = {
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      needs_revision: 'bg-yellow-100 text-yellow-700'
    }
    badges[status.to_sym] || 'bg-gray-100 text-gray-700'
  end

  def review_text(status)
    texts = {
      approved: '通过',
      rejected: '驳回',
      needs_revision: '需修改'
    }
    texts[status.to_sym] || status
  end

  def review_type_text(type)
    texts = {
      copyright: '版权审核',
      legal: '法务审核',
      finance: '财务审核'
    }
    texts[type.to_sym] || type
  end

  def history_text(action)
    texts = {
      created: '创建申请',
      submitted: '提交审核',
      reviewed: '审核',
      approved: '审核通过',
      rejected: '审核驳回',
      disputed: '发起争议',
      settled: '结算完成',
      archived: '归档'
    }
    texts[action.to_sym] || action
  end

  def contract_status_badge(status)
    badges = {
      draft: 'bg-gray-100 text-gray-700',
      pending_signature: 'bg-yellow-100 text-yellow-700',
      signed: 'bg-green-100 text-green-700',
      archived: 'bg-gray-100 text-gray-500'
    }
    badges[status.to_sym] || 'bg-gray-100 text-gray-700'
  end

  def contract_status_text(status)
    texts = {
      draft: '草稿',
      pending_signature: '待签署',
      signed: '已签署',
      archived: '已归档'
    }
    texts[status.to_sym] || status
  end

  def settlement_status_badge(status)
    badges = {
      pending: 'bg-purple-100 text-purple-700',
      confirmed: 'bg-green-100 text-green-700',
      disputed: 'bg-red-100 text-red-700',
      archived: 'bg-gray-100 text-gray-500'
    }
    badges[status.to_sym] || 'bg-gray-100 text-gray-700'
  end

  def settlement_status_text(status)
    texts = {
      pending: '待确认',
      confirmed: '已确认',
      disputed: '争议中',
      archived: '已归档'
    }
    texts[status.to_sym] || status
  end
end