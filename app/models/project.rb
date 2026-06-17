class Project < ApplicationRecord
  BUILDING_TYPES = %w[殿堂 楼阁 亭 塔 廊 牌楼]
  STATUSES = %w[普查中 拆卸中 修复中 复装中 已完成]

  has_many :components, dependent: :destroy
  has_many :defects, through: :components

  scope :active, -> { where.not(status: "已完成") }
  scope :completed, -> { where(status: "已完成") }
  scope :by_status, ->(status) { where(status: status) }
  scope :search, ->(keyword) { where("name LIKE ? OR code LIKE ? OR location LIKE ?", "%#{keyword}%", "%#{keyword}%", "%#{keyword}%") }

  def components_count
    components.count
  end

  def defects_count
    defects.count
  end

  def completion_rate
    return 0 if components_count.zero?
    completed_components = components.where(status: "已复装").count
    (completed_components.to_f / components_count * 100).round(2)
  end

  def abnormal_components
    components.where(status: "异常")
  end

  def anomalies_summary
    status_anomaly = components.status_anomaly.count
    critical_defects = components.critical_defects.count
    no_code = components.no_code.count
    duplicate_positions = components.where.not(position: nil).where.not(position: "").group(:position).having("COUNT(*) > 1").count.sum { |_, v| v }
    awaiting_overdue = components.awaiting_reassembly_overdue.count

    {
      status_anomaly: status_anomaly,
      critical_defects: critical_defects,
      no_code: no_code,
      duplicate_positions: duplicate_positions,
      awaiting_overdue: awaiting_overdue,
      total: status_anomaly + critical_defects + no_code + duplicate_positions + awaiting_overdue
    }
  end
end
