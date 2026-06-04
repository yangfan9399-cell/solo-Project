class User < ApplicationRecord
  has_secure_password

  enum :role, { front_desk: "front_desk", duty_manager: "duty_manager" }

  has_many :reported_repairs, class_name: "RepairRequest", foreign_key: :reporter_id, dependent: :nullify
  has_many :managed_repairs, class_name: "RepairRequest", foreign_key: :manager_id, dependent: :nullify
  has_many :approved_compensations, class_name: "Compensation", foreign_key: :approved_by_id, dependent: :nullify
  has_many :status_changes, class_name: "StatusLog", foreign_key: :changed_by_id, dependent: :nullify
  has_many :escalation_approvals, class_name: "ApprovalEscalation", foreign_key: :approved_by_id, dependent: :nullify

  validates :name, presence: true
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :role, presence: true

  def front_desk?
    role == "front_desk"
  end

  def duty_manager?
    role == "duty_manager"
  end
end
