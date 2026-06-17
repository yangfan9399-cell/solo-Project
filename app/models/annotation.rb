class Annotation < ApplicationRecord
  self.inheritance_column = nil

  belongs_to :run_chart
  belongs_to :annotatable, polymorphic: true, optional: true

  validates :type, inclusion: { in: ['note', 'anomaly', 'correction', 'marker'] }
  validates :status, inclusion: { in: ['pending', 'confirmed', 'resolved'] }

  def self.type_options
    [
      ['备注', 'note'],
      ['异常', 'anomaly'],
      ['校正', 'correction'],
      ['标记', 'marker']
    ]
  end

  def self.status_options
    [
      ['待处理', 'pending'],
      ['已确认', 'confirmed'],
      ['已解决', 'resolved']
    ]
  end

  def type_label
    type_options.detect { |_, v| v == type }&.first || type
  end

  def status_label
    status_options.detect { |_, v| v == status }&.first || status
  end

  def severity_level
    case type
    when 'anomaly' then 'danger'
    when 'correction' then 'warning'
    when 'note' then 'info'
    else 'secondary'
    end
  end
end
