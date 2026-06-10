class Exam < ApplicationRecord
  belongs_to :patient
  has_one :report, dependent: :destroy

  EXAM_TYPES = [
    ["CT", "ct"],
    ["MRI", "mri"],
    ["X光", "xray"],
    ["超声", "ultrasound"],
    ["心电图", "ecg"],
    ["其他", "other"]
  ].freeze

  validates :exam_type, presence: true, inclusion: { in: EXAM_TYPES.map(&:last) }
  validates :exam_date, presence: true
  validates :patient_id, presence: true
end