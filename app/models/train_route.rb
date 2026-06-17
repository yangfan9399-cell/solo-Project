class TrainRoute < ApplicationRecord
  belongs_to :run_chart
  has_many :stations, dependent: :destroy
  has_many :annotations, as: :annotatable, dependent: :destroy
  accepts_nested_attributes_for :stations, allow_destroy: true

  validates :train_no, presence: true, length: { maximum: 50 }
  validates :train_type, inclusion: { in: ['G', 'D', 'Z', 'T', 'K', 'L', 'Y', 'S'] }
  validates :status, inclusion: { in: ['draft', 'validated', 'corrected'] }

  def self.train_type_options
    [
      ['高速动车组', 'G'],
      ['动车组', 'D'],
      ['直达特快', 'Z'],
      ['特快', 'T'],
      ['快速', 'K'],
      ['临时', 'L'],
      ['旅游', 'Y'],
      ['市郊', 'S']
    ]
  end

  def train_type_label
    self.class.train_type_options.detect { |_, v| v == train_type }&.first || train_type
  end

  def status_label
    {
      'draft' => '草稿',
      'validated' => '已校验',
      'corrected' => '已校正'
    }[status] || status
  end

  def start_station
    stations.order(:order).first
  end

  def end_station
    stations.order(:order).last
  end

  def total_distance
    stations.count > 1 ? (stations.order(:order).last.order - stations.order(:order).first.order) * 50 : 0
  end

  def duration
    return 0 unless start_station&.departure_time && end_station&.arrival_time
    (end_station.arrival_time - start_station.departure_time) / 60
  end
end
