Project.transaction do
  project = Project.find_or_create_by!(code: 'RT-2024-Q3') do |p|
    p.name = '2024年第三季度全国铁路运行图'
    p.description = '本项目为2024年第三季度全国铁路纸质运行图数字化标注项目，包含多条主要线路的列车运行数据。'
    p.department = '运输调度中心'
    p.created_by = '张工'
    p.status = 'active'
  end

  run_chart = RunChart.find_or_create_by!(project: project, name: '京哈线运行图') do |rc|
    rc.date = Date.parse('2024-07-01')
    rc.scale_x = 50.0
    rc.scale_y = 30.0
    rc.offset_x = 100.0
    rc.offset_y = 50.0
  end

  train_routes = [
    { train_no: 'G101', train_type: 'G', color: '#DC3545', status: 'validated' },
    { train_no: 'G103', train_type: 'G', color: '#0D6EFD', status: 'validated' },
    { train_no: 'D11', train_type: 'D', color: '#20C997', status: 'corrected' },
    { train_no: 'Z15', train_type: 'Z', color: '#FFC107', status: 'draft' },
    { train_no: 'T17', train_type: 'T', color: '#6C757D', status: 'validated' }
  ]

  train_routes.each do |tr_data|
    train_route = TrainRoute.find_or_create_by!(run_chart: run_chart, train_no: tr_data[:train_no]) do |tr|
      tr.train_type = tr_data[:train_type]
      tr.color = tr_data[:color]
      tr.status = tr_data[:status]
      tr.path_data = "M 100,200 L 150,180 L 200,160 L 250,140 L 300,120"
    end

    stations_data = case tr_data[:train_no]
    when 'G101'
      [
        { name: '北京南', order: 1, arrival_time: '07:00', departure_time: '07:00', stop_duration: 0, x_coordinate: 100, y_coordinate: 200 },
        { name: '天津西', order: 2, arrival_time: '07:30', departure_time: '07:32', stop_duration: 2, x_coordinate: 150, y_coordinate: 180 },
        { name: '秦皇岛', order: 3, arrival_time: '08:30', departure_time: '08:32', stop_duration: 2, x_coordinate: 200, y_coordinate: 160 },
        { name: '沈阳北', order: 4, arrival_time: '10:30', departure_time: '10:33', stop_duration: 3, x_coordinate: 250, y_coordinate: 140 },
        { name: '长春西', order: 5, arrival_time: '11:45', departure_time: '11:47', stop_duration: 2, x_coordinate: 280, y_coordinate: 130 },
        { name: '哈尔滨西', order: 6, arrival_time: '12:45', departure_time: '12:45', stop_duration: 0, x_coordinate: 300, y_coordinate: 120 }
      ]
    when 'G103'
      [
        { name: '北京南', order: 1, arrival_time: '08:00', departure_time: '08:00', stop_duration: 0, x_coordinate: 100, y_coordinate: 220 },
        { name: '唐山', order: 2, arrival_time: '08:40', departure_time: '08:42', stop_duration: 2, x_coordinate: 130, y_coordinate: 200 },
        { name: '山海关', order: 3, arrival_time: '09:30', departure_time: '09:32', stop_duration: 2, x_coordinate: 180, y_coordinate: 180 },
        { name: '锦州南', order: 4, arrival_time: '10:15', departure_time: '10:17', stop_duration: 2, x_coordinate: 220, y_coordinate: 160 },
        { name: '沈阳北', order: 5, arrival_time: '11:00', departure_time: '11:00', stop_duration: 0, x_coordinate: 250, y_coordinate: 140 }
      ]
    when 'D11'
      [
        { name: '北京', order: 1, arrival_time: '16:00', departure_time: '16:00', stop_duration: 0, x_coordinate: 100, y_coordinate: 280 },
        { name: '承德', order: 2, arrival_time: '18:00', departure_time: '18:05', stop_duration: 5, x_coordinate: 150, y_coordinate: 260 },
        { name: '赤峰', order: 3, arrival_time: '19:30', departure_time: '19:35', stop_duration: 5, x_coordinate: 200, y_coordinate: 240 },
        { name: '通辽', order: 4, arrival_time: '21:00', departure_time: '21:00', stop_duration: 0, x_coordinate: 250, y_coordinate: 220 }
      ]
    when 'Z15'
      [
        { name: '北京', order: 1, arrival_time: '21:21', departure_time: '21:21', stop_duration: 0, x_coordinate: 100, y_coordinate: 300 },
        { name: '沈阳北', order: 2, arrival_time: '06:30', departure_time: '06:35', stop_duration: 5, x_coordinate: 250, y_coordinate: 140 },
        { name: '哈尔滨', order: 3, arrival_time: '08:30', departure_time: '08:30', stop_duration: 0, x_coordinate: 300, y_coordinate: 120 }
      ]
    when 'T17'
      [
        { name: '北京', order: 1, arrival_time: '21:05', departure_time: '21:05', stop_duration: 0, x_coordinate: 100, y_coordinate: 320 },
        { name: '天津', order: 2, arrival_time: '22:10', departure_time: '22:16', stop_duration: 6, x_coordinate: 150, y_coordinate: 300 },
        { name: '沈阳北', order: 3, arrival_time: '07:00', departure_time: '07:06', stop_duration: 6, x_coordinate: 250, y_coordinate: 140 },
        { name: '长春', order: 4, arrival_time: '08:30', departure_time: '08:36', stop_duration: 6, x_coordinate: 280, y_coordinate: 130 },
        { name: '哈尔滨', order: 5, arrival_time: '10:00', departure_time: '10:00', stop_duration: 0, x_coordinate: 300, y_coordinate: 120 }
      ]
    else
      []
    end

    stations_data.each do |station_data|
      Station.find_or_create_by!(train_route: train_route, name: station_data[:name], order: station_data[:order]) do |s|
        s.arrival_time = station_data[:arrival_time]
        s.departure_time = station_data[:departure_time]
        s.stop_duration = station_data[:stop_duration]
        s.x_coordinate = station_data[:x_coordinate]
        s.y_coordinate = station_data[:y_coordinate]
      end
    end
  end

  Annotation.find_or_create_by!(run_chart: run_chart, type: 'anomaly', status: 'pending') do |a|
    a.content = 'G101次列车天津西站停站时间异常，建议核查'
    a.x = 150
    a.y = 180
  end

  Annotation.find_or_create_by!(run_chart: run_chart, type: 'correction', status: 'confirmed') do |a|
    a.content = 'D11次列车赤峰站到达时间已校正为19:30'
    a.x = 200
    a.y = 240
  end

  Annotation.find_or_create_by!(run_chart: run_chart, type: 'note', status: 'resolved') do |a|
    a.content = 'Z15次列车为临时加开列车'
    a.x = 100
    a.y = 300
  end

  Version.find_or_create_by!(project: project, run_chart: run_chart, version_no: 'V001') do |v|
    v.batch_no = 'RT-2024-Q3-20240701'
    v.status = 'exported'
    v.change_log = '初始版本，包含G101、G103、D11、Z15、T17五条列车径路'
    v.exported_at = DateTime.parse('2024-07-01 10:00:00')
  end

  Version.find_or_create_by!(project: project, run_chart: run_chart, version_no: 'V002') do |v|
    v.batch_no = 'RT-2024-Q3-20240715'
    v.status = 'exported'
    v.change_log = '更新D11次列车赤峰站到达时间；添加异常标注'
    v.exported_at = DateTime.parse('2024-07-15 14:30:00')
  end

  Version.find_or_create_by!(project: project, run_chart: run_chart, version_no: 'V003') do |v|
    v.batch_no = 'RT-2024-Q3-20240730'
    v.status = 'generated'
    v.change_log = '添加G101次列车长春西停站点；更新所有列车运行时间'
  end

  puts "种子数据初始化完成！"
  puts "项目: #{project.name} (#{project.code})"
  puts "运行图: #{run_chart.name}"
  puts "列车径路: #{run_chart.train_routes.count} 条"
  puts "站点: #{run_chart.total_stations} 个"
  puts "标注: #{run_chart.annotations.count} 个"
  puts "版本: #{run_chart.versions.count} 个"
end