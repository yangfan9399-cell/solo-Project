class Track < ApplicationRecord
  has_many :applications
  has_many :track_authorization_scopes

  validates :title, presence: true
  validates :artist, presence: true
  validates :copyright_holder, presence: true
  validates :duration, presence: true, numericality: { greater_than: 0 }

  def available_for_scenario?(scenario, territory, start_date, end_date)
    track_authorization_scopes.any do |scope|
      scope.scope_type == scenario &&
        scope.territory == territory &&
        scope.valid_from <= start_date &&
        scope.valid_to >= end_date
    end
  end

  def conflicting_applications(start_date, end_date)
    applications.where(
      "start_date <= ? AND end_date >= ?",
      end_date,
      start_date
    ).where.not(status: ["rejected", "draft"])
  end
end