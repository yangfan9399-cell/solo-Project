class Station < ApplicationRecord
  belongs_to :train_route
  has_many :annotations, as: :annotatable, dependent: :destroy

  validates :name, presence: true, length: { maximum: 100 }
  validates :order, presence: true, numericality: { greater_than_or_equal_to: 1 }

  def arrival_str
    arrival_time&.strftime('%H:%M') || '-'
  end

  def departure_str
    departure_time&.strftime('%H:%M') || '-'
  end

  def stop_duration_str
    stop_duration.present? && stop_duration > 0 ? "#{stop_duration}分" : '-'
  end

  def is_anomalous?
    annotations.where(type: 'anomaly').exists?
  end

  def anomaly_reason
    annotations.where(type: 'anomaly').first&.content
  end
end
