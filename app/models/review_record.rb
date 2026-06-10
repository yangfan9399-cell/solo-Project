class ReviewRecord < ApplicationRecord
  enum :stage, { brand_review: 0, legal_review: 1, publish_review: 2 }
  enum :status, { pending: 0, approved: 1, rejected: 2 }

  belongs_to :interview
  belongs_to :reviewer, class_name: 'User'
end