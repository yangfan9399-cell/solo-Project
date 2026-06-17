class Version < ApplicationRecord
  belongs_to :rubbing

  validates :version, presence: true
  validates :changelog, presence: true
end
