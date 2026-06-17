module ApplicationHelper
  def status_badge_class(status)
    case status
    when '待整理' then 'badge-default'
    when '整理中' then 'badge-warning'
    when '已完成' then 'badge-info'
    when '待审核' then 'badge-warning'
    when '已审核' then 'badge-success'
    else 'badge-default'
    end
  end

  def link_to_add_fields(name, f, association, html_options = {})
    new_object = f.object.send(association).klass.new
    id = new_object.object_id
    fields = f.fields_for(association, new_object, child_index: id) do |builder|
      render(association.to_s.singularize + '_fields', f: builder)
    end
    link_to(name, '#', html_options.merge(class: "#{html_options[:class]} add_fields", data: { id: id, fields: fields.gsub("\n", "") }))
  end

  def link_to_remove_fields(name, f, html_options = {})
    f.hidden_field(:_destroy) + link_to(name, '#', html_options.merge(class: "#{html_options[:class]} remove_fields"))
  end
end
