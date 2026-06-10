class User < ApplicationRecord
  has_secure_password

  has_many :applications
  has_many :reviews, foreign_key: :reviewer_id

  enum role: {
    admin: "admin",
    biz_admin: "biz_admin",
    copyright_admin: "copyright_admin",
    legal: "legal",
    finance: "finance"
  }

  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :name, presence: true
  validates :role, presence: true
end