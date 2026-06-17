class RunChart < ApplicationRecord
  belongs_to :project
  has_many :train_routes, dependent: :destroy
  has_many :annotations, dependent: :destroy
  has_many :versions, dependent: :destroy

  validates :name, presence: true, length: { maximum: 200 }
  validates :date, presence: true

  def total_routes
    train_routes.count
  end

  def total_stations
    train_routes.joins(:stations).count
  end

  def anomalies_count
    annotations.where(type: 'anomaly').count
  end
end
