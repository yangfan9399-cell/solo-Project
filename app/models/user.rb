class User < ApplicationRecord
  enum :role, { stage_manager: 0, crew_leader: 1, asset_auditor: 2 }, default: :stage_manager

  has_many :applied_borrow_records, class_name: "BorrowRecord", foreign_key: "applicant_id"
  has_many :confirmed_borrow_records, class_name: "BorrowRecord", foreign_key: "confirmer_id"
  has_many :audited_borrow_records, class_name: "BorrowRecord", foreign_key: "auditor_id"
  has_many :led_crews, class_name: "Crew", foreign_key: "leader_id"
  has_many :inspection_records, foreign_key: "inspector_id"
  has_many :handled_compensations, class_name: "Compensation", foreign_key: "handler_id"
  has_many :handled_repairs, class_name: "RepairRecord", foreign_key: "handler_id"

  validates :name, presence: true
  validates :role, presence: true

  def role_name
    I18n.t("roles.#{role}", default: role.humanize)
  end
end
