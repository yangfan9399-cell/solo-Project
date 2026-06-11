class User < ApplicationRecord
  belongs_to :fleet, optional: true

  validates :name, :employee_id, :role, presence: true
  validates :employee_id, uniqueness: true

  enum :role, {
    dispatcher: 'dispatcher',
    repair_station: 'repair_station',
    safety_officer: 'safety_officer',
    team_leader: 'team_leader',
    admin: 'admin'
  }

  enum :status, {
    active: 'active',
    inactive: 'inactive'
  }

  def display_role
    I18n.t("enums.user.role.#{role}", default: role)
  end
end
