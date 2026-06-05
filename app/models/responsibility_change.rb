class ResponsibilityChange < ApplicationRecord
  belongs_to :course_package
  belongs_to :from_consultant, class_name: 'User'
  belongs_to :to_consultant, class_name: 'User'
  belongs_to :transferred_by, class_name: 'User'

  validates :transfer_reason, presence: true
end
