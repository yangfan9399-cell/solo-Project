class CustomerNote < ApplicationRecord
  belongs_to :course_package
  belongs_to :author, class_name: 'User'

  NOTE_TYPES = %w[general refund_request refund_reject follow_up].freeze

  validates :content, presence: true
  validates :note_type, presence: true, inclusion: { in: NOTE_TYPES }
end
