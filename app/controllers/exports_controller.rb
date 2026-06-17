class ExportsController < ApplicationController
  before_action :set_project
  before_action :set_export, only: [:show, :destroy, :download]

  def index
    @exports = @project.exports.order(generated_at: :desc)
  end

  def show
  end

  def create
    record_ids = params[:record_ids] || @project.records.pluck(:id)
    format_type = params[:format_type] || "summary"

    @export = @project.exports.new(
      format: format_type,
      record_ids: Array(record_ids).map(&:to_i),
      generated_at: Time.current,
      file_path: generate_export_file(format_type, record_ids)
    )

    if @export.save
      redirect_to project_export_path(@project, @export), notice: "导出成功"
    else
      redirect_to project_exports_path(@project), alert: "导出失败: #{@export.errors.full_messages.join(', ')}"
    end
  end

  def destroy
    @export.destroy
    redirect_to project_exports_path(@project), notice: "导出记录已删除"
  end

  def download
    if File.exist?(@export.file_path)
      send_file @export.file_path, filename: export_filename, disposition: "attachment"
    else
      redirect_to project_export_path(@project, @export), alert: "文件不存在"
    end
  end

  private

  def set_project
    @project = Project.find(params[:project_id])
  end

  def set_export
    @export = @project.exports.find(params[:id])
  end

  def generate_export_file(format_type, record_ids)
    records = @project.records.where(id: record_ids)
    dir = Rails.root.join("storage", "exports")
    FileUtils.mkdir_p(dir)

    filename = "#{@project.code}_#{format_type}_#{Time.now.strftime('%Y%m%d%H%M%S')}.#{format_ext(format_type)}"
    filepath = File.join(dir, filename)

    case format_type
    when "csv"
      generate_csv(filepath, records)
    when "json"
      generate_json(filepath, records)
    when "summary"
      generate_summary_txt(filepath, records)
    end

    filepath
  end

  def format_ext(format_type)
    { csv: "csv", json: "json", summary: "txt" }[format_type.to_sym] || "txt"
  end

  def export_filename
    "#{@project.code}_#{@export.format}_#{@export.generated_at.strftime('%Y%m%d')}.#{format_ext(@export.format)}"
  end

  def generate_csv(filepath, records)
    require "csv"
    CSV.open(filepath, "w") do |csv|
      csv << ["项目编号", "项目名称", "批次号", "记录日期", "版本类型", "病害类型", "严重程度", "位置X", "位置Y", "宽度", "高度", "描述"]
      records.each do |record|
        record.annotations.each do |ann|
          csv << [
            @project.code,
            @project.name,
            record.batch_number,
            record.record_date,
            record.version_type_i18n,
            ann.disease_type_i18n,
            ann.severity_i18n,
            ann.x, ann.y, ann.width, ann.height,
            ann.description
          ]
        end
      end
    end
  end

  def generate_json(filepath, records)
    data = {
      project: {
        code: @project.code,
        name: @project.name,
        location: @project.location,
        dynasty: @project.dynasty,
        status: @project.status
      },
      records: records.map do |r|
        {
          batch_number: r.batch_number,
          record_date: r.record_date.to_s,
          version_type: r.version_type,
          weather: r.weather,
          temperature: r.temperature,
          humidity: r.humidity,
          annotations: r.annotations.map do |a|
            {
              disease_type: a.disease_type,
              severity: a.severity,
              x: a.x, y: a.y, width: a.width, height: a.height,
              description: a.description
            }
          end,
          scale_markers: r.scale_markers.map do |s|
            { x: s.x, y: s.y, length_cm: s.length_cm, length_pixels: s.length_pixels, orientation: s.orientation }
          end
        }
      end
    }
    File.write(filepath, JSON.pretty_generate(data))
  end

  def generate_summary_txt(filepath, records)
    total_annotations = records.sum { |r| r.annotations.count }
    disease_counts = records.flat_map { |r| r.annotations }.group_by(&:disease_type).transform_values(&:count)
    severity_counts = records.flat_map { |r| r.annotations }.group_by(&:severity).transform_values(&:count)
    area_total = records.sum(&:area_cm2).round(2)

    content = <<~TXT
      ======================================================
      石窟壁画颜料病害观察系统 - 项目摘要报告
      ======================================================

      项目信息
      --------
      项目编号: #{@project.code}
      项目名称: #{@project.name}
      地理位置: #{@project.location}
      所属朝代: #{@project.dynasty || '未知'}
      项目状态: #{@project.status == 'active' ? '进行中' : @project.status == 'completed' ? '已完成' : '已归档'}

      统计概览
      --------
      记录批次: #{records.size} 批
      病害标注: #{total_annotations} 处
      病害面积: #{area_total} cm²
      导出时间: #{Time.current.strftime('%Y-%m-%d %H:%M:%S')}

      病害类型统计
      ------------
    TXT

    disease_counts.each do |type, count|
      type_name = { flaking: "起甲", efflorescence: "酥碱", discoloration: "变色", crack: "裂隙", other: "其他" }[type.to_sym] || type
      content << "  #{type_name}: #{count} 处\n"
    end

    content << <<~TXT

      严重程度统计
      ------------
    TXT

    severity_counts.each do |sev, count|
      sev_name = { mild: "轻微", moderate: "中等", severe: "重度" }[sev.to_sym] || sev
      content << "  #{sev_name}: #{count} 处\n"
    end

    content << <<~TXT

      批次详情
      --------
    TXT

    records.order(record_date: :desc).each do |r|
      content << "  [#{r.record_date}] #{r.version_type_i18n} - #{r.batch_number}\n"
      content << "    病害数: #{r.annotations.count}处 | 温度: #{r.temperature}°C | 湿度: #{r.humidity}%\n"
      if r.abnormal?
        content << "    ⚠️ 异常: #{r.abnormal_reasons.join(', ')}\n"
      end
      content << "\n"
    end

    content << "======================================================\n"

    File.write(filepath, content)
  end
end
