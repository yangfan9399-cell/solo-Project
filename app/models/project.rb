class Project < ApplicationRecord
  has_many :records, -> { order(record_date: :desc) }, dependent: :destroy
  has_many :annotations, through: :records
  has_many :exports, dependent: :destroy

  enum :status, { active: "active", completed: "completed", archived: "archived" }, default: :active

  validates :name, presence: true
  validates :code, presence: true, uniqueness: true

  def disease_summary
    annotations.group(:disease_type).count
  end

  def severity_summary
    annotations.group(:severity).count
  end

  def records_by_year
    records.group_by { |r| r.record_date.year }
  end

  def abnormal_records
    records.select do |r|
      r.abnormal?
    end
  end

  def has_abnormal_data?
    abnormal_records.any?
  end

  def latest_record
    records.first
  end

  def first_record
    records.last
  end

  def disease_progress(disease_type)
    yearly = records_by_year.sort.to_h
    yearly.transform_values do |year_records|
      year_records.sum { |r| r.annotations.where(disease_type: disease_type).count }
    end
  end
end
