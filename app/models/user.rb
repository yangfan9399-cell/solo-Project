class User < ApplicationRecord
  ROLES = [
    ["前台", "receptionist"],
    ["技师", "technician"],
    ["主管", "supervisor"],
    ["管理员", "admin"]
  ].freeze

  has_secure_password

  validates :username, presence: true, uniqueness: true
  validates :name, presence: true
  validates :role, presence: true, inclusion: { in: ROLES.map(&:last) }

  def can_confirm?
    %w[technician supervisor admin].include?(role)
  end

  def can_approve_reissue?
    %w[supervisor admin].include?(role)
  end

  def can_access_admin?
    %w[supervisor admin].include?(role)
  end
end