class InspectionRecord < ApplicationRecord
  belongs_to :vehicle

  validates :inspector, :inspection_date, :inspection_type, :overall_result, presence: true

  enum :inspection_type, {
    pre_departure: 'pre_departure',
    routine: 'routine',
    special: 'special'
  }

  enum :overall_result, {
    pass: 'pass',
    fail: 'fail',
    conditional: 'conditional'
  }

  STATUS_VALUES = %w[正常 异常 待检].freeze

  validates :brakes_status, :tires_status, :lights_status, :steering_status,
            :oil_status, :water_status, :cleaning_status,
            inclusion: { in: STATUS_VALUES }, allow_nil: true

  after_save :add_inspection_history

  def passed?
    pass? || conditional?
  end

  def failed_items
    items = []
    %w[brakes tires lights steering oil water cleaning].each do |item|
      status = send("#{item}_status")
      items << { item: item, status: status } if status == '异常'
    end
    items
  end

  private

  def add_inspection_history
    vehicle.history_nodes.create!(
      node_type: :inspection,
      title: '车辆检查完成',
      description: "检查类型：#{inspection_type}，结果：#{overall_result}#{issues_found.present? ? "；问题：#{issues_found}" : ''}",
      operator: inspector,
      operator_role: 'safety_officer',
      happened_at: inspection_date,
      metadata: {
        inspection_record_id: id,
        inspection_type: inspection_type,
        overall_result: overall_result,
        failed_items: failed_items
      }
    )
  end
end
