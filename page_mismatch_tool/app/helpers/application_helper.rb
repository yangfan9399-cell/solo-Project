module ApplicationHelper
  def project_status_badge(status)
    classes = case status
              when "draft" then "bg-gray-100 text-gray-700"
              when "in_progress" then "bg-blue-100 text-blue-700"
              when "completed" then "bg-green-100 text-green-700"
              else "bg-gray-100 text-gray-700"
              end
    label = case status
            when "draft" then "草稿"
            when "in_progress" then "进行中"
            when "completed" then "已完成"
            else status
            end
    tag.span(label, class: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium #{classes}")
  end

  def page_mapping_status_badge(status)
    classes = case status
              when "normal" then "bg-green-100 text-green-700"
              when "missing" then "bg-red-100 text-red-700"
              when "duplicate" then "bg-orange-100 text-orange-700"
              when "inserted" then "bg-purple-100 text-purple-700"
              when "blank" then "bg-gray-100 text-gray-500"
              when "misnumbered" then "bg-yellow-100 text-yellow-700"
              else "bg-gray-100 text-gray-700"
              end
    label = case status
            when "normal" then "正常"
            when "missing" then "缺页"
            when "duplicate" then "重复"
            when "inserted" then "插入"
            when "blank" then "空白"
            when "misnumbered" then "错码"
            else status
            end
    tag.span(label, class: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium #{classes}")
  end

  def anomaly_type_badge(anomaly_type)
    classes = case anomaly_type
              when "missing" then "bg-red-100 text-red-700"
              when "duplicate" then "bg-orange-100 text-orange-700"
              when "inserted" then "bg-purple-100 text-purple-700"
              when "misnumbered" then "bg-yellow-100 text-yellow-700"
              else "bg-gray-100 text-gray-700"
              end
    label = case anomaly_type
            when "missing" then "缺页"
            when "duplicate" then "重复"
            when "inserted" then "插入"
            when "misnumbered" then "错码"
            else anomaly_type
            end
    tag.span(label, class: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium #{classes}")
  end

  def export_format_badge(format)
    classes = case format
              when "csv" then "bg-emerald-100 text-emerald-700"
              when "bookmark_json" then "bg-indigo-100 text-indigo-700"
              else "bg-gray-100 text-gray-700"
              end
    label = case format
            when "csv" then "CSV"
            when "bookmark_json" then "书签JSON"
            else format
            end
    tag.span(label, class: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium #{classes}")
  end
end
