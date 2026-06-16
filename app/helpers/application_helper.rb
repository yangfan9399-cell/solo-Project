module ApplicationHelper
  def format_seconds(seconds)
    minutes = seconds.to_i / 60
    secs = seconds.to_i % 60
    format('%02d:%02d', minutes, secs)
  end

  def render_gear_svg(teeth, radius, fill_color = '#78716c', stroke_color = '#44403c', rotation = 0)
    teeth = teeth.to_i
    radius = radius.to_f
    inner_radius = radius * 0.65
    axle_radius = radius * 0.2
    tooth_height = radius * 0.12

    points = []
    angle_step = (2 * Math::PI) / teeth

    teeth.times do |i|
      angle = i * angle_step
      next_angle = (i + 0.5) * angle_step

      outer_angle1 = angle - angle_step * 0.2
      outer_angle2 = angle + angle_step * 0.2

      x1 = Math.cos(outer_angle1) * (radius - tooth_height)
      y1 = Math.sin(outer_angle1) * (radius - tooth_height)
      x2 = Math.cos(outer_angle1) * radius
      y2 = Math.sin(outer_angle1) * radius
      x3 = Math.cos(outer_angle2) * radius
      y3 = Math.sin(outer_angle2) * radius
      x4 = Math.cos(outer_angle2) * (radius - tooth_height)
      y4 = Math.sin(outer_angle2) * (radius - tooth_height)
      x5 = Math.cos(next_angle) * inner_radius
      y5 = Math.sin(next_angle) * inner_radius

      points << [x1, y1, x2, y2, x3, y3, x4, y4, x5, y5]
    end

    path_data = "M #{points[0][0]} #{points[0][1]} "
    points.each do |p|
      path_data += "L #{p[0]} #{p[1]} L #{p[2]} #{p[3]} L #{p[4]} #{p[5]} L #{p[6]} #{p[7]} L #{p[8]} #{p[9]} "
    end
    path_data += "Z"

    svg = ""
    svg += %Q(<g transform="rotate(#{rotation})">)
    svg += %Q(<path d="#{path_data}" fill="#{fill_color}" stroke="#{stroke_color}" stroke-width="1.5" stroke-linejoin="round"/>)
    svg += %Q(<circle cx="0" cy="0" r="#{axle_radius}" fill="#{stroke_color}" stroke="#{stroke_color}" stroke-width="1"/>)
    spoke_count = [teeth / 4, 4].max
    spoke_count.times do |i|
      angle = (i * 360.0 / spoke_count)
      svg += %Q(<line x1="0" y1="0" x2="0" y2="#{-(inner_radius - axle_radius - 2)}" stroke="#{stroke_color}" stroke-width="3" transform="rotate(#{angle})" opacity="0.5"/>)
    end
    svg += "</g>"

    svg.html_safe
  end

  def render_waterwheel_svg(radius, rotation = 0, active = true)
    paddle_count = 8
    paddle_length = radius * 0.35
    paddle_width = radius * 0.15

    svg = ""
    svg += %Q(<g transform="rotate(#{rotation})">)

    paddle_count.times do |i|
      angle = (i * 360.0 / paddle_count)
      x_end = Math.cos(angle * Math::PI / 180) * radius
      y_end = Math.sin(angle * Math::PI / 180) * radius
      perp_angle = (angle + 90) * Math::PI / 180
      dx = Math.cos(perp_angle) * paddle_width / 2
      dy = Math.sin(perp_angle) * paddle_width / 2

      inner_r = radius - paddle_length
      x1 = Math.cos(angle * Math::PI / 180) * inner_r + dx
      y1 = Math.sin(angle * Math::PI / 180) * inner_r + dy
      x2 = x_end + dx
      y2 = y_end + dy
      x3 = x_end - dx
      y3 = y_end - dy
      x4 = Math.cos(angle * Math::PI / 180) * inner_r - dx
      y4 = Math.sin(angle * Math::PI / 180) * inner_r - dy

      svg += %Q(<polygon points="#{x1},#{y1} #{x2},#{y2} #{x3},#{y3} #{x4},#{y4}" fill="#853c26" stroke="#5c2a1a" stroke-width="1"/>)
    end

    svg += %Q(<circle cx="0" cy="0" r="#{radius * 0.5}" fill="#a64a25" stroke="#5c2a1a" stroke-width="2"/>)
    svg += %Q(<circle cx="0" cy="0" r="#{radius * 0.15}" fill="#5c2a1a"/>)

    svg += "</g>"
    svg.html_safe
  end

  def render_target_gear_svg(teeth, radius, rotation = 0, active = false)
    fill = active ? '#059669' : '#9ca3af'
    stroke = active ? '#047857' : '#6b7280'

    svg = render_gear_svg(teeth, radius, fill, stroke, rotation)
    center_r = radius * 0.3

    svg += %Q(
      <circle cx="0" cy="0" r="#{center_r + 5}" fill="none" stroke="#fbbf24" stroke-width="3" stroke-dasharray="5,3" opacity="#{active ? 1 : 0.4}"/>
      <text x="0" y="5" text-anchor="middle" fill="#fbbf24" font-size="14" font-weight="bold">🎯</text>
    )

    svg.html_safe
  end
end
