class GearPhysicsEngine
  attr_reader :gears, :water_force, :connections

  BASE_WATER_RPM = 60.0

  def initialize(gears_config, water_force = 1.0)
    @gears = {}
    @connections = []
    @water_force = water_force

    gears_config.each do |gear|
      next if gear[:type] == 'available'

      @gears[gear[:id]] = {
        id: gear[:id],
        type: gear[:type],
        x: gear[:x].to_f,
        y: gear[:y].to_f,
        teeth: gear[:teeth].to_i,
        size: gear[:size].to_f,
        rotation: 0.0,
        rpm: 0.0,
        connected_to: gear[:connected_to] || [],
        active: gear[:type] != 'target'
      }
    end
  end

  def calculate_all_rpms
    reset_rpms
    waterwheel = @gears.values.find { |g| g[:type] == 'waterwheel' }
    return {} unless waterwheel

    waterwheel[:rpm] = BASE_WATER_RPM * @water_force
    visited = Set.new([waterwheel[:id]])
    queue = [waterwheel[:id]]

    while queue.any?
      current_id = queue.shift
      current = @gears[current_id]
      next unless current

      connected_ids = find_connected_gears(current_id)
      current[:connected_to] = connected_ids

      connected_ids.each do |connected_id|
        next if visited.include?(connected_id)

        connected = @gears[connected_id]
        next unless connected

        connected[:rpm] = calculate_gear_rpm(current, connected)
        connected[:active] = true
        visited.add(connected_id)
        queue.push(connected_id)
      end
    end

    @gears.transform_values { |g| g[:rpm] }
  end

  def find_connected_gears(gear_id)
    gear = @gears[gear_id]
    return [] unless gear

    connected = []
    @gears.each do |other_id, other|
      next if other_id == gear_id

      if gears_connected?(gear, other)
        connected << other_id
      end
    end
    connected
  end

  def gears_connected?(gear1, gear2)
    distance = Math.sqrt((gear1[:x] - gear2[:x])**2 + (gear1[:y] - gear2[:y])**2)
    min_distance = gear1[:size] + gear2[:size]
    max_distance = min_distance * 1.15

    distance >= min_distance * 0.9 && distance <= max_distance
  end

  def calculate_gear_rpm(source, target)
    return 0.0 if source[:teeth].to_i.zero?

    ratio = source[:teeth].to_f / target[:teeth].to_f
    source[:rpm].to_f * ratio
  end

  def target_rpm
    calculate_all_rpms
    target = @gears.values.find { |g| g[:type] == 'target' }
    target ? target[:rpm].round(2) : 0.0
  end

  def target_connected?
    calculate_all_rpms
    target = @gears.values.find { |g| g[:type] == 'target' }
    target ? target[:active] : false
  end

  def update_gear_position(gear_id, x, y)
    return false unless @gears.key?(gear_id)

    @gears[gear_id][:x] = x.to_f
    @gears[gear_id][:y] = y.to_f
    true
  end

  def add_gear(gear_data)
    id = gear_data[:id] || "gear_#{Time.now.to_i}"
    @gears[id] = {
      id: id,
      type: gear_data[:type] || 'gear',
      x: gear_data[:x].to_f,
      y: gear_data[:y].to_f,
      teeth: gear_data[:teeth].to_i,
      size: gear_data[:size].to_f,
      rotation: 0.0,
      rpm: 0.0,
      connected_to: [],
      active: false
    }
    id
  end

  def remove_gear(gear_id)
    @gears.delete(gear_id)
  end

  def gears_state
    @gears.values.map do |g|
      {
        id: g[:id],
        type: g[:type],
        x: g[:x],
        y: g[:y],
        teeth: g[:teeth],
        size: g[:size],
        rotation: g[:rotation],
        rpm: g[:rpm].round(2),
        connected_to: g[:connected_to],
        active: g[:active]
      }
    end
  end

  private

  def reset_rpms
    @gears.each_value do |g|
      next if g[:type] == 'waterwheel'

      g[:rpm] = 0.0
      g[:active] = g[:type] == 'waterwheel'
      g[:connected_to] = []
    end
  end
end
