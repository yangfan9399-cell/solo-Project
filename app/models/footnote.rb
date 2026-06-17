class Footnote < ApplicationRecord
  belongs_to :rubbing

  validates :content, presence: true
  validates :source, presence: true

  def self.ransackable_attributes(auth_object = nil)
    ["content", "id", "note", "page", "rubbing_id", "source"]
  end

  def self.ransackable_associations(auth_object = nil)
    ["rubbing"]
  end
end
