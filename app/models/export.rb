class Export < ApplicationRecord
  belongs_to :project

  enum :format, { csv: "csv", json: "json", summary: "summary" }, default: :summary

  validates :format, presence: true

  serialize :record_ids, coder: JSON, type: Array

  def record_count
    record_ids.size
  end

  def generated_at_formatted
    return "" unless generated_at
    generated_at.strftime("%Y-%m-%d %H:%M")
  end
end
