class Member < ApplicationRecord
  has_many :course_packages, dependent: :destroy
  has_many :consumption_records, through: :course_packages

  validates :name, presence: true
  validates :phone, presence: true, uniqueness: true
end

