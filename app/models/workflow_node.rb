class WorkflowNode < ApplicationRecord
  extend Enumerize

  enumerize :node_type, in: {
    acceptance: 'acceptance',
    processing_start: 'processing_start',
    review_submit: 'review_submit',
    review_start: 'review_start',
    approval: 'approval',
    rejection: 'rejection',
    reprocessing: 'reprocessing',
    archive: 'archive',
    general: 'general'
  }, default: :general

  enumerize :from_state, in: InspectionRecord.current_state.values
  enumerize :to_state, in: InspectionRecord.current_state.values

  belongs_to :inspection_record
  belongs_to :operator, class_name: 'User', optional: true
  has_many :evidence_attachments, dependent: :destroy
  has_one :correction_record, dependent: :destroy

  validates :inspection_record, presence: true
  validates :to_state, presence: true
  validates :event, presence: true

  scope :chronological, -> { order(created_at: :asc) }
  scope :reverse_chronological, -> { order(created_at: :desc) }
  scope :by_type, ->(type) { where(node_type: type) }

  def operator_name
    operator&.name || '系统自动'
  end

  def operator_role
    operator&.role_text || 'system'
  end

  def from_state_text
    from_state && InspectionRecord.human_attribute_name("current_state.#{from_state}")
  end

  def to_state_text
    InspectionRecord.human_attribute_name("current_state.#{to_state}")
  end

  def event_text
    I18n.t("workflow_events.#{event}", default: event.to_s.humanize)
  end

  def has_diff?
    diff_fields.present? && diff_fields.is_a?(Hash) && diff_fields.any?
  end

  def formatted_diff
    return [] unless has_diff?

    diff_fields.map do |field, values|
      {
        field: field,
        field_name: InspectionRecord.human_attribute_name(field),
        old_value: values[0],
        new_value: values[1],
        changed: values[0] != values[1]
      }
    end
  end

  def timeline_info
    {
      id: id,
      node_type: node_type_text,
      event: event_text,
      from: from_state_text,
      to: to_state_text,
      operator: operator_name,
      operator_role: operator_role,
      time: created_at,
      remark: remark,
      has_diff: has_diff?,
      diff: formatted_diff,
      attachments: evidence_attachments.as_json(only: [:id, :description]),
      correction: correction_record&.as_json(only: [:id, :business_record, :site_description, :correction_measure, :correction_result, :remark])
    }
  end
end
