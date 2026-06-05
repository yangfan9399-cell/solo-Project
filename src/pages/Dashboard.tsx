import { useMemo } from 'react';
import { useBookingStore, meetingRooms, departments } from '../services/bookingService';
import { formatCurrency, getConflictTypeText } from '../utils/format';
import { ConflictType, BookingStatus } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

function Dashboard() {
  const bookings = useBookingStore((state) => state.bookings);

  const stats = useMemo(() => {
    const totalBookings = bookings.length;
    const totalCost = bookings.reduce((sum, b) => sum + b.totalCost, 0);
    const conflictCount = bookings.filter((b) => b.conflictType !== ConflictType.NONE).length;
    const confirmedCount = bookings.filter((b) => b.status === BookingStatus.CONFIRMED).length;

    return { totalBookings, totalCost, conflictCount, confirmedCount };
  }, [bookings]);

  const byFloor = useMemo(() => {
    const floorMap = new Map<number, { count: number; cost: number }>();
    meetingRooms.forEach((room) => {
      floorMap.set(room.floor, { count: 0, cost: 0 });
    });

    bookings.forEach((booking) => {
      const room = meetingRooms.find((r) => r.id === booking.meetingRoomId);
      if (room) {
        const existing = floorMap.get(room.floor) || { count: 0, cost: 0 };
        floorMap.set(room.floor, {
          count: existing.count + 1,
          cost: existing.cost + booking.totalCost,
        });
      }
    });

    return Array.from(floorMap.entries())
      .map(([floor, data]) => ({
        floor: `${floor}楼`,
        预订次数: data.count,
        费用总额: data.cost,
      }))
      .sort((a, b) => parseInt(a.floor) - parseInt(b.floor));
  }, [bookings]);

  const byDepartment = useMemo(() => {
    const deptMap = new Map<string, { count: number; cost: number; conflictCount: number }>();
    departments.forEach((dept) => {
      deptMap.set(dept.name, { count: 0, cost: 0, conflictCount: 0 });
    });

    bookings.forEach((booking) => {
      const deptName = booking.department?.name || '未知';
      const existing = deptMap.get(deptName) || { count: 0, cost: 0, conflictCount: 0 };
      deptMap.set(deptName, {
        count: existing.count + 1,
        cost: existing.cost + booking.totalCost,
        conflictCount: existing.conflictCount + (booking.conflictType !== ConflictType.NONE ? 1 : 0),
      });
    });

    return Array.from(deptMap.entries())
      .filter(([_, data]) => data.count > 0)
      .map(([name, data]) => ({
        name,
        预订次数: data.count,
        费用总额: data.cost,
        冲突次数: data.conflictCount,
      }));
  }, [bookings]);

  const byConflictType = useMemo(() => {
    const conflictMap = new Map<ConflictType, number>();
    conflictMap.set(ConflictType.NONE, 0);
    conflictMap.set(ConflictType.TIME_OVERLAP, 0);
    conflictMap.set(ConflictType.EQUIPMENT_MISSING, 0);
    conflictMap.set(ConflictType.COST_ALLOCATION_MISMATCH, 0);

    bookings.forEach((booking) => {
      const existing = conflictMap.get(booking.conflictType) || 0;
      conflictMap.set(booking.conflictType, existing + 1);
    });

    return Array.from(conflictMap.entries()).map(([type, count]) => ({
      name: getConflictTypeText(type),
      value: count,
    }));
  }, [bookings]);

  const costTrend = useMemo(() => {
    const dateMap = new Map<string, number>();
    
    bookings.forEach((booking) => {
      const date = new Date(booking.startTime).toLocaleDateString('zh-CN');
      const existing = dateMap.get(date) || 0;
      dateMap.set(date, existing + booking.totalCost);
    });

    return Array.from(dateMap.entries())
      .map(([date, cost]) => ({ date, 费用: cost }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [bookings]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">复盘统计</h2>
        <p className="mt-1 text-sm text-gray-500">多维度聚合分析会议室预订数据</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card p-6">
          <div className="text-sm text-gray-500 mb-1">总预订数</div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalBookings}</div>
          <div className="mt-2 text-xs text-gray-400">次预订</div>
        </div>
        <div className="card p-6">
          <div className="text-sm text-gray-500 mb-1">总费用</div>
          <div className="text-3xl font-bold text-blue-600">{formatCurrency(stats.totalCost)}</div>
          <div className="mt-2 text-xs text-gray-400">累计金额</div>
        </div>
        <div className="card p-6">
          <div className="text-sm text-gray-500 mb-1">冲突次数</div>
          <div className="text-3xl font-bold text-red-600">{stats.conflictCount}</div>
          <div className="mt-2 text-xs text-gray-400">次冲突</div>
        </div>
        <div className="card p-6">
          <div className="text-sm text-gray-500 mb-1">已确认</div>
          <div className="text-3xl font-bold text-green-600">{stats.confirmedCount}</div>
          <div className="mt-2 text-xs text-gray-400">次成功预订</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">按楼层统计</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byFloor}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="floor" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip formatter={(value, name) => name === '费用总额' ? formatCurrency(value as number) : value} />
              <Legend />
              <Bar yAxisId="left" dataKey="预订次数" fill="#3B82F6" name="预订次数" />
              <Bar yAxisId="right" dataKey="费用总额" fill="#10B981" name="费用总额" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">冲突原因分布</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={byConflictType}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {byConflictType.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">按部门统计</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={byDepartment} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={100} />
            <Tooltip formatter={(value, name) => name === '费用总额' ? formatCurrency(value as number) : value} />
            <Legend />
            <Bar dataKey="预订次数" fill="#3B82F6" name="预订次数" />
            <Bar dataKey="冲突次数" fill="#EF4444" name="冲突次数" />
            <Bar dataKey="费用总额" fill="#10B981" name="费用总额" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">费用趋势</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={costTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(value as number)} />
            <Legend />
            <Line type="monotone" dataKey="费用" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">详细数据</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">部门</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">预订次数</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">冲突次数</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">冲突率</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">费用总额</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">次均费用</th>
              </tr>
            </thead>
            <tbody>
              {byDepartment.map((dept, index) => (
                <tr key={dept.name} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50' : ''}`}>
                  <td className="py-3 px-4 font-medium text-gray-900">{dept.name}</td>
                  <td className="py-3 px-4 text-gray-900">{dept.预订次数}</td>
                  <td className="py-3 px-4">
                    <span className={dept.冲突次数 > 0 ? 'text-red-600' : 'text-gray-500'}>
                      {dept.冲突次数}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <div className="w-20 h-2 bg-gray-200 rounded-full mr-2">
                        <div
                          className="h-2 bg-red-500 rounded-full"
                          style={{ width: `${(dept.冲突次数 / dept.预订次数) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">
                        {((dept.冲突次数 / dept.预订次数) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900">{formatCurrency(dept.费用总额)}</td>
                  <td className="py-3 px-4 text-gray-600">
                    {formatCurrency(dept.费用总额 / dept.预订次数)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
