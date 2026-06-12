class GradeCorrection < ApplicationRecord
  include AASM

  CRITICAL_FIELDS = %w[critical_time responsible_party amount evidence_conclusion original_score corrected_score].freeze

  KEY_FIELDS_FOR_TRACKING = %w[critical_time responsible_party amount evidence_conclusion].freeze

  enum :source, {
    student: 'student',
    teacher: 'teacher',
    academic_affairs: 'academic_affairs',
    online: 'online',
    offline: 'offline',
    email: 'email'
  }

  enum :evidence_conclusion, {
    evidence_sufficient: 'sufficient',
    evidence_insufficient: 'insufficient',
    evidence_pending: 'pending',
    evidence_rejected: 'rejected'
  }

  aasm column: :status, timestamps: true do
    state :pending, initial: true
    state :accepted
    state :processing
    state :reviewing
    state :archived
    state :rejected
    state :returned

    event :accept do
      transitions from: :pending, to: :accepted, after: :after_accept
    end

    event :start_processing do
      transitions from: :accepted, to: :processing, after: :after_start_processing
    end

    event :submit_for_review do
      transitions from: :processing, to: :reviewing, after: :after_submit_for_review
    end

    event :approve do
      transitions from: :reviewing, to: :archived, after: :after_approve
    end

    event :reject do
      transitions from: [:reviewing, :processing], to: :rejected, after: :after_reject
    end

    event :return_to_processor do
      transitions from: :reviewing, to: :returned, after: :after_return_to_processor
    end

    event :reprocess do
      transitions from: :returned, to: :processing, after: :after_reprocess
    end

    event :reopen do
      transitions from: [:archived, :rejected], to: :pending, after: :after_reopen
    end
  end

  belongs_to :current_owner, class_name: 'User', optional: true
  has_many :processing_nodes, -> { order(created_at: :asc) }, dependent: :destroy
  has_many :diff_records, dependent: :destroy
  has_many :attachments, dependent: :destroy

  validates :application_no, :student_name, :student_id, :course_name, :course_code, presence: true
  validates :original_score, :corrected_score, presence: true, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }
  validates :application_reason, presence: true

  before_update :track_diff, if: :critical_fields_changed?
  after_create :create_initial_node

  scope :by_status, ->(status) { where(status: status) if status.present? }
  scope :by_source, ->(source) { where(source: source) if source.present? }
  scope :by_current_owner, ->(user_id) { where(current_owner_id: user_id) if user_id.present? }
  scope :by_evidence_conclusion, ->(ec) { where(evidence_conclusion: ec) if ec.present? }

  def self.evidence_conclusion_value(key)
    mapping = {
      'sufficient' => 'sufficient',
      'insufficient' => 'insufficient',
      'pending_review' => 'pending',
      'rejected_evidence' => 'rejected'
    }
    mapping[key.to_s] || key.to_s
  end

  def evidence_conclusion_display
    self.class.evidence_conclusion_i18n(evidence_conclusion)
  end
  scope :notification_unconfirmed, -> { where(notification_confirmed: false) }
  scope :with_block_reason, -> { where.not(block_reason: nil) }
  scope :archived, -> { where(status: :archived) }
  scope :in_progress, -> { where.not(status: [:archived, :rejected]) }

  class << self
    def status_i18n(status)
      I18n.t("activerecord.enums.grade_correction.status.#{status}", default: status.to_s)
    end

    def source_i18n(source)
      I18n.t("activerecord.enums.grade_correction.source.#{source}", default: source.to_s)
    end

    def evidence_conclusion_i18n(ec)
      ec_map = {
        'sufficient' => '证据充分',
        'insufficient' => '证据不足',
        'pending' => '待审核',
        'rejected' => '证据不采信',
        'evidence_sufficient' => '证据充分',
        'evidence_insufficient' => '证据不足',
        'evidence_pending' => '待审核',
        'evidence_rejected' => '证据不采信'
      }
      ec_map[ec.to_s] || ec.to_s
    end

    def statistics
      {
        total: count,
        pending: by_status('pending').count,
        processing: by_status('processing').count,
        reviewing: by_status('reviewing').count,
        archived: by_status('archived').count,
        rejected: by_status('rejected').count,
        returned: by_status('returned').count,
        with_block: with_block_reason.count,
        notification_unconfirmed: notification_unconfirmed.count,
        average_processing_days: calculate_average_processing_days
      }
    end

    def monthly_statistics
      where(created_at: 6.months.ago..Time.now)
        .group_by_month(:created_at)
        .count
    end

    def calculate_average_processing_days
      archived.joins(:processing_nodes)
              .select('AVG(EXTRACT(DAY FROM processing_nodes.created_at - grade_corrections.created_at)) as avg_days')
              .first
              &.avg_days
              &.round(1) || 0
    end
  end

  def status_i18n
    self.class.status_i18n(status)
  end

  def source_i18n
    self.class.source_i18n(source)
  end

  def evidence_conclusion_i18n
    self.class.evidence_conclusion_i18n(evidence_conclusion)
  end

  def can_edit?
    !archived? && !rejected?
  end

  def can_reprocess?
    archived? || rejected?
  end

  def critical_fields_changed?
    (changed & CRITICAL_FIELDS).any?
  end

  def changed_critical_fields
    changed & CRITICAL_FIELDS
  end

  def score_diff
    return unless original_score && corrected_score
    corrected_score - original_score
  end

  def processing_days
    return 0 unless processing_nodes.any?
    (processing_nodes.last.created_at.to_date - created_at.to_date).to_i
  end

  def latest_node
    processing_nodes.last
  end

  def first_node
    processing_nodes.first
  end

  def operator_names
    processing_nodes.map { |n| n.operator&.name }.compact.uniq.join('、')
  end

  def all_operators
    processing_nodes.map(&:operator).compact.uniq
  end

  def diff_fields_summary
    diff_records.group(:field_name).count
  end

  def has_block_reason?
    block_reason.present?
  end

  def notification_confirmed?
    notification_confirmed
  end

  def current_assignee
    current_owner
  end

  def current_assignee=(user)
    self.current_owner = user
  end

  def current_assignee_id
    current_owner_id
  end

  def current_assignee_id=(id)
    self.current_owner_id = id
  end

  private

  def after_accept(operator:, content: nil)
    create_node(node_type: 'accept', operator: operator, content: content || '受理申请')
    update(current_owner: operator)
    broadcast_updates
  end

  def after_start_processing(operator:, content: nil)
    create_node(node_type: 'processing', operator: operator, content: content || '开始处理')
    update(current_owner: operator)
    broadcast_updates
  end

  def after_submit_for_review(operator:, content: nil)
    create_node(node_type: 'submit_review', operator: operator, content: content || '提交复核')
    quality_reviewer = User.quality_reviewer.first
    update(current_owner: quality_reviewer) if quality_reviewer
    broadcast_updates
  end

  def after_approve(operator:, content: nil, conclusion: nil)
    create_node(node_type: 'approve', operator: operator, content: content || '复核通过，同意更正')
    update(conclusion: conclusion || content, notification_confirmed: true) if conclusion
    broadcast_updates
  end

  def after_reject(operator:, content: nil, block_reason: nil, remedy_path: nil)
    create_node(node_type: 'reject', operator: operator, content: content || '申请驳回')
    update(
      block_reason: block_reason || content,
      remedy_path: remedy_path,
      conclusion: content
    )
    broadcast_updates
  end

  def after_return_to_processor(operator:, content: nil, remedy_path: nil)
    create_node(node_type: 'return', operator: operator, content: content || '退回补证')
    update(remedy_path: remedy_path || content)
    broadcast_updates
  end

  def after_reprocess(operator:, content: nil)
    create_node(node_type: 'reprocess', operator: operator, content: content || '重新处理')
    update(current_owner: operator)
    broadcast_updates
  end

  def after_reopen(operator:, content: nil)
    create_node(node_type: 'reopen', operator: operator, content: content || '重新打开申请')
    update(status: :pending, current_owner: operator)
    broadcast_updates
  end

  def create_initial_node
    create_node(node_type: 'create', operator: current_owner || User.first, content: '申请提交')
  end

  def create_node(node_type:, operator:, content:, status: nil, on_site_explanation: nil, business_record: nil)
    processing_nodes.create!(
      node_type: node_type,
      operator: operator,
      content: content,
      status: status || self.status,
      on_site_explanation: on_site_explanation,
      business_record: business_record
    )
  end

  def track_diff
    return unless current_user

    changed_critical_fields.each do |field|
      diff_records.create!(
        field_name: field,
        old_value: send("#{field}_was"),
        new_value: send(field),
        operator: current_user,
        processing_node: latest_node || processing_nodes.last
      )
    end
    broadcast_updates
  end

  def broadcast_updates
    broadcast_replace_to(
      :grade_corrections,
      target: "grade_correction_#{id}",
      partial: 'grade_corrections/grade_correction',
      locals: { grade_correction: self }
    )
    broadcast_replace_to(
      :grade_corrections,
      target: 'statistics_dashboard',
      partial: 'dashboard/statistics',
      locals: { statistics: self.class.statistics }
    )
  end

  attr_accessor :current_user
end
