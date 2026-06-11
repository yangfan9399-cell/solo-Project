class LiveSession < ApplicationRecord
  belongs_to :anchor
  has_many :orders, dependent: :destroy

  validates :title, presence: true, length: { maximum: 200 }
  validates :started_at, presence: true
  validates :anchor_id, presence: true

  scope :by_anchor, ->(anchor_id) { where(anchor_id: anchor_id) }
  scope :live_now, -> { where("started_at <= ? AND (ended_at IS NULL OR ended_at >= ?)", Time.current, Time.current) }
  scope :upcoming, -> { where("started_at > ?", Time.current) }
  scope :finished, -> { where("ended_at IS NOT NULL AND ended_at < ?", Time.current) }
  scope :ordered, -> { order(started_at: :desc) }
end
