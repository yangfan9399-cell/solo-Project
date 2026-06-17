class ExportRecord < ApplicationRecord
  belongs_to :project
  belongs_to :batch, optional: true

  validates :format, presence: true
end
