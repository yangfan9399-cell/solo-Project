class TrackAuthorizationScope < ApplicationRecord
  belongs_to :track

  enum scope_type: {
    tv_ad: "tv_ad",
    online_video: "online_video",
    live_stream: "live_stream",
    film: "film",
    radio: "radio",
    other: "other"
  }

  validates :scope_type, presence: true
  validates :territory, presence: true
  validates :valid_from, presence: true
  validates :valid_to, presence: true
  validate :valid_to_after_valid_from

  private

  def valid_to_after_valid_from
    return unless valid_from && valid_to
    errors.add(:valid_to, "必须大于起始日期") if valid_to < valid_from
  end
end