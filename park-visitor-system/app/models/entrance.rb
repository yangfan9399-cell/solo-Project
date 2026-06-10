class Entrance < ApplicationRecord
  has_many :reservations, dependent: :nullify
  has_many :entry_visit_records, class_name: 'VisitRecord', foreign_key: 'entry_entrance_id', dependent: :nullify
  has_many :exit_visit_records, class_name: 'VisitRecord', foreign_key: 'exit_entrance_id', dependent: :nullify

  validates :name, presence: true

  scope :active, -> { where(is_active: true) }
end
