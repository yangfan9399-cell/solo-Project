class ColorMeasurement < ApplicationRecord
  belongs_to :proof

  def status_label
    is_qualified ? '合格' : '不合格'
  end

  def status_color
    is_qualified ? 'text-green-600' : 'text-red-600'
  end

  def delta_e_level
    return '优秀' if delta_e < 1.0
    return '良好' if delta_e < 2.0
    return '合格' if delta_e < 3.0
    return '需注意' if delta_e < 4.0
    '超标'
  end

  def delta_e_color
    return 'text-green-600' if delta_e < 1.0
    return 'text-blue-600' if delta_e < 2.0
    return 'text-yellow-600' if delta_e < 3.0
    return 'text-orange-600' if delta_e < 4.0
    'text-red-600'
  end
end