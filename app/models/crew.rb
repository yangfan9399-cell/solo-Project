class Crew < ApplicationRecord
  belongs_to :leader, class_name: "User", optional: true

  has_many :borrow_records
  has_many :props, through: :borrow_records

  validates :name, presence: true
end
