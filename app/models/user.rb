class User < ApplicationRecord
  has_many :materials, foreign_key: :created_by_id, dependent: :nullify
  has_many :usage_scenarios, foreign_key: :bound_by_id, dependent: :nullify
  has_many :review_logs, foreign_key: :reviewer_id, dependent: :nullify

  ROLES = %w[copyright_manager content_manager legal_reviewer operations].freeze
  DEPARTMENTS = %w[copyright content legal operations].freeze

  validates :name, presence: true
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :role, presence: true, inclusion: { in: ROLES }
  validates :department, presence: true, inclusion: { in: DEPARTMENTS }

  def copyright_manager?
    role == 'copyright_manager'
  end

  def content_manager?
    role == 'content_manager'
  end

  def legal_reviewer?
    role == 'legal_reviewer'
  end

  def operations?
    role == 'operations'
  end
end