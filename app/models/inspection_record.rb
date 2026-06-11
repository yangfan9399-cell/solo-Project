class InspectionRecord < ApplicationRecord
  belongs_to :return_order

  enum :condition, {
    excellent: 'excellent',
    good: 'good',
    fair: 'fair',
    poor: 'poor'
  }

  enum :final_decision, {
    resale: 'resale',
    loss: 'loss',
    dispute: 'dispute'
  }

  validates :return_order_id, presence: true
  validates :condition, presence: true
  validates :final_decision, presence: true
  validates :inspector_name, presence: true, length: { maximum: 100 }
  validates :damage_description, length: { maximum: 1000 }

  scope :by_return_order, ->(return_order_id) { where(return_order_id: return_order_id) }
  scope :by_condition, ->(condition) { where(condition: condition) }
  scope :by_final_decision, ->(final_decision) { where(final_decision: final_decision) }
  scope :by_inspector, ->(inspector_name) { where(inspector_name: inspector_name) }
  scope :ordered, -> { order(created_at: :desc) }

  def condition_label
    {
      'excellent' => '全新',
      'good' => '良好',
      'fair' => '一般',
      'poor' => '较差'
    }[condition]
  end

  def final_decision_label
    {
      'resale' => '可二次销售',
      'loss' => '建议报损',
      'dispute' => '退款争议'
    }[final_decision]
  end
end
