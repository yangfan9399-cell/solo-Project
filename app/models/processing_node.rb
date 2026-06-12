class ProcessingNode < ApplicationRecord
  NODE_TYPES = {
    'create' => '创建申请',
    'accept' => '受理',
    'processing' => '处理中',
    'submit_review' => '提交复核',
    'approve' => '复核通过',
    'reject' => '驳回',
    'return' => '退回补证',
    'reprocess' => '重新处理',
    'reopen' => '重新打开'
  }.freeze

  belongs_to :grade_correction
  belongs_to :operator, class_name: 'User'

  has_many :diff_records, dependent: :destroy
  has_many :attachments, dependent: :destroy

  validates :node_type, :operator, :content, presence: true

  def node_type_i18n
    NODE_TYPES[node_type] || node_type
  end

  def status_i18n
    GradeCorrection.status_i18n(status)
  end

  def has_attachments?
    attachments.exists?
  end

  def has_diff_records?
    diff_records.exists?
  end
end
