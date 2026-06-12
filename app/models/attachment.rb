class Attachment < ApplicationRecord
  EVIDENCE_TYPES = {
    'transcript' => '成绩单',
    'exam_paper' => '试卷',
    'appeal_letter' => '申诉信',
    'teacher_proof' => '教师证明',
    'notification' => '通知书',
    'other' => '其他'
  }.freeze

  belongs_to :grade_correction
  belongs_to :processing_node

  validates :file_name, :file_type, presence: true

  def evidence_type_i18n
    EVIDENCE_TYPES[evidence_type] || evidence_type
  end
end
