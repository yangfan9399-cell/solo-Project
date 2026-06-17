class AnomalyDetector
  OFFSET_THRESHOLD = 2

  def initialize(project)
    @project = project
  end

  def detect!
    @project.anomalies.unresolved.destroy_all
    count = 0
    count += detect_missing_pages
    count += detect_duplicate_pages
    count += detect_inserted_pages
    count += detect_misnumbered_pages
    count += detect_offset_divergence
    update_page_mapping_statuses
    count
  end

  private

  def detect_missing_pages
    count = 0
    numbers = @project.page_mappings.where.not(actual_page_number: nil).order(:actual_page_number).pluck(:actual_page_number).uniq.sort
    return count if numbers.size < 2

    (numbers.first..numbers.last).each do |n|
      unless numbers.include?(n)
        @project.anomalies.create!(
          anomaly_type: Anomaly::MISSING,
          description: "缺失页码：第#{n}页在页码序列中缺失"
        )
        count += 1
      end
    end
    count
  end

  def detect_duplicate_pages
    count = 0
    grouped = @project.page_mappings.where.not(actual_page_number: nil).group(:actual_page_number).having("COUNT(*) > 1").pluck(:actual_page_number)
    grouped.each do |page_num|
      mappings = @project.page_mappings.where(actual_page_number: page_num)
      mappings.each do |mapping|
        @project.anomalies.create!(
          anomaly_type: Anomaly::DUPLICATE,
          page_mapping: mapping,
          description: "重复页码：页码#{page_num}出现多次"
        )
      end
      count += mappings.size
    end
    count
  end

  def detect_inserted_pages
    count = 0
    @project.page_mappings.where(status: PageMapping::INSERTED).find_each do |mapping|
      @project.anomalies.create!(
        anomaly_type: Anomaly::INSERTED,
        page_mapping: mapping,
        description: "插入页面：PDF索引#{mapping.pdf_page_index}对应的页面为插入页面"
      )
      count += 1
    end
    count
  end

  def detect_misnumbered_pages
    count = 0
    @project.page_mappings.where(status: PageMapping::MISNUMBERED).find_each do |mapping|
      @project.anomalies.create!(
        anomaly_type: Anomaly::MISNUMBERED,
        page_mapping: mapping,
        description: "编号错误：PDF索引#{mapping.pdf_page_index}对应的页面编号为#{mapping.actual_page_number}，编号可能有误"
      )
      count += 1
    end
    count
  end

  def detect_offset_divergence
    count = 0
    @project.page_mappings.where.not(pdf_page_index: nil).where.not(actual_page_number: nil).find_each do |mapping|
      offset = (mapping.pdf_page_index - mapping.actual_page_number).abs
      if offset > OFFSET_THRESHOLD
        @project.anomalies.create!(
          anomaly_type: Anomaly::MISNUMBERED,
          page_mapping: mapping,
          description: "页码偏移过大：PDF索引#{mapping.pdf_page_index}与实际页码#{mapping.actual_page_number}偏差为#{offset}，超过阈值#{OFFSET_THRESHOLD}"
        )
        count += 1
      end
    end
    count
  end

  def update_page_mapping_statuses
    missing_numbers = @project.anomalies.by_type(Anomaly::MISSING).pluck(:description).map { |d| d[/第(\d+)页/, 1]&.to_i }.compact
    duplicate_mapping_ids = @project.anomalies.by_type(Anomaly::DUPLICATE).pluck(:page_mapping_id).compact
    inserted_mapping_ids = @project.anomalies.by_type(Anomaly::INSERTED).pluck(:page_mapping_id).compact
    misnumbered_mapping_ids = @project.anomalies.by_type(Anomaly::MISNUMBERED).pluck(:page_mapping_id).compact

    @project.page_mappings.where(actual_page_number: missing_numbers).update_all(status: PageMapping::MISSING)
    @project.page_mappings.where(id: duplicate_mapping_ids).update_all(status: PageMapping::DUPLICATE)
    @project.page_mappings.where(id: inserted_mapping_ids).update_all(status: PageMapping::INSERTED)
    @project.page_mappings.where(id: misnumbered_mapping_ids).update_all(status: PageMapping::MISNUMBERED)
  end
end
