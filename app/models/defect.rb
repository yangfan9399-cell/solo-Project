class Defect < ApplicationRecord
  DEFECT_TYPES = %w[开裂 腐朽 虫蛀 残缺 变形 松动 磨损 脱落]
  SEVERITIES = %w[轻微 中等 严重 致命]

  belongs_to :component

  scope :unrepaired, -> { where(repaired: false) }
  scope :by_type, ->(defect_type) { where(defect_type: defect_type) }
  scope :by_severity, ->(severity) { where(severity: severity) }
  scope :critical, -> { where(severity: %w[严重 致命]) }

  def critical?
    severity.in?(%w[严重 致命])
  end

  def component_code
    component.code
  end
end
