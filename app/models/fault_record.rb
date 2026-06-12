class FaultRecord < ApplicationRecord
  include AASM

  TRACKED_FIELDS = %w[
    actual_start_at actual_end_at estimated_cost actual_cost
    notified_confirmation handler_qualified responsible_unit responsible_person
    maintenance_window_start maintenance_window_end
  ].freeze

  enum :source_type, { system_report: 0, manual_report: 1, passenger_report: 2, inspection: 3 }
  enum :current_status, {
    pending_acceptance: 0,
    accepted: 1,
    processing: 2,
    pending_review: 3,
    reviewing: 4,
    returned_for_supplement: 5,
    archived: 6
  }
  enum :fault_type, {
    door_not_opening: 0,
    door_not_closing: 1,
    door_jammed: 2,
    sensor_fault: 3,
    control_system_fault: 4,
    power_fault: 5,
    other: 6
  }
  enum :fault_level, { minor: 0, general: 1, major: 2, severe: 3 }
  enum :abnormal_type, {
    normal: 0,
    qualification_mismatch: 1,
    time_window_conflict: 2,
    notification_unconfirmed: 3
  }

  def self.ransackable_attributes(auth_object = nil)
    %w[id ticket_no line_name station_name platform_door_no source_type
       current_status abnormal_type fault_type fault_level
       reported_at reported_by_id current_owner_id
       responsible_unit responsible_person
       actual_start_at actual_end_at estimated_cost actual_cost
       maintenance_window_start maintenance_window_end
       notified_confirmation handler_qualified
       created_at updated_at]
  end

  def self.ransackable_associations(auth_object = nil)
    %w[reporter current_owner workflow_nodes diff_snapshots evidence_attachments]
  end

  belongs_to :reporter, class_name: "User", foreign_key: "reported_by_id", optional: true
  belongs_to :current_owner, class_name: "User", foreign_key: "current_owner_id", optional: true

  has_many :workflow_nodes, -> { order(created_at: :asc) }, dependent: :destroy
  has_many :diff_snapshots, dependent: :destroy
  has_many :evidence_attachments, dependent: :destroy

  validates :ticket_no, presence: true, uniqueness: true
  validates :line_name, :station_name, :platform_door_no, presence: true

  before_save :ensure_not_archived_for_update, unless: :skip_archive_check?
  before_save :detect_abnormalities, if: :will_save_change_to_tracked_fields?
  after_save :capture_diff_snapshot, if: :saved_changes_to_tracked_fields?
  after_create :create_initial_workflow_node

  attr_accessor :skip_archive_check

  aasm column: :current_status, enum: true do
    state :pending_acceptance, initial: true
    state :accepted
    state :processing
    state :pending_review
    state :reviewing
    state :returned_for_supplement
    state :archived

    event :accept, guards: :not_archived? do
      transitions from: :pending_acceptance, to: :accepted, after: proc { |*args| log_workflow_transition(*args) }
    end

    event :assign_for_processing, guards: :not_archived? do
      transitions from: [:accepted, :returned_for_supplement], to: :processing, after: proc { |*args| log_workflow_transition(*args) }
    end

    event :submit_for_review, guards: :not_archived? do
      transitions from: :processing, to: :pending_review, after: proc { |*args| log_workflow_transition(*args) }
    end

    event :start_review, guards: :not_archived? do
      transitions from: :pending_review, to: :reviewing, after: proc { |*args| log_workflow_transition(*args) }
    end

    event :review_pass, guards: :not_archived? do
      transitions from: :reviewing, to: :archived, after: proc { |*args| perform_archive(*args) }
    end

    event :return_for_supplement, guards: :not_archived? do
      transitions from: [:pending_review, :reviewing], to: :returned_for_supplement, after: proc { |*args| log_workflow_transition(*args) }
    end

    event :reopen, guards: :is_archived? do
      transitions from: :archived, to: :processing, after: proc { |*args| perform_reopen(*args) }
    end
  end

  scope :not_archived, -> { where(is_archived: false) }
  scope :archived_records, -> { where(is_archived: true) }
  scope :abnormal, -> { where.not(abnormal_type: :normal) }
  scope :by_status, ->(status) { where(current_status: status) if status.present? }
  scope :by_line, ->(line) { where(line_name: line) if line.present? }
  scope :by_station, ->(station) { where(station_name: station) if station.present? }
  scope :by_abnormal_type, ->(type) { where(abnormal_type: type) if type.present? }
  scope :date_range, ->(start_date, end_date) { where(reported_at: start_date..end_date) if start_date && end_date }

  def self.status_counts
    group(:current_status).count
  end

  def self.abnormal_type_counts
    abnormal.group(:abnormal_type).count
  end

  def self.line_fault_counts
    group(:line_name).count
  end

  def self.daily_fault_counts(days = 30)
    where("reported_at >= ?", days.days.ago).group("DATE(reported_at)").count
  end

  def self.avg_processing_duration
    where.not(actual_end_at: nil).where.not(actual_start_at: nil)
      .average("EXTRACT(EPOCH FROM (actual_end_at - actual_start_at))")&.to_i || 0
  end

  def in_processing_status?
    processing ? true : false
  end

  def in_review_status?
    pending_review? || reviewing?
  end

  def not_archived?
    !is_archived?
  end

  def current_owner_name
    current_owner&.name || "未分配"
  end

  def reporter_name
    reporter&.name || "系统"
  end

  def source_type_text
    I18n.t("enums.fault_record.source_type.#{source_type}", default: source_type.to_s)
  end

  def current_status_text
    I18n.t("enums.fault_record.current_status.#{current_status}", default: current_status.to_s)
  end

  def fault_type_text
    I18n.t("enums.fault_record.fault_type.#{fault_type}", default: fault_type.to_s)
  end

  def fault_level_text
    I18n.t("enums.fault_record.fault_level.#{fault_level}", default: fault_level.to_s)
  end

  def abnormal_type_text
    I18n.t("enums.fault_record.abnormal_type.#{abnormal_type}", default: abnormal_type.to_s)
  end

  def processing_duration
    return 0 unless actual_start_at && actual_end_at
    ((actual_end_at - actual_start_at) / 60).to_i
  end

  def processing_duration_text
    minutes = processing_duration
    hours = minutes / 60
    mins = minutes % 60
    if hours > 0
      "#{hours}小时#{mins}分钟"
    else
      "#{mins}分钟"
    end
  end

  def critical_changes
    diff_snapshots.where(diff_type: %w[critical_time responsible_object amount evidence])
  end

  def abnormal?
    abnormal_type != "normal"
  end

  private

  def skip_archive_check?
    skip_archive_check == true
  end

  def ensure_not_archived_for_update
    if is_archived? && !will_save_change_to_is_archived?
      errors.add(:base, "已归档的记录不能修改")
      throw(:abort)
    end
  end

  def will_save_change_to_tracked_fields?
    (changed & TRACKED_FIELDS).any?
  end

  def saved_changes_to_tracked_fields?
    (saved_changes.keys & TRACKED_FIELDS).any?
  end

  def detect_abnormalities
    abnormalities = []

    unless handler_qualified?
      self.abnormal_type = :qualification_mismatch
      abnormalities << "处理人员资格不符合要求"
    end

    if maintenance_window_start && maintenance_window_end && actual_start_at && actual_end_at
      window = (maintenance_window_start..maintenance_window_end)
      unless window.cover?(actual_start_at) && window.cover?(actual_end_at)
        self.abnormal_type = :time_window_conflict
        abnormalities << "作业时间不在计划时间窗口内"
      end
    end

    unless notified_confirmation?
      self.abnormal_type = :notification_unconfirmed
      abnormalities << "恢复运营通知未被运营方确认"
    end

    self.blocking_reason = abnormalities.join("；") if abnormalities.any?

    if (handler_qualified? && maintenance_window_valid? && notified_confirmation?)
      self.abnormal_type = :normal if abnormal_type != "normal"
    end
  end

  def maintenance_window_valid?
    return true unless maintenance_window_start && maintenance_window_end && actual_start_at && actual_end_at
    window = (maintenance_window_start..maintenance_window_end)
    window.cover?(actual_start_at) && window.cover?(actual_end_at)
  end

  def capture_diff_snapshot
    last_node = workflow_nodes.last
    return unless last_node

    saved_changes.each do |field, (before_val, after_val)|
      next unless TRACKED_FIELDS.include?(field)

      diff_type = classify_diff(field)
      diff_snapshots.create!(
        workflow_node: last_node,
        field_name: field,
        before_value: before_val.to_s,
        after_value: after_val.to_s,
        diff_type: diff_type
      )
    end
  end

  def classify_diff(field)
    case field
    when "actual_start_at", "actual_end_at", "maintenance_window_start", "maintenance_window_end"
      :critical_time
    when "responsible_unit", "responsible_person"
      :responsible_object
    when "estimated_cost", "actual_cost"
      :amount
    when "notified_confirmation", "handler_qualified"
      :evidence
    else
      :normal
    end
  end

  def create_initial_workflow_node
    workflow_nodes.create!(
      node_type: :status_change,
      from_status: nil,
      to_status: :pending_acceptance,
      action_type: :create_record,
      snapshot_data: attributes.slice(*TRACKED_FIELDS),
      processed_at: Time.current
    )
  end

  def log_workflow_transition(*args)
    options = args.extract_options!
    operator = options[:operator]
    comment = options[:comment]
    from = aasm.from_state
    to = aasm.to_state

    workflow_nodes.create!(
      node_type: :status_change,
      from_status: FaultRecord.current_statuses[from],
      to_status: FaultRecord.current_statuses[to],
      operator: operator,
      action_type: detect_action_type(from, to),
      comment: comment,
      snapshot_data: attributes.slice(*TRACKED_FIELDS),
      processed_at: Time.current
    )
  end

  def perform_archive(*args)
    options = args.extract_options!
    operator = options[:operator]
    comment = options[:comment] || "复核通过，正式归档"
    self.skip_archive_check = true
    update!(is_archived: true)
    workflow_nodes.create!(
      node_type: :status_change,
      from_status: FaultRecord.current_statuses[:reviewing],
      to_status: FaultRecord.current_statuses[:archived],
      operator: operator,
      action_type: :archive,
      comment: comment,
      snapshot_data: attributes.slice(*TRACKED_FIELDS),
      processed_at: Time.current
    )
  end

  def perform_reopen(*args)
    options = args.extract_options!
    operator = options[:operator]
    comment = options[:comment] || "重新处理，生成新节点"
    self.skip_archive_check = true
    update!(is_archived: false)
    workflow_nodes.create!(
      node_type: :node_reopen,
      from_status: FaultRecord.current_statuses[:archived],
      to_status: FaultRecord.current_statuses[:processing],
      operator: operator,
      action_type: :action_reopen,
      comment: comment,
      snapshot_data: attributes.slice(*TRACKED_FIELDS),
      processed_at: Time.current
    )
  end

  def detect_action_type(from, to)
    case [from.to_s, to.to_s]
    when ["pending_acceptance", "accepted"] then :accept
    when ["accepted", "processing"], ["returned_for_supplement", "processing"] then :assign_handler
    when ["processing", "pending_review"] then :submit_for_review
    when ["pending_review", "reviewing"] then :process
    when ["pending_review", "returned_for_supplement"], ["reviewing", "returned_for_supplement"] then :review_return
    else :update_info
    end
  end

  def log_info_update(operator:, comment: nil)
    workflow_nodes.create!(
      node_type: :info_update,
      from_status: FaultRecord.current_statuses[current_status],
      to_status: FaultRecord.current_statuses[current_status],
      operator: operator,
      action_type: :update_info,
      comment: comment || "补充业务记录/现场说明",
      snapshot_data: attributes.slice(*TRACKED_FIELDS),
      processed_at: Time.current
    )
  end
end
