class Rubbing < ApplicationRecord
  has_many :inscriptions, dependent: :destroy
  has_many :character_boxes, dependent: :destroy
  has_many :footnotes, dependent: :destroy
  has_many :versions, dependent: :destroy

  validates :no, presence: true, uniqueness: true
  validates :title, presence: true

  STATUS_OPTIONS = ['待整理', '整理中', '已完成', '待审核', '已审核']

  def self.ransackable_attributes(auth_object = nil)
    ["checksum", "created_at", "created_by", "dating", "dynasty", "id", "image", "image_thumb", "location", "no", "remarks", "status", "title", "updated_at"]
  end

  def self.ransackable_associations(auth_object = nil)
    ["character_boxes", "footnotes", "inscriptions", "versions"]
  end

  def full_text
    inscriptions.pluck(:content).join(' ')
  end

  def broken_count
    inscriptions.where(is_broken: true).count
  end

  def char_count
    character_boxes.count
  end

  def latest_version
    versions.order(created_at: :desc).first
  end

  def has_warnings?
    broken_count > 0 || inscriptions.empty?
  end
end
