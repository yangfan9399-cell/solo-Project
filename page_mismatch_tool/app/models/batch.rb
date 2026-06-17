class Batch < ApplicationRecord
  belongs_to :project
  has_many :export_records, dependent: :nullify

  validates :name, presence: true

  before_create :capture_snapshot

  def capture_snapshot
    self.snapshot = project.page_mappings.to_json
  end

  def page_mappings_from_snapshot
    return [] if snapshot.blank?

    JSON.parse(snapshot)
  end
end
