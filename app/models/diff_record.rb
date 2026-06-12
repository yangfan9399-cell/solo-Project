class DiffRecord < ApplicationRecord
  FIELD_LABELS = {
    'critical_time' => '关键时间',
    'responsible_party' => '责任对象',
    'amount' => '金额数量',
    'evidence_conclusion' => '证据结论',
    'original_score' => '原始成绩',
    'corrected_score' => '更正成绩',
    'block_reason' => '阻断原因',
    'remedy_path' => '补救路径',
    'conclusion' => '结论'
  }.freeze

  belongs_to :grade_correction
  belongs_to :processing_node
  belongs_to :operator, class_name: 'User'

  validates :field_name, :new_value, :operator, presence: true

  def field_label
    FIELD_LABELS[field_name] || field_name.humanize
  end

  def diff_summary
    "#{field_label}: #{format_value(old_value)} → #{format_value(new_value)}"
  end

  private

  def format_value(value)
    return '空' if value.blank?
    case field_name
    when 'evidence_conclusion' then
      ec_map = {
        'sufficient' => '证据充分',
        'insufficient' => '证据不足',
        'pending' => '待审核',
        'rejected' => '证据不采信'
      }
      ec_map[value] || value.to_s
    when 'critical_time' then value.to_s(:db)
    else value.to_s
    end
  end
end
