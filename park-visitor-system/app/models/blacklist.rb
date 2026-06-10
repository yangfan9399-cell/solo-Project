class Blacklist < ApplicationRecord
  belongs_to :added_by, class_name: 'Employee'

  validates :license_plate, presence: true
  validates :reason, presence: true
  validates :added_at, presence: true

  scope :active, -> { where(is_active: true) }

  def self.is_blacklisted?(license_plate)
    active.where('license_plate ILIKE ?', license_plate).exists?
  end
end
