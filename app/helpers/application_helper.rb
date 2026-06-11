module ApplicationHelper
  def return_order_status_tag(return_order)
    status = return_order.status
    content_tag(:span, class: "status-tag status-#{status}") do
      StatusHistory.status_label(status)
    end
  end

  def return_order_status_options
    ReturnOrder.statuses.keys.map do |status|
      [StatusHistory.status_label(status), status]
    end
  end

  def anchor_options
    Anchor.order(:name).map { |a| [a.name, a.id] }
  end

  def category_options
    Product::CATEGORIES.map { |c| [c, c] }
  end

  def condition_options
    InspectionRecord.conditions.keys.map do |condition|
      [condition_label(condition), condition]
    end
  end

  def final_decision_options
    InspectionRecord.final_decisions.keys.map do |decision|
      [final_decision_label(decision), decision]
    end
  end

  def condition_label(condition)
    {
      'excellent' => '全新',
      'good' => '良好',
      'fair' => '一般',
      'poor' => '较差'
    }[condition.to_s]
  end

  def final_decision_label(decision)
    {
      'resale' => '可二次销售',
      'loss' => '建议报损',
      'dispute' => '退款争议'
    }[decision.to_s]
  end

  def format_amount(amount)
    number_to_currency(amount, unit: '¥', precision: 2)
  end

  def format_datetime(time)
    time&.strftime('%Y-%m-%d %H:%M:%S')
  end

  def percentage(value)
    number_to_percentage(value, precision: 1)
  end
end
