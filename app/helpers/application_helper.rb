module ApplicationHelper
  def status_badge(status)
    statuses = {
      "draft" => { text: "草稿", class: "bg-gray-100 text-gray-800" },
      "pattern_making" => { text: "打版中", class: "bg-blue-100 text-blue-800" },
      "review" => { text: "评审中", class: "bg-yellow-100 text-yellow-800" },
      "revision" => { text: "改版中", class: "bg-orange-100 text-orange-800" },
      "finalized" => { text: "定版", class: "bg-green-100 text-green-800" }
    }
    s = statuses[status.to_s] || { text: status.to_s, class: "bg-gray-100 text-gray-800" }
    tag.span s[:text], class: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium #{s[:class]}"
  end

  def verdict_badge(verdict)
    verdicts = {
      "pending" => { text: "待评", class: "bg-gray-100 text-gray-800" },
      "pass" => { text: "通过", class: "bg-green-100 text-green-800" },
      "revise" => { text: "修改", class: "bg-orange-100 text-orange-800" },
      "finalize" => { text: "定版", class: "bg-blue-100 text-blue-800" }
    }
    v = verdicts[verdict.to_s] || { text: verdict.to_s, class: "bg-gray-100 text-gray-800" }
    tag.span v[:text], class: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium #{v[:class]}"
  end

  def current_user_has_role?(*roles)
    return false unless logged_in?
    roles.map(&:to_s).include?(current_user.role)
  end

  def role_text(role)
    roles = {
      "designer" => "设计师",
      "pattern_maker" => "版师",
      "reviewer" => "评审人",
      "supervisor" => "主管"
    }
    roles[role.to_s] || role.to_s
  end

  def format_date(datetime)
    return "-" unless datetime
    datetime.strftime("%Y-%m-%d %H:%M")
  end

  def display_json(data)
    return "-" if data.blank?
    if data.is_a?(Hash) || data.is_a?(Array)
      JSON.pretty_generate(data)
    else
      data.to_s
    end
  end
end
