class SampleVersion < ApplicationRecord
  belongs_to :sample
  belongs_to :created_by, class_name: "User"

  has_many :reviews, dependent: :destroy

  validates :version_number, presence: true, numericality: { greater_than: 0 }

  default_scope -> { order(version_number: :desc) }
end
