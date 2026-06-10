class Material < ApplicationRecord
  belongs_to :created_by, class_name: 'User'
  has_many :licenses, dependent: :destroy
  has_many :usage_scenarios, dependent: :destroy

  MATERIAL_TYPES = %w[image video audio text graphic font].freeze

  validates :name, presence: true
  validates :material_type, presence: true, inclusion: { in: MATERIAL_TYPES }
  validates :copyright_holder, presence: true

  def current_license
    licenses.order(end_date: :desc).first
  end

  def license_status
    return 'no_license' unless current_license

    current_license.status
  end

  def has_risk?
    license_status.in?(['expired', 'scope_exceeded', 'document_missing'])
  end
end