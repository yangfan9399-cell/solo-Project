class RubbingsController < ApplicationController
  before_action :set_rubbing, only: [:show, :edit, :update, :destroy, :versions, :warnings]

  def index
    @search = Rubbing.ransack(params[:q])
    @rubbings = @search.result(distinct: true).order(created_at: :desc).page(params[:page]).per(10)
    @status_counts = Rubbing.group(:status).count
  end

  def show
    @inscriptions = @rubbing.inscriptions.order(line_number: :asc, column_number: :asc)
    @footnotes = @rubbing.footnotes.order(created_at: :asc)
    @character_boxes = @rubbing.character_boxes
    @versions = @rubbing.versions.order(created_at: :desc)
    @warnings = collect_warnings
  end

  def new
    @rubbing = Rubbing.new
    @rubbing.inscriptions.build
    @rubbing.footnotes.build
    @rubbing.character_boxes.build
  end

  def edit
  end

  def create
    @rubbing = Rubbing.new(rubbing_params)

    respond_to do |format|
      if @rubbing.save
        create_initial_version
        format.html { redirect_to @rubbing, notice: '拓片记录创建成功。' }
        format.json { render :show, status: :created, location: @rubbing }
      else
        format.html { render :new }
        format.json { render json: @rubbing.errors, status: :unprocessable_entity }
      end
    end
  end

  def update
    respond_to do |format|
      if @rubbing.update(rubbing_params)
        create_version
        format.html { redirect_to @rubbing, notice: '拓片记录更新成功。' }
        format.json { render :show, status: :ok, location: @rubbing }
      else
        format.html { render :edit }
        format.json { render json: @rubbing.errors, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    @rubbing.destroy
    respond_to do |format|
      format.html { redirect_to rubbings_url, notice: '拓片记录已删除。' }
      format.json { head :no_content }
    end
  end

  def search
    @search = Rubbing.ransack(params[:q])
    @rubbings = @search.result(distinct: true).order(created_at: :desc).page(params[:page]).per(10)
    render :index
  end

  def export
    rubbings = Rubbing.all.includes(:inscriptions, :footnotes)
    respond_to do |format|
      format.csv { export_csv(rubbings) }
      format.pdf { export_pdf(rubbings) }
    end
  end

  def export_summary
    rubbings = Rubbing.all.includes(:inscriptions, :footnotes)
    respond_to do |format|
      format.pdf { export_summary_pdf(rubbings) }
    end
  end

  def versions
    @versions = @rubbing.versions.order(created_at: :desc)
  end

  def warnings
    @warnings = collect_warnings
    render partial: 'warnings'
  end

  private

  def set_rubbing
    @rubbing = Rubbing.find(params[:id])
  end

  def rubbing_params
    params.require(:rubbing).permit(
      :no, :title, :dynasty, :location, :dating, :image, :image_thumb,
      :status, :checksum, :remarks, :created_by,
      inscriptions_attributes: [:id, :content, :line_number, :column_number, :position, :is_broken, :broken_note, :_destroy],
      footnotes_attributes: [:id, :content, :source, :page, :note, :_destroy],
      character_boxes_attributes: [:id, :char_index, :x, :y, :width, :height, :char, :note, :_destroy]
    )
  end

  def create_initial_version
    @rubbing.versions.create(
      version: '1.0',
      changelog: '初始创建',
      changed_by: @rubbing.created_by || '系统',
      batch: 'INIT'
    )
  end

  def create_version
    current_version = @rubbing.latest_version
    new_version = if current_version
      parts = current_version.version.split('.').map(&:to_i)
      parts[-1] += 1
      parts.join('.')
    else
      '1.0'
    end

    @rubbing.versions.create(
      version: new_version,
      changelog: params[:changelog] || '更新记录',
      changed_by: @rubbing.created_by || '系统',
      batch: "BATCH_#{Time.now.strftime('%Y%m%d')}"
    )
  end

  def collect_warnings
    warnings = []
    warnings << { type: :danger, message: "存在 #{@rubbing.broken_count} 处断字" } if @rubbing.broken_count > 0
    warnings << { type: :warning, message: "尚未添加释文内容" } if @rubbing.inscriptions.empty?
    warnings << { type: :info, message: "尚未添加字框标注" } if @rubbing.character_boxes.empty?
    warnings << { type: :warning, message: "尚未添加脚注引用" } if @rubbing.footnotes.empty?
    warnings
  end

  def export_csv(rubbings)
    filename = "rubbings_export_#{Time.now.strftime('%Y%m%d')}.csv"
    headers['Content-Disposition'] = "attachment; filename=\"#{filename}\""
    headers['Content-Type'] = 'text/csv; charset=utf-8'

    response.body = CSV.generate(encoding: 'utf-8') do |csv|
      csv << ['编号', '标题', '朝代', '出土地点', '年代', '状态', '释文数', '断字数', '字框数', '脚注数', '创建人', '创建时间']
      rubbings.each do |r|
        csv << [
          r.no, r.title, r.dynasty, r.location, r.dating, r.status,
          r.inscriptions.count, r.broken_count, r.char_count, r.footnotes.count,
          r.created_by, r.created_at.strftime('%Y-%m-%d')
        ]
      end
    end
  end

  def export_pdf(rubbings)
    require 'prawn'
    require 'prawn/table'

    filename = "rubbings_export_#{Time.now.strftime('%Y%m%d')}.pdf"
    headers['Content-Disposition'] = "attachment; filename=\"#{filename}\""
    headers['Content-Type'] = 'application/pdf'

    pdf = Prawn::Document.new(page_size: 'A4', page_layout: :portrait, margin: [40, 40, 40, 40])
    pdf.font('SimSun', fallback: ['Helvetica'])

    pdf.text '旧城门铭文拓片整理系统 - 导出报告', size: 18, align: :center, style: :bold
    pdf.text "导出时间: #{Time.now.strftime('%Y年%m月%d日 %H:%M')}", size: 10, align: :center
    pdf.move_down 20

    table_data = [['编号', '标题', '朝代', '状态', '释文数', '断字数', '字框数']]
    rubbings.each do |r|
      table_data << [
        r.no, r.title, r.dynasty, r.status,
        r.inscriptions.count, r.broken_count, r.char_count
      ]
    end

    pdf.table(table_data, header: true, cell_style: { size: 8 }, column_widths: [60, 150, 60, 60, 50, 50, 50])

    pdf.move_down 20
    pdf.text "总记录数: #{rubbings.count}", size: 10
    pdf.text "断字记录: #{rubbings.select { |r| r.broken_count > 0 }.count}", size: 10

    send_data pdf.render, filename: filename, type: 'application/pdf'
  end

  def export_summary_pdf(rubbings)
    require 'prawn'
    require 'prawn/table'

    filename = "rubbings_summary_#{Time.now.strftime('%Y%m%d')}.pdf"
    headers['Content-Disposition'] = "attachment; filename=\"#{filename}\""
    headers['Content-Type'] = 'application/pdf'

    pdf = Prawn::Document.new(page_size: 'A4', page_layout: :portrait, margin: [40, 40, 40, 40])
    pdf.font('SimSun', fallback: ['Helvetica'])

    pdf.text '旧城门铭文拓片整理系统 - 摘要报告', size: 18, align: :center, style: :bold
    pdf.text "报告时间: #{Time.now.strftime('%Y年%m月%d日 %H:%M')}", size: 10, align: :center
    pdf.move_down 30

    pdf.text '一、统计概览', size: 14, style: :bold
    pdf.move_down 10

    stats = [
      ['总拓片数', rubbings.count],
      ['待整理', rubbings.where(status: '待整理').count],
      ['整理中', rubbings.where(status: '整理中').count],
      ['已完成', rubbings.where(status: '已完成').count],
      ['待审核', rubbings.where(status: '待审核').count],
      ['已审核', rubbings.where(status: '已审核').count],
      ['总释文数', rubbings.sum { |r| r.inscriptions.count }],
      ['总字数', rubbings.sum { |r| r.char_count }],
      ['断字总数', rubbings.sum { |r| r.broken_count }],
      ['总脚注数', rubbings.sum { |r| r.footnotes.count }]
    ]

    pdf.table(stats, cell_style: { size: 10 }, column_widths: [120, 80])

    pdf.move_down 30
    pdf.text '二、拓片清单', size: 14, style: :bold
    pdf.move_down 10

    table_data = [['编号', '标题', '朝代', '出土地点', '年代', '状态']]
    rubbings.each do |r|
      table_data << [r.no, r.title, r.dynasty, r.location, r.dating, r.status]
    end

    pdf.table(table_data, header: true, cell_style: { size: 8 }, column_widths: [60, 120, 60, 100, 80, 60])

    pdf.move_down 20
    pdf.text '三、异常数据提示', size: 14, style: :bold
    pdf.move_down 10

    warning_items = []
    rubbings.each do |r|
      if r.broken_count > 0
        warning_items << ["#{r.no} #{r.title}", "存在 #{r.broken_count} 处断字"]
      end
      if r.inscriptions.empty?
        warning_items << ["#{r.no} #{r.title}", "未添加释文"]
      end
    end

    if warning_items.empty?
      pdf.text '无异常数据', size: 10
    else
      pdf.table(warning_items, cell_style: { size: 8 }, column_widths: [200, 200])
    end

    send_data pdf.render, filename: filename, type: 'application/pdf'
  end
end
