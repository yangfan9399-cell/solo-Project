class Archive < ApplicationRecord
  belongs_to :seal_application
  belongs_to :auditor, class_name: 'User'

  enum :status, { pending: 0, completed: 1, missing_pages: 2 }

  validates :file_name, presence: true
  validates :page_count, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validates :status, presence: true

  def status_name
    { pending: '待归档', completed: '已完成', missing_pages: '缺页' }[status.to_sym] || status.humanize
  end

  def has_missing_pages?
    missing_pages.to_i > 0
  end
end
