class WorkflowNode < ApplicationRecord
  enum :node_type, { status_change: 0, info_update: 1, evidence_upload: 2, comment: 3, node_reopen: 4 }
  enum :action_type, {
    create_record: 0,
    accept: 1,
    assign_handler: 2,
    process: 3,
    submit_for_review: 4,
    review_pass: 5,
    review_return: 6,
    archive: 7,
    action_reopen: 8,
    supplement: 9,
    upload_evidence: 10,
    update_info: 11
  }

  belongs_to :fault_record
  belongs_to :operator, class_name: "User", foreign_key: "operator_id", optional: true
  has_many :diff_snapshots, dependent: :destroy
  has_many :evidence_attachments, dependent: :destroy

  validates :node_type, presence: true

  def node_type_text
    I18n.t("enums.workflow_node.node_type.#{node_type}", default: node_type.to_s)
  end

  def action_type_text
    I18n.t("enums.workflow_node.action_type.#{action_type}", default: action_type.to_s)
  end

  def from_status_text
    return "无" unless from_status
    FaultRecord.current_statuses.key(from_status)
  end

  def to_status_text
    return "无" unless to_status
    FaultRecord.current_statuses.key(to_status)
  end

  def operator_name
    operator&.name || "系统"
  end
end
