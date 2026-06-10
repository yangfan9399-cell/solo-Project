class Employee < ApplicationRecord
  belongs_to :department
  has_many :hosted_reservations, class_name: 'Reservation', foreign_key: 'host_id', dependent: :nullify
  has_many :guard_entries, class_name: 'VisitRecord', foreign_key: 'entry_guard_id', dependent: :nullify
  has_many :guard_exits, class_name: 'VisitRecord', foreign_key: 'exit_guard_id', dependent: :nullify
  has_many :supervised_visits, class_name: 'VisitRecord', foreign_key: 'supervisor_id', dependent: :nullify
  has_many :added_blacklists, class_name: 'Blacklist', foreign_key: 'added_by_id', dependent: :nullify

  validates :name, presence: true
  validates :employee_number, presence: true, uniqueness: true

  def name_and_department
    "#{name} - #{department.name}"
  end

  def security_guard?
    is_security_guard
  end

  def security_supervisor?
    is_security_supervisor
  end
end
