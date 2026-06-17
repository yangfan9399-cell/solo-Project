class Annotation < ApplicationRecord
  belongs_to :record

  DISEASE_TYPES = %w[flaking efflorescence discoloration crack other].freeze
  SEVERITIES = %w[mild moderate severe].freeze

  enum :disease_type, DISEASE_TYPES.each_with_object({}) { |v, h| h[v] = v }
  enum :severity, SEVERITIES.each_with_object({}) { |v, h| h[v] = v }

  validates :disease_type, presence: true
  validates :severity, presence: true
  validates :x, :y, :width, :height, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  def disease_type_i18n
    {
      flaking: "起甲",
      efflorescence: "酥碱",
      discoloration: "变色",
      crack: "裂隙",
      other: "其他"
    }[disease_type.to_sym] || disease_type
  end

  def severity_i18n
    {
      mild: "轻微",
      moderate: "中等",
      severe: "重度"
    }[severity.to_sym] || severity
  end

  def color_hex
    color || default_color
  end

  def default_color
    {
      flaking: "#ef4444",
      efflorescence: "#f59e0b",
      discoloration: "#8b5cf6",
      crack: "#3b82f6",
      other: "#6b7280"
    }[disease_type.to_sym] || "#6b7280"
  end

  def area_pixels
    width * height
  end
end
