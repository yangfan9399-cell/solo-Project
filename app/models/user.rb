class User < ApplicationRecord
  has_secure_password

  enum :role, { designer: 0, pattern_maker: 1, reviewer: 2, supervisor: 3 }

  has_many :designed_samples, class_name: "Sample", foreign_key: "designer_id"
  has_many :patterned_samples, class_name: "Sample", foreign_key: "pattern_maker_id"
  has_many :owned_samples, class_name: "Sample", foreign_key: "current_owner_id"
  has_many :sample_versions, foreign_key: "created_by_id"
  has_many :reviews, foreign_key: "reviewer_id"

  validates :name, :email, :role, presence: true
  validates :email, uniqueness: true
end
