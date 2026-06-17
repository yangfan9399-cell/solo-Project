class ReassemblyRecord < ApplicationRecord
  RESULTS = %w[一致 位置偏差 需调整 异常 未核对]

  belongs_to :component

  scope :verified, -> { where(verified: true) }
  scope :unverified, -> { where(verified: false) }
  scope :by_result, ->(result) { where(result: result) }

  def passed?
    result == "一致"
  end

  def component_code
    component.code
  end
end
