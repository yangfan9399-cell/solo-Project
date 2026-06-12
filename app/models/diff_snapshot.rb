class DiffSnapshot < ApplicationRecord
  enum :diff_type, { normal: 0, critical_time: 1, responsible_object: 2, amount: 3, evidence: 4 }

  belongs_to :fault_record
  belongs_to :workflow_node

  validates :field_name, presence: true

  def field_label
    I18n.t("activerecord.attributes.fault_record.#{field_name}", default: field_name.humanize)
  end

  def diff_type_text
    I18n.t("enums.diff_snapshot.diff_type.#{diff_type}", default: diff_type.to_s)
  end

  def critical?
    diff_type != "normal"
  end

  def display_before_value
    format_value(before_value, field_name)
  end

  def display_after_value
    format_value(after_value, field_name)
  end

  private

  def format_value(val, field)
    return "空" if val.blank? || val == ""
    if field.end_with?("_at") || field.start_with?("maintenance_window")
      Time.parse(val).strftime("%Y-%m-%d %H:%M") rescue val
    elsif %w[notified_confirmation handler_qualified].include?(field)
      val == "true" ? "是" : "否"
    elsif field.include?("cost")
      "¥#{val}"
    else
      val
    end
  end
end
