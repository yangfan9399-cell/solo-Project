class Seal < ApplicationRecord
  has_many :seal_applications

  enum :seal_type, { official: 0, contract: 1, financial: 2, legal: 3 }
  enum :status, { active: 0, inactive: 1 }

  validates :name, presence: true, uniqueness: true
  validates :seal_type, presence: true
  validates :status, presence: true

  def type_name
    { official: '公章', contract: '合同专用章', financial: '财务专用章', legal: '法人章' }[seal_type.to_sym] || seal_type.humanize
  end
end
