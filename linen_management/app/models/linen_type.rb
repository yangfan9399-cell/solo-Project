class LinenType < ApplicationRecord
  CATEGORIES = %w[bedding towel bathrobe tablecloth other].freeze

  has_many :linen_items, dependent: :restrict_with_error
  has_many :damage_claims, dependent: :restrict_with_error

  validates :name, presence: true, uniqueness: true
  validates :category, presence: true, inclusion: { in: CATEGORIES }
  validates :unit_price, presence: true, numericality: { greater_than: 0 }

  def category_name
    I18n.t("linen_categories.#{category}", default: category.humanize)
  end
end
