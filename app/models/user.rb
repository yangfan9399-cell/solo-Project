class User < ApplicationRecord
  ROLES = %w[consultant manager].freeze

  has_many :consulted_packages, class_name: 'CoursePackage', foreign_key: 'consultant_id'
  has_many :performed_records, class_name: 'ConsumptionRecord', foreign_key: 'performed_by_id'
  has_many :reviewed_nodes, class_name: 'ReviewNode', foreign_key: 'reviewer_id'
  has_many :transferred_changes, class_name: 'ResponsibilityChange', foreign_key: 'transferred_by_id'

  validates :name, presence: true
  validates :role, presence: true, inclusion: { in: ROLES }

  def consultant?
    role == 'consultant'
  end

  def manager?
    role == 'manager'
  end
end

