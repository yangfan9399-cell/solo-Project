module FaultRecordsHelper
  STATUS_COLORS = {
    pending_acceptance: "bg-amber-100 text-amber-800 border-amber-300",
    accepted: "bg-sky-100 text-sky-800 border-sky-300",
    processing: "bg-indigo-100 text-indigo-800 border-indigo-300",
    pending_review: "bg-violet-100 text-violet-800 border-violet-300",
    reviewing: "bg-purple-100 text-purple-800 border-purple-300",
    returned_for_supplement: "bg-orange-100 text-orange-800 border-orange-300",
    archived: "bg-slate-100 text-slate-700 border-slate-300"
  }.freeze

  ABNORMAL_COLORS = {
    normal: "bg-emerald-100 text-emerald-800 border-emerald-300",
    qualification_mismatch: "bg-rose-100 text-rose-800 border-rose-300",
    time_window_conflict: "bg-amber-100 text-amber-800 border-amber-300",
    notification_unconfirmed: "bg-orange-100 text-orange-800 border-orange-300"
  }.freeze

  LEVEL_COLORS = {
    minor: "bg-emerald-100 text-emerald-800",
    general: "bg-sky-100 text-sky-800",
    major: "bg-amber-100 text-amber-800",
    severe: "bg-rose-100 text-rose-800"
  }.freeze

  DIFF_COLORS = {
    normal: "bg-slate-100 text-slate-700",
    critical_time: "bg-rose-100 text-rose-800",
    responsible_object: "bg-amber-100 text-amber-800",
    amount: "bg-violet-100 text-violet-800",
    evidence: "bg-orange-100 text-orange-800"
  }.freeze

  def status_badge(status)
    color = STATUS_COLORS[status.to_sym] || "bg-slate-100 text-slate-700"
    content_tag(:span, class: "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border #{color}") do
      t("enums.fault_record.current_status.#{status}", default: status.to_s)
    end
  end

  def abnormal_badge(type)
    return nil if type.nil? || type == "normal"
    color = ABNORMAL_COLORS[type.to_sym] || "bg-slate-100 text-slate-700"
    label = t("enums.fault_record.abnormal_type.#{type}", default: type.to_s)
    content_tag(:span, class: "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border #{color}") do
      concat content_tag(:svg, nil, class: "w-3 h-3", fill: "currentColor", viewBox: "0 0 20 20") do
        "<path fill-rule='evenodd' d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z' clip-rule='evenodd'/>".html_safe
      end
      concat label
    end
  end

  def level_badge(level)
    color = LEVEL_COLORS[level.to_sym] || "bg-slate-100 text-slate-700"
    content_tag(:span, class: "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium #{color}") do
      t("enums.fault_record.fault_level.#{level}", default: level.to_s)
    end
  end

  def diff_badge(diff_type)
    color = DIFF_COLORS[diff_type.to_sym] || "bg-slate-100 text-slate-700"
    content_tag(:span, class: "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium #{color}") do
      t("enums.diff_snapshot.diff_type.#{diff_type}", default: diff_type.to_s)
    end
  end

  def format_time(time)
    return "—" unless time
    time.strftime("%Y-%m-%d %H:%M")
  end

  def format_money(amount)
    return "¥0.00" if amount.nil?
    "¥%.2f" % amount
  end

  def line_avg_duration(line_name)
    records = FaultRecord.where(line_name: line_name).where.not(actual_end_at: nil).where.not(actual_start_at: nil)
    return "N/A" if records.empty?
    avg_seconds = records.average("EXTRACT(EPOCH FROM (actual_end_at - actual_start_at))").to_i
    avg_minutes = (avg_seconds / 60.0).round(1)
    if avg_minutes > 60
      "#{(avg_minutes / 60.0).round(1)}h"
    else
      "#{avg_minutes}min"
    end
  end

  def status_options_for_select
    FaultRecord.current_statuses.keys.map { |k| [t("enums.fault_record.current_status.#{k}", default: k.to_s), k] }
  end

  def abnormal_type_options_for_select
    FaultRecord.abnormal_types.keys.map { |k| [t("enums.fault_record.abnormal_type.#{k}", default: k.to_s), k] }
  end

  def fault_type_options_for_select
    FaultRecord.fault_types.keys.map { |k| [t("enums.fault_record.fault_type.#{k}", default: k.to_s), k] }
  end

  def fault_level_options_for_select
    FaultRecord.fault_levels.keys.map { |k| [t("enums.fault_record.fault_level.#{k}", default: k.to_s), k] }
  end

  def source_type_options_for_select
    FaultRecord.source_types.keys.map { |k| [t("enums.fault_record.source_type.#{k}", default: k.to_s), k] }
  end

  def attachment_type_options_for_select
    EvidenceAttachment.attachment_types.keys.map { |k| [t("enums.evidence_attachment.attachment_type.#{k}", default: k.to_s), k] }
  end
end
