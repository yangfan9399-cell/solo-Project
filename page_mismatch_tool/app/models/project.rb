class Project < ApplicationRecord
  has_many :page_mappings, dependent: :destroy
  has_many :batches, dependent: :destroy
  has_many :export_records, dependent: :destroy
  has_many :anomalies, dependent: :destroy

  validates :name, presence: true

  scope :by_status, ->(status) { where(status: status) }
  scope :search, ->(query) { where("name LIKE :q OR description LIKE :q", q: "%#{query}%") }

  def anomaly_count
    anomalies.count
  end

  def missing_page_count
    page_mappings.where(status: PageMapping::MISSING).count
  end

  def duplicate_page_count
    page_mappings.where(status: PageMapping::DUPLICATE).count
  end

  def inserted_page_count
    page_mappings.where(status: PageMapping::INSERTED).count
  end

  def completed?
    status == "completed"
  end
end
