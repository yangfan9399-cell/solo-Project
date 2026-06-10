class VisitRecord < ApplicationRecord
  belongs_to :reservation
  belongs_to :entry_guard, class_name: 'Employee', optional: true
  belongs_to :exit_guard, class_name: 'Employee', optional: true
  belongs_to :entry_entrance, class_name: 'Entrance', optional: true
  belongs_to :exit_entrance, class_name: 'Entrance', optional: true
  belongs_to :supervisor, class_name: 'Employee', optional: true
  has_many :history_nodes, dependent: :destroy

  enum :status, {
    pending_verification: 0,
    pending_approval: 1,
    approved: 2,
    blocked: 3,
    entered: 4,
    exited: 5
  }, prefix: true

  validates :reservation, presence: true

  delegate :visitor, :vehicle, :host, to: :reservation

  def add_history_node(action:, actor:, notes: nil)
    history_nodes.create!(
      action: action,
      actor: actor,
      notes: notes
    )
  end

  def stay_duration
    return nil unless actual_entry_at && actual_exit_at
    actual_exit_at - actual_entry_at
  end

  def stay_duration_formatted
    duration = stay_duration
    return 'N/A' unless duration

    hours = duration / 3600
    minutes = (duration % 3600) / 60
    "#{hours.to_i}h #{minutes.to_i}m"
  end

  def may_verify?
    pending_verification?
  end

  def may_approve?
    pending_approval?
  end

  def may_block?
    pending_approval?
  end

  def may_enter?
    approved?
  end

  def may_exit?
    entered?
  end

  def approve!(supervisor:, entrance:, guard:)
    update!(status: :entered, supervisor_id: supervisor.id, entry_entrance_id: entrance.id, entry_guard_id: guard.id, actual_entry_at: Time.current)
    add_history_node(action: '安保主管批准', actor: supervisor, notes: '车辆获准入园')
    add_history_node(action: '入园', actor: guard, notes: "入口: #{entrance.name}")
  end

  def block!(supervisor:, blocking_reason:)
    update!(status: :blocked, supervisor_id: supervisor.id, blocking_reason: blocking_reason)
    add_history_node(action: '安保主管拦截', actor: supervisor, notes: blocking_reason)
  end

  def record_entry!(entrance:, guard:)
    update!(
      status: :entered,
      actual_entry_at: Time.current,
      entry_entrance_id: entrance.id,
      entry_guard_id: guard.id
    )
    add_history_node(action: '入园', actor: guard, notes: "入口: #{entrance.name}")
  end

  def record_exit!(entrance:, guard:)
    update!(
      status: :exited,
      actual_exit_at: Time.current,
      exit_entrance_id: entrance.id,
      exit_guard_id: guard.id
    )
    add_history_node(action: '离园', actor: guard, notes: "出口: #{entrance.name}")
  end
end
