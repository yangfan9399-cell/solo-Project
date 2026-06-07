class IssueType < ApplicationRecord
  CATEGORIES = %w[尺码偏差 面料问题 版型问题 工艺问题 设计问题 其他].freeze

  validates :name, :category, presence: true
  validates :name, uniqueness: { scope: :category }

  scope :by_category, ->(category) { where(category: category) if category.present? }
end
