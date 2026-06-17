class PageMapping < ApplicationRecord
  NORMAL = "normal"
  MISSING = "missing"
  DUPLICATE = "duplicate"
  INSERTED = "inserted"
  BLANK = "blank"
  MISNUMBERED = "misnumbered"

  belongs_to :project
  has_one :anomaly, dependent: :nullify

  validates :pdf_page_index, presence: true, uniqueness: { scope: :project_id }

  scope :anomalies, -> { where.not(status: NORMAL) }
  scope :by_status, ->(status) { where(status: status) }
end
