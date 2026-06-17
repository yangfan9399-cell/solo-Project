class Record < ApplicationRecord
  belongs_to :project
  has_many :annotations, dependent: :destroy
  has_many :scale_markers, dependent: :destroy

  enum :version_type, { survey: "survey", review: "review", special: "special" }, default: :survey

  validates :batch_number, presence: true
  validates :record_date, presence: true

  def disease_count_by_type
    annotations.group(:disease_type).count
  end

  def area_cm2
    return 0 unless scale_markers.any?
    scale = scale_markers.first
    return 0 unless scale.length_cm.to_f > 0 && scale.length_pixels.to_f > 0
    pixel_per_cm = scale.length_pixels / scale.length_cm
    annotations.sum do |ann|
      (ann.width.to_f / pixel_per_cm) * (ann.height.to_f / pixel_per_cm)
    end
  end

  def abnormal?
    return true if humidity.present? && (humidity > 80 || humidity < 20)
    return true if temperature.present? && (temperature > 40 || temperature < 0)
    annotations.where(severity: "severe").count >= 5
  end

  def abnormal_reasons
    reasons = []
    reasons << "湿度过高" if humidity.present? && humidity > 80
    reasons << "湿度过低" if humidity.present? && humidity < 20
    reasons << "温度过高" if temperature.present? && temperature > 40
    reasons << "温度过低" if temperature.present? && temperature < 0
    severe_count = annotations.where(severity: "severe").count
    reasons << "重度病害#{severe_count}处" if severe_count >= 5
    reasons
  end

  def version_label
    "#{version_type_i18n} - #{batch_number}"
  end

  def version_type_i18n
    { survey: "普查", review: "复查", special: "专项" }[version_type.to_sym] || version_type
  end
end
