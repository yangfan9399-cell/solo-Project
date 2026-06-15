class ContaminationResult < ApplicationRecord
  belongs_to :game_session

  validates :round_number, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :contaminant_strain_id, presence: true

  scope :detected, -> { where(is_detected: true) }
  scope :for_round, ->(r) { where(round_number: r) }
  scope :severe, -> { where(severity: ["high", "critical"]) }

  SEVERITY_LABELS = {
    low: "轻微",
    medium: "中等",
    high: "严重",
    critical: "危急"
  }

  def severity_label
    SEVERITY_LABELS[severity.to_sym] || severity
  end

  def contaminant_info
    GameSession::CONTAMINANTS[contaminant_strain_id] || { name: contaminant_name, color: "#999999" }
  end

  def contaminant_cells_array
    JSON.parse(contaminant_cells || "[]")
  end

  def competition_zones_array
    JSON.parse(competition_zones || "[]")
  end

  def before_state_hash
    JSON.parse(before_state || "{}")
  end

  def after_state_hash
    JSON.parse(after_state || "{}")
  end

  def diff_summary
    before = before_state_hash
    after = after_state_hash
    diffs = []
    diffs << "营养消耗: #{(after['nutrient'] || 0).to_f - (before['nutrient'] || 0).to_f}" if before['nutrient'] && after['nutrient']
    diffs << "目标覆盖率变化: #{((after['target_coverage'] || 0).to_f - (before['target_coverage'] || 0).to_f).round(2)}%" if before['target_coverage'] && after['target_coverage']
    diffs << "污染覆盖率变化: #{((after['contaminant_coverage'] || 0).to_f - (before['contaminant_coverage'] || 0).to_f).round(2)}%" if before['contaminant_coverage'] && after['contaminant_coverage']
    diffs.join("; ")
  end

  def impact_assessment
    {
      nutrient_impact: (target_nutrient_loss.to_f / 100.0 * 100).round(1),
      growth_impact: target_growth_impact.to_f,
      competition_risk: (competition_index.to_f * 100).round(1),
      overall: case severity
               when "critical" then "致命威胁"
               when "high" then "严重威胁"
               when "medium" then "中度威胁"
               else "轻微威胁"
               end
    }
  end
end
