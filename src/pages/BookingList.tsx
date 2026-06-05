import { useState } from 'react';
import { Link, useLoaderData } from 'react-router-dom';
import { formatDateTime, formatCurrency, getStatusText, getStatusColor, getConflictTypeText, getConflictTypeColor } from '../utils/format';
import { BookingStatus, ConflictType, Booking } from '../types';

function BookingList() {
  const { bookings } = useLoaderData() as { bookings: Booking[] };
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'ALL'>('ALL');
  const [conflictFilter, setConflictFilter] = useState<ConflictType | 'ALL'>('ALL');

  const filteredBookings = bookings.filter((booking: Booking) => {
    const statusMatch = statusFilter === 'ALL' || booking.status === statusFilter;
    const conflictMatch = conflictFilter === 'ALL' || booking.conflictType === conflictFilter;
    return statusMatch && conflictMatch;
  });

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter((b: Booking) => b.status === BookingStatus.CONFIRMED).length,
    conflict: bookings.filter((b: Booking) => b.status === BookingStatus.CONFLICT).length,
    pending: bookings.filter((b: Booking) => b.status === BookingStatus.PENDING).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">会议室预订列表</h2>
          <p className="mt-1 text-sm text-gray-500">管理所有会议室预订申请</p>
        </div>
        <Link to="/booking/new" className="btn btn-primary">
          + 新建预订
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">总预订数</div>
        </div>
        <div className="card p-4">
          <div className="text-3xl font-bold text-green-600">{stats.confirmed}</div>
          <div className="text-sm text-gray-500">已确认</div>
        </div>
        <div className="card p-4">
          <div className="text-3xl font-bold text-red-600">{stats.conflict}</div>
          <div className="text-sm text-gray-500">有冲突</div>
        </div>
        <div className="card p-4">
          <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-sm text-gray-500">待处理</div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap gap-4 mb-4">
          <div>
            <label className="label">状态筛选</label>
            <select
              className="input w-40"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as BookingStatus | 'ALL')}
            >
              <option value="ALL">全部状态</option>
              <option value={BookingStatus.PENDING}>待确认</option>
              <option value={BookingStatus.CONFIRMED}>已确认</option>
              <option value={BookingStatus.CONFLICT}>有冲突</option>
              <option value={BookingStatus.ARCHIVED}>已归档</option>
              <option value={BookingStatus.REJECTED}>已拒绝</option>
            </select>
          </div>
          <div>
            <label className="label">冲突类型</label>
            <select
              className="input w-48"
              value={conflictFilter}
              onChange={(e) => setConflictFilter(e.target.value as ConflictType | 'ALL')}
            >
              <option value="ALL">全部类型</option>
              <option value={ConflictType.NONE}>无冲突</option>
              <option value={ConflictType.TIME_OVERLAP}>时间重叠</option>
              <option value={ConflictType.EQUIPMENT_MISSING}>设备缺失</option>
              <option value={ConflictType.COST_ALLOCATION_MISMATCH}>分摊不匹配</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">会议主题</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">会议室</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">时间</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">申请部门</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">费用</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">状态</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">冲突</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking: Booking) => (
                <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{booking.title}</div>
                    <div className="text-sm text-gray-500">申请人: {booking.applicant}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{booking.meetingRoom?.name}</div>
                    <div className="text-sm text-gray-500">{booking.meetingRoom?.floor}楼</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-900">{formatDateTime(booking.startTime)}</div>
                    <div className="text-sm text-gray-500">- {formatDateTime(booking.endTime)}</div>
                  </td>
                  <td className="py-3 px-4 text-gray-900">{booking.department?.name}</td>
                  <td className="py-3 px-4 font-medium text-gray-900">{formatCurrency(booking.totalCost)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {getStatusText(booking.status)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConflictTypeColor(booking.conflictType)}`}>
                      {getConflictTypeText(booking.conflictType)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      to={`/booking/${booking.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      查看详情
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredBookings.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            暂无符合条件的预订记录
          </div>
        )}
      </div>
    </div>
  );
}

export default BookingList;
