class Footnote < ApplicationRecord
  belongs_to :rubbing

  validates :content, presence: true
  validates :source, presence: true
end
