class User < ApplicationRecord
  enum :role, { operator: 0, brand_manager: 1, legal: 2, publisher: 3 }

  has_many :interviews, foreign_key: :user_id
  has_many :authorizations, foreign_key: :user_id
  has_many :review_records, foreign_key: :reviewer_id
  has_many :change_histories, foreign_key: :user_id
end