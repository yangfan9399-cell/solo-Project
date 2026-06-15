class GameSession < ApplicationRecord
  has_many :operation_details, dependent: :destroy
  has_many :growth_histories, dependent: :destroy
  has_many :contamination_results, dependent: :destroy

  enum :status, {
    initialized: 0,
    in_progress: 1,
    paused: 2,
    completed: 3,
    abandoned: 4,
    rolled_back: 5
  }, prefix: false

  GRID_SIZE = 20
  CELL_EMPTY = 0
  CELL_TARGET = 1
  CELL_CONTAMINANT = 2
  CELL_TARGET_ZONE = 3
  CELL_ANTIBIOTIC = 4

  STRAINS = {
    1 => { name: "大肠杆菌 BL21", color: "#4CAF50", optimal_temp: 37.0, temp_range: [30, 42], growth_rate: 0.15, ph_range: [6.0, 8.0] },
    2 => { name: "酿酒酵母 BY4741", color: "#FFC107", optimal_temp: 30.0, temp_range: [20, 37], growth_rate: 0.12, ph_range: [5.0, 7.5] },
    3 => { name: "枯草芽孢杆菌 168", color: "#2196F3", optimal_temp: 37.0, temp_range: [25, 45], growth_rate: 0.18, ph_range: [6.0, 8.5] },
    4 => { name: "铜绿假单胞菌 PAO1", color: "#9C27B0", optimal_temp: 37.0, temp_range: [28, 42], growth_rate: 0.10, ph_range: [5.5, 8.0] }
  }

  CONTAMINANTS = {
    101 => { name: "金黄色葡萄球菌", color: "#F44336", optimal_temp: 37.0, competitiveness: 0.8 },
    102 => { name: "黑曲霉孢子", color: "#795548", optimal_temp: 28.0, competitiveness: 0.6 },
    103 => { name: "白色念珠菌", color: "#607D8B", optimal_temp: 37.0, competitiveness: 0.7 }
  }

  before_validation :generate_session_code, on: :create
  after_create :initialize_colony_grid

  def generate_session_code
    self.session_code ||= "PETRI-#{Time.now.strftime('%Y%m%d')}-#{SecureRandom.hex(4).upcase}"
  end

  def initialize_colony_grid
    grid = Array.new(GRID_SIZE) { Array.new(GRID_SIZE, CELL_EMPTY) }
    center = GRID_SIZE / 2
    2.times do |i|
      2.times do |j|
        grid[center - 1 + i][center - 1 + j] = CELL_TARGET
      end
    end
    target_points = []
    (GRID_SIZE - 6...GRID_SIZE - 2).each do |x|
      (2...6).each do |y|
        target_points << [x, y]
      end
    end
    self.colony_grid = grid.to_json
    self.target_zone_points = target_points.to_json
    self.actual_coverage = calculate_coverage(grid)
    save!
  end

  def calculate_coverage(grid)
    target_cells = 0
    grid.each do |row|
      row.each { |cell| target_cells += 1 if cell == CELL_TARGET }
    end
    (target_cells.to_f / (GRID_SIZE * GRID_SIZE) * 100).round(2)
  end

  def grid_as_array
    JSON.parse(colony_grid || "[]")
  end

  def target_zone_as_array
    JSON.parse(target_zone_points || "[]")
  end

  def target_strain_info
    STRAINS[target_strain_id] || STRAINS[1]
  end

  def progress_percentage
    (current_round.to_f / max_rounds * 100).round(1)
  end

  def settlement_details_hash
    JSON.parse(settlement_details || "{}")
  end

  def can_rollback_to?(round)
    round < current_round && round > 0
  end

  def contaminants_list
    contamination_results.where(is_detected: true).group_by(&:contaminant_strain_id).map do |sid, items|
      info = CONTAMINANTS[sid] || { name: "未知污染菌", color: "#999999" }
      {
        strain_id: sid,
        name: info[:name],
        color: info[:color],
        max_coverage: items.max_by(&:contaminant_coverage)&.contaminant_coverage || 0,
        last_seen_round: items.max_by(&:round_number)&.round_number || 0,
        total_nutrient_consumed: items.sum(&:nutrient_consumed)
      }
    end
  end
end
