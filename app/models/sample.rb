class Sample < ApplicationRecord
  MAX_REVISIONS_BEFORE_SUPERVISOR = 3

  enum :status, {
    draft: 0,
    pattern_making: 1,
    review: 2,
    revision: 3,
    finalized: 4
  }

  belongs_to :designer, class_name: "User"
  belongs_to :pattern_maker, class_name: "User", optional: true
  belongs_to :current_owner, class_name: "User", optional: true

  has_many :sample_versions, -> { order(version_number: :desc) }, dependent: :destroy
  has_many :reviews, through: :sample_versions
  has_many :all_reviews, class_name: "Review", foreign_key: "sample_id", dependent: :destroy

  validates :style_number, presence: true, uniqueness: true
  validates :category, presence: true
  validates :version_count, numericality: { greater_than_or_equal_to: 0 }

  scope :by_category, ->(category) { where(category: category) if category.present? }
  scope :by_status, ->(status) { where(status: status) if status.present? }
  scope :by_pattern_maker, ->(pattern_maker_id) { where(pattern_maker_id: pattern_maker_id) if pattern_maker_id.present? }

  def revision_count
    [version_count - 1, 0].max
  end

  def needs_supervisor_confirmation?
    revision_count >= MAX_REVISIONS_BEFORE_SUPERVISOR && !finalized?
  end

  def current_version
    sample_versions.first
  end

  def first_version
    sample_versions.last
  end

  def cycle_days
    return nil unless submitted_at
    end_date = finalized_at || Time.current
    (end_date - submitted_at).to_i / 1.day
  end

  def issue_types_summary
    all_reviews.each_with_object(Hash.new(0)) do |review, hash|
      Array(review.issues).each do |issue|
        hash[issue["type"]] += 1 if issue["type"].present?
      end
    end
  end
end
