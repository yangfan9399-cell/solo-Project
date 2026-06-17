class Component < ApplicationRecord
  COMPONENT_TYPES = %w[梁 柱 斗 拱 升 枋 檩 椽 驼峰 雀替]
  ORIENTATIONS = %w[东 南 西 北 东南 东北 西南 西北 上 下]
  STATUSES = %w[在原位 已拆卸 修复中 待复装 已复装 异常]

  belongs_to :project
  has_many :defects, dependent: :destroy
  has_many :component_versions, dependent: :destroy
  has_many :reassembly_records, dependent: :destroy

  serialize :photo_refs, type: Array, coder: JSON

  def photo_refs_text
    photo_refs&.join(", ")
  end

  def photo_refs_text=(value)
    self.photo_refs = value.to_s.split(",").map(&:strip).reject(&:empty?)
  end

  scope :by_type, ->(component_type) { where(component_type: component_type) }
  scope :by_status, ->(status) { where(status: status) }
  scope :by_orientation, ->(orientation) { where(orientation: orientation) }
  scope :by_batch, ->(batch_tag) { where(batch_tag: batch_tag) }
  scope :search, ->(code_or_position) { where("code LIKE ? OR position LIKE ?", "%#{code_or_position}%", "%#{code_or_position}%") }
  scope :with_anomalies, -> {
    joins("LEFT JOIN defects ON defects.component_id = components.id AND defects.severity IN ('严重', '致命')")
      .where("components.status = ? OR components.code IS NULL OR components.code = '' OR components.status = ? AND components.updated_at < ?",
        "异常", "待复装", 30.days.ago)
      .or(where("defects.id IS NOT NULL"))
      .distinct
  }
  scope :status_anomaly, -> { where(status: "异常") }
  scope :critical_defects, -> { joins(:defects).where(defects: { severity: %w[严重 致命] }).distinct }
  scope :no_code, -> { where("code IS NULL OR code = ''") }
  scope :awaiting_reassembly_overdue, -> { where(status: "待复装").where("updated_at < ?", 30.days.ago) }

  before_create :set_sequence
  after_update :track_version

  attr_accessor :skip_version_track

  def full_code
    "#{project.code}-#{code}"
  end

  def defect_count
    defects.count
  end

  def latest_version
    component_versions.order(version_number: :desc).first
  end

  def has_anomaly?
    anomaly_types.any?
  end

  def anomaly_types
    types = []
    types << "状态异常" if status == "异常"
    types << "严重缺损" if defects.where(severity: %w[严重 致命]).exists?
    types << "无编号" if code.blank?
    types << "位置重复" if position.present? && project.components.where(position: position).where.not(id: id).exists?
    types << "待复装超期" if status == "待复装" && updated_at < 30.days.ago
    types
  end

  def create_version(event_type, operator, notes = nil)
    previous_version = latest_version
    version_number = previous_version ? previous_version.version_number + 1 : 1

    snapshot = {
      code: code,
      component_type: component_type,
      position: position,
      orientation: orientation,
      status: status,
      notes: notes
    }

    changed_fields = previous_version ? calculate_changed_fields(previous_version.snapshot_object) : snapshot.keys

    component_versions.create!(
      version_number: version_number,
      batch_tag: batch_tag,
      event_type: event_type,
      object_snapshot: snapshot,
      changed_fields: changed_fields,
      operator: operator,
      notes: notes,
      recorded_at: Time.current
    )
  end

  private

  def set_sequence
    max_sequence = project.components.maximum(:sequence) || 0
    self.sequence = max_sequence + 1
  end

  def track_version
    return unless saved_changes?
    return if skip_version_track

    event_type = if saved_changes.key?("status")
      "status_change"
    else
      "update"
    end

    create_version(event_type, "系统", saved_changes.keys.join("、") + " 已更新")
  end

  def calculate_changed_fields(previous_snapshot)
    changed = []
    current_snapshot = {
      code: code,
      component_type: component_type,
      position: position,
      orientation: orientation,
      status: status,
      notes: notes
    }

    current_snapshot.each do |key, value|
      changed << key.to_s if previous_snapshot[key.to_s] != value && previous_snapshot[key.to_sym] != value
    end

    changed
  end
end
