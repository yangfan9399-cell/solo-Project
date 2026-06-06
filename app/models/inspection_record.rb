class InspectionRecord < ApplicationRecord
  enum :inspection_type, { checkout: 0, return: 1, periodic: 2, repair_check: 3 }
  enum :condition, { good: 0, minor_issue: 1, damaged: 2, unusable: 3 }

  belongs_to :borrow_record
  belongs_to :inspector, class_name: "User", optional: true

  validates :inspection_type, presence: true
  validates :condition, presence: true

  def inspection_type_name
    I18n.t("inspection_types.#{inspection_type}", default: inspection_type.humanize)
  end

  def condition_name
    I18n.t("conditions.#{condition}", default: condition.humanize)
  end
end
