class InspectionRecord < ApplicationRecord
  has_paper_trail

  extend Enumerize

  enumerize :source, in: {
    daily_inspection: 'daily_inspection',
    special_inspection: 'special_inspection',
    complaint: 'complaint',
    third_party: 'third_party',
    other: 'other'
  }, default: :daily_inspection

  enumerize :defect_type, in: {
    cleanliness: 'cleanliness',
    facility: 'facility',
    maintenance: 'maintenance',
    odor: 'odor',
    management: 'management',
    other: 'other'
  }, default: :cleanliness

  enumerize :sample_type, in: {
    normal_delivery: 'normal_delivery',
    qualification_mismatch: 'qualification_mismatch',
    time_window_conflict: 'time_window_conflict',
    notification_unconfirmed: 'notification_unconfirmed'
  }, default: :normal_delivery

  enumerize :defect_level, in: {
    minor: 'minor',
    major: 'major',
    critical: 'critical'
  }, default: :minor

  enumerize :current_state, in: {
    pending: 'pending',
    accepted: 'accepted',
    processing: 'processing',
    review_pending: 'review_pending',
    reviewing: 'reviewing',
    rejected: 'rejected',
    archived: 'archived'
  }, default: :pending

  state_machine :current_state, initial: :pending do
    event :accept do
      transition pending: :accepted
    end

    event :process do
      transition accepted: :processing
    end

    event :submit_review do
      transition processing: :review_pending
    end

    event :start_review do
      transition review_pending: :reviewing
    end

    event :archive do
      transition reviewing: :archived
    end

    event :reject do
      transition reviewing: :rejected
    end

    event :reprocess do
      transition rejected: :processing
      transition archived: :processing
    end

    before_transition do |record, transition|
      record.create_workflow_node(transition)
    end

    after_transition on: :accept do |record|
      record.update(accepted_at: Time.current)
    end

    after_transition on: :process do |record|
      record.update(processing_at: Time.current)
    end

    after_transition on: :submit_review do |record|
      record.update(review_pending_at: Time.current)
    end

    after_transition on: :start_review do |record|
      record.update(reviewing_at: Time.current)
    end

    after_transition on: :archive do |record|
      record.update(archived_at: Time.current)
    end

    after_transition on: :reject do |record|
      record.update(rejected_at: Time.current)
    end

    after_transition on: :reprocess do |record|
      record.update(processing_at: Time.current, rejected_at: nil)
    end
  end

  belongs_to :handler, class_name: 'User', optional: true
  belongs_to :reviewer, class_name: 'User', optional: true
  has_many :workflow_nodes, -> { order(created_at: :asc) }, dependent: :destroy
  has_many :evidence_attachments, dependent: :destroy
  has_many :correction_records, dependent: :destroy

  validates :record_no, presence: true, uniqueness: true
  validates :toilet_name, presence: true
  validates :inspection_time, presence: true

  before_validation :generate_record_no, on: :create
  after_commit :broadcast_updates, on: [:update, :create], if: :should_broadcast?

  scope :active, -> { where.not(current_state: 'archived') }
  scope :archived, -> { where(current_state: 'archived') }
  scope :abnormal, -> { where.not(sample_type: 'normal_delivery') }
  scope :normal_samples, -> { where(sample_type: 'normal_delivery') }
  scope :by_state, ->(state) { where(current_state: state) }
  scope :by_sample_type, ->(type) { where(sample_type: type) }
  scope :by_defect_type, ->(type) { where(defect_type: type) }
  scope :overdue, -> { where('deadline < ?', Time.current).where.not(current_state: 'archived') }

  def create_workflow_node(transition)
    diff = calculate_diff(transition)
    workflow_nodes.create!(
      from_state: transition.from_name,
      to_state: transition.to_name,
      event: transition.event,
      operator_id: Current.user&.id,
      node_type: determine_node_type(transition),
      diff_fields: diff,
      remark: transition.args.first&.dig(:remark)
    )
  end

  def calculate_diff(transition)
    previous_changes.except('updated_at', 'current_state', 'lock_version').tap do |changes|
      if transition.event == :reprocess || transition.event == :reject
        changes['block_reason'] = [block_reason_was, block_reason] if block_reason_changed?
        changes['remedy_path'] = [remedy_path_was, remedy_path] if remedy_path_changed?
      end
    end
  end

  def determine_node_type(transition)
    case transition.event
    when :accept then 'acceptance'
    when :process then 'processing_start'
    when :submit_review then 'review_submit'
    when :start_review then 'review_start'
    when :archive then 'archive'
    when :reject then 'rejection'
    when :reprocess then 'reprocessing'
    else 'general'
    end
  end

  def archived?
    current_state == 'archived'
  end

  def abnormal?
    sample_type != 'normal_delivery'
  end

  def key_fields_changed?
    inspection_time_changed? || responsible_unit_changed? || fine_amount_changed? || evidence_conclusion_changed?
  end

  def score_difference
    return 0 unless score_before && score_after
    score_after - score_before
  end

  def status_summary
    {
      state: current_state_text,
      handler: handler&.name,
      reviewer: reviewer&.name,
      days_passed: days_passed,
      is_overdue: overdue?,
      abnormal: abnormal?
    }
  end

  def days_passed
    return 0 unless inspection_time
    ((Time.current - inspection_time) / 1.day).to_i
  end

  def overdue?
    return false if archived? || deadline.nil?
    deadline < Time.current
  end

  def current_responsible
    case current_state
    when 'pending', 'accepted' then handler
    when 'processing' then handler
    when 'review_pending', 'reviewing' then reviewer
    when 'rejected' then handler
    else nil
    end
  end

  def available_events(user)
    events = []

    if archived?
      events << :reprocess if user.admin? && may_reprocess?
      return events
    end

    if user.can_handle?(self)
      events << :accept if may_accept?
      events << :process if may_process?
      events << :submit_review if may_submit_review?
      events << :reprocess if may_reprocess?
    end

    if user.can_review?(self)
      events << :start_review if may_start_review?
      events << :archive if may_archive?
      events << :reject if may_reject?
    end

    events
  end

  def block_info
    return nil unless abnormal?

    {
      sample_type: sample_type_text,
      block_reason: block_reason,
      remedy_path: remedy_path,
      diff_fields: diff_fields_from_nodes
    }
  end

  def diff_fields_from_nodes
    workflow_nodes.where.not(diff_fields: nil).pluck(:diff_fields).compact.reduce({}, :merge)
  end

  def reprocess_with_new_node(operator, params)
    return false unless may_reprocess?

    transaction do
      update!(params)
      reprocess!
    end
  end

  class << self
    def statistics
      {
        total: count,
        pending: by_state('pending').count,
        processing: by_state('processing').count,
        review_pending: by_state('review_pending').count,
        reviewing: by_state('reviewing').count,
        archived: by_state('archived').count,
        rejected: by_state('rejected').count,
        abnormal: abnormal.count,
        normal: normal_samples.count,
        overdue: overdue.count,
        avg_score_diff: average('score_after - score_before').to_f.round(2),
        by_sample_type: group(:sample_type).count,
        by_defect_type: group(:defect_type).count,
        by_state_detail: group(:current_state).count
      }
    end

    def trend_data(days = 30)
      start_date = days.days.ago.to_date
      (start_date..Date.current).map do |date|
        day_records = where('DATE(created_at) = ?', date)
        {
          date: date,
          created: day_records.count,
          archived: day_records.where(current_state: 'archived').count,
          abnormal: day_records.abnormal.count
        }
      end
    end
  end

  private

  def generate_record_no
    return if record_no.present?
    date_part = Time.current.strftime('%Y%m%d')
    sequence = InspectionRecord.where('record_no LIKE ?', "XC#{date_part}%").count + 1
    self.record_no = "XC#{date_part}#{sequence.to_s.rjust(4, '0')}"
  end

  def should_broadcast?
    return false if Current.user.nil?
    key_fields_changed? || saved_change_to_current_state?
  end

  def key_fields_changed?
    saved_change_to_inspection_time? ||
      saved_change_to_responsible_unit? ||
      saved_change_to_fine_amount? ||
      saved_change_to_evidence_conclusion? ||
      saved_change_to_score_before? ||
      saved_change_to_score_after? ||
      saved_change_to_block_reason? ||
      saved_change_to_remedy_path?
  end

  def broadcast_updates
    Turbo::StreamsChannel.broadcast_replace_to(
      'inspection_records',
      target: "inspection_record_#{id}",
      partial: 'inspection_records/record',
      locals: { record: self }
    )

    Turbo::StreamsChannel.broadcast_replace_to(
      "inspection_record_#{id}",
      target: 'record_detail',
      partial: 'inspection_records/detail',
      locals: { record: self }
    )

    Turbo::StreamsChannel.broadcast_replace_to(
      'dashboard_statistics',
      target: 'statistics_panel',
      partial: 'inspection_records/statistics_panel',
      locals: { statistics: InspectionRecord.statistics }
    )
  end
end
