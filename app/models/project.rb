class Project < ApplicationRecord
  has_many :run_charts, dependent: :destroy
  has_many :versions, dependent: :destroy

  validates :name, presence: true, length: { maximum: 200 }
  validates :code, presence: true, uniqueness: true, length: { maximum: 50 }
  validates :status, inclusion: { in: ['draft', 'active', 'completed', 'archived'] }

  def self.status_options
    [
      ['草稿', 'draft'],
      ['进行中', 'active'],
      ['已完成', 'completed'],
      ['已归档', 'archived']
    ]
  end

  def status_label
    self.class.status_options.detect { |_, v| v == status }&.first || status
  end

  def total_routes
    run_charts.joins(:train_routes).count
  end

  def total_stations
    run_charts.joins(train_routes: :stations).count
  end
end
