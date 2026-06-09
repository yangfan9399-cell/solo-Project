class User < ApplicationRecord
  ROLES = %w[handover_staff laundry_staff inspector finance_staff].freeze

  has_many :handover_batches, class_name: 'LinenBatch', foreign_key: 'handover_user_id'
  has_many :return_batches, class_name: 'LinenBatch', foreign_key: 'return_user_id'
  has_many :inspected_batches, class_name: 'LinenBatch', foreign_key: 'inspector_id'
  has_many :settled_batches, class_name: 'LinenBatch', foreign_key: 'finance_user_id'
  has_many :confirmed_claims, class_name: 'DamageClaim', foreign_key: 'confirmed_by_id'
  has_many :events, class_name: 'LinenEvent', foreign_key: 'user_id'

  validates :name, presence: true, uniqueness: true
  validates :role, presence: true, inclusion: { in: ROLES }

  def role_name
    I18n.t("roles.#{role}", default: role.humanize)
  end

  def handover_staff?
    role == 'handover_staff'
  end

  def laundry_staff?
    role == 'laundry_staff'
  end

  def inspector?
    role == 'inspector'
  end

  def finance_staff?
    role == 'finance_staff'
  end
end
