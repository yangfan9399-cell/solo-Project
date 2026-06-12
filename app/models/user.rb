class User < ApplicationRecord
  has_secure_password

  enum :role, {
    frontline_processor: 'frontline_processor',
    quality_reviewer: 'quality_reviewer'
  }

  has_many :owned_applications, class_name: 'GradeCorrection', foreign_key: 'current_owner_id'
  has_many :processed_nodes, class_name: 'ProcessingNode', foreign_key: 'operator_id'
  has_many :diff_records, class_name: 'DiffRecord', foreign_key: 'operator_id'

  validates :name, :role, presence: true

  def display_name
    "#{name} (#{role_i18n})"
  end

  def role_i18n
    case role
    when 'frontline_processor' then '一线处理人'
    when 'quality_reviewer' then '质控复核人'
    else role
    end
  end

  def can_process?
    frontline_processor? || quality_reviewer?
  end

  def can_review?
    quality_reviewer?
  end
end
