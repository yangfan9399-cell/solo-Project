class Anomaly < ApplicationRecord
  MISSING = "missing"
  DUPLICATE = "duplicate"
  INSERTED = "inserted"
  MISNUMBERED = "misnumbered"

  belongs_to :project
  belongs_to :page_mapping, optional: true

  validates :anomaly_type, presence: true

  scope :unresolved, -> { where(resolved: false) }
  scope :by_type, ->(anomaly_type) { where(anomaly_type: anomaly_type) }
end
