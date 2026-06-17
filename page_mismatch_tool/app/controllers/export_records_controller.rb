require "csv"

class ExportRecordsController < ApplicationController
  before_action :set_project
  before_action :set_export_record, only: %i[download destroy]

  def index
    @export_records = @project.export_records.order(created_at: :desc)
  end

  def create
    format = params[:format_type] || "csv"
    content, filename = generate_export(format)

    @export_record = @project.export_records.build(
      format: format,
      content: content,
      filename: filename
    )

    if @export_record.save
      redirect_to download_project_export_record_path(@project, @export_record), notice: "导出创建成功。"
    else
      redirect_to project_export_records_path(@project), alert: "导出失败: #{@export_record.errors.full_messages.join('，')}"
    end
  end

  def download
    send_data @export_record.content,
      filename: @export_record.filename,
      type: content_type_for(@export_record.format),
      disposition: "attachment"
  end

  def destroy
    @export_record.destroy!
    redirect_to project_export_records_path(@project), notice: "导出记录已删除。", status: :see_other
  end

  private

  def set_project
    @project = Project.find(params[:project_id])
  end

  def set_export_record
    @export_record = @project.export_records.find(params[:id])
  end

  def generate_export(format)
    mappings = @project.page_mappings.order(:pdf_page_index)

    case format
    when "csv"
      content = CSV.generate do |csv|
        csv << ["PDF页码", "实际页码", "状态", "备注"]
        mappings.each do |m|
          csv << [m.pdf_page_index, m.actual_page_number, m.status, m.notes]
        end
      end
      filename = "#{@project.name}_页码映射_#{Time.current.strftime('%Y%m%d%H%M%S')}.csv"
      [content, filename]

    when "bookmark_json"
      bookmarks = mappings.map do |m|
        {
          pdf_page: m.pdf_page_index,
          actual_page: m.actual_page_number,
          status: m.status,
          notes: m.notes
        }
      end
      content = JSON.pretty_generate(bookmarks)
      filename = "#{@project.name}_书签_#{Time.current.strftime('%Y%m%d%H%M%S')}.json"
      [content, filename]

    else
      ["", "export.txt"]
    end
  end

  def content_type_for(format)
    case format
    when "csv" then "text/csv"
    when "bookmark_json" then "application/json"
    else "text/plain"
    end
  end
end
