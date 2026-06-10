class HistoryRecord < ApplicationRecord
  belongs_to :report

  OPERATIONS = [
    ["报告生成", "generated"],
    ["领取请求", "pickup_requested"],
    ["技师确认", "confirmed"],
    ["报告交付", "delivered"],
    ["补打申请", "reissue_requested"],
    ["补打批准", "reissue_approved"],
    ["补打拒绝", "reissue_rejected"],
    ["补打完成", "reissued"],
    ["身份证不符", "id_mismatch"],
    ["异常处理", "exception"]
  ].freeze

  validates :operation, presence: true, inclusion: { in: OPERATIONS.map(&:last) }
  validates :operator, presence: true

  def operation_text
    OPERATIONS.find { |_, value| value == operation }&.first || operation
  end
end