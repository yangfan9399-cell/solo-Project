class CorrectionRecord < ApplicationRecord
  belongs_to :inspection_record
  belongs_to :workflow_node, optional: true
  belongs_to :handler, class_name: 'User', optional: true

  validates :business_record, presence: true
  validates :site_description, presence: true
  validates :correction_time, presence: true

  scope :for_inspection, ->(record_id) { where(inspection_record_id: record_id) }
  scope :by_handler, ->(handler_id) { where(handler_id: handler_id) }
  scope :recent, -> { order(correction_time: :desc) }

  before_validation :set_defaults, on: :create

  def handler_name
    handler&.name || '未知'
  end

  def formatted_correction_time
    correction_time&.strftime('%Y-%m-%d %H:%M:%S')
  end

  def correction_summary
    {
      business_record: business_record,
      site_description: site_description,
      correction_measure: correction_measure,
      correction_result: correction_result,
      correction_time: formatted_correction_time,
      operator: operator,
      handler: handler_name,
      remark: remark
    }
  end

  def as_json(options = {})
    super(options).merge(
      handler_name: handler_name,
      formatted_correction_time: formatted_correction_time
    )
  end

  private

  def set_defaults
    self.correction_time ||= Time.current
  end
end
