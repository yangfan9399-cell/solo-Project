class Version < ApplicationRecord
  belongs_to :project, optional: true
  belongs_to :run_chart, optional: true

  validates :batch_no, presence: true, length: { maximum: 50 }
  validates :version_no, presence: true, length: { maximum: 50 }
  validates :status, inclusion: { in: ['generated', 'exported', 'archived'] }

  def self.status_options
    [
      ['已生成', 'generated'],
      ['已导出', 'exported'],
      ['已归档', 'archived']
    ]
  end

  def status_label
    status_options.detect { |_, v| v == status }&.first || status
  end

  def export_summary
    return nil unless export_path && File.exist?(export_path)
    JSON.parse(File.read(export_path)) rescue nil
  end

  def self.generate_batch(project, run_chart)
    latest_version = where(project_id: project.id, run_chart_id: run_chart.id).order(version_no: :desc).first
    new_version_no = latest_version ? "V#{sprintf('%03d', latest_version.version_no.gsub('V', '').to_i + 1)}" : 'V001'
    batch_no = "#{project.code}-#{Date.today.strftime('%Y%m%d')}"

    create!(
      project: project,
      run_chart: run_chart,
      batch_no: batch_no,
      version_no: new_version_no,
      status: 'generated'
    )
  end
end
