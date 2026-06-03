import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import Header from '../components/layout/Header';
import StatusBadge from '../components/common/StatusBadge';
import Loading from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { reservationApi } from '../api/reservations';
import { formatDate, formatTime } from '../utils/format';
import {
  STATUS_COLORS,
  STATUS_LABELS,
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_STATUS_OPTIONS,
  RESERVATION_STATUS_OPTIONS,
} from '../utils/constants';
import type { ScheduleItem, Equipment, ReservationStatus } from '../types';

type ViewMode = 'month' | 'week';

const CalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<number | null>(null);

  const fetchCalendar = async () => {
    setLoading(true);
    setErrorState(null);
    try {
      const startDate = currentDate.startOf(viewMode).format('YYYY-MM-DD');
      const endDate = currentDate.endOf(viewMode).format('YYYY-MM-DD');
      const response = await reservationApi.getCalendar({
        start_date: startDate,
        end_date: endDate,
        category: categoryFilter || undefined,
      });
      if (response.success && response.data) {
        setSchedule(response.data.schedule);
        setEquipments(response.data.equipments);
      } else {
        setErrorState(response.error || '加载档期数据失败');
      }
    } catch (e) {
      setErrorState('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [currentDate, viewMode, categoryFilter]);

  const filteredEquipments = useMemo(() => {
    return equipments.filter((eq) => {
      if (statusFilter && eq.status !== statusFilter) return false;
      return true;
    });
  }, [equipments, statusFilter]);

  const dateRange = useMemo(() => {
    const dates: dayjs.Dayjs[] = [];
    const start = currentDate.startOf(viewMode);
    const days = viewMode === 'month' ? currentDate.daysInMonth() : 7;
    for (let i = 0; i < days; i++) {
      dates.push(start.add(i, 'day'));
    }
    return dates;
  }, [currentDate, viewMode]);

  const getScheduleForCell = (equipmentId: number, date: dayjs.Dayjs) => {
    return schedule.filter((item) => {
      const itemStart = dayjs(item.start_time);
      const itemEnd = dayjs(item.end_time);
      const cellStart = date.startOf('day');
      const cellEnd = date.endOf('day');
      return (
        item.equipment_id === equipmentId &&
        itemEnd.isAfter(cellStart) &&
        itemStart.isBefore(cellEnd)
      );
    });
  };

  const isIdleSlot = (equipmentId: number, date: dayjs.Dayjs) => {
    const equipment = equipments.find((e) => e.id === equipmentId);
    if (!equipment || equipment.status !== 'available') return false;
    const cellSchedule = getScheduleForCell(equipmentId, date);
    return cellSchedule.length === 0;
  };

  const handlePrev = () => {
    setCurrentDate((prev) => prev.subtract(1, viewMode));
  };

  const handleNext = () => {
    setCurrentDate((prev) => prev.add(1, viewMode));
  };

  const handleToday = () => {
    setCurrentDate(dayjs());
  };

  const handleReservationClick = (reservationId: number) => {
    navigate(`/reservations/${reservationId}`);
  };

  const handleQuickCreate = (equipmentId: number, date: dayjs.Dayjs) => {
    navigate('/reservations', {
      state: {
        equipmentId,
        defaultDate: date.format('YYYY-MM-DD'),
      },
    });
  };

  const getStatusBgColor = (status: ReservationStatus) => {
    const colorMap: Record<string, string> = {
      pending: 'bg-yellow-50 border-yellow-300 hover:bg-yellow-100',
      approved: 'bg-green-50 border-green-300 hover:bg-green-100',
      picked_up: 'bg-blue-50 border-blue-300 hover:bg-blue-100',
      overdue: 'bg-red-50 border-red-300 hover:bg-red-100',
      rejected: 'bg-gray-50 border-gray-300 hover:bg-gray-100',
      returned: 'bg-green-50 border-green-300 hover:bg-green-100',
      cancelled: 'bg-gray-50 border-gray-300 hover:bg-gray-100',
    };
    return colorMap[status] || 'bg-gray-50 border-gray-300';
  };

  const getStatusTextColor = (status: ReservationStatus) => {
    const colorMap: Record<string, string> = {
      pending: 'text-yellow-800',
      approved: 'text-green-800',
      picked_up: 'text-blue-800',
      overdue: 'text-red-800',
      rejected: 'text-gray-800',
      returned: 'text-green-800',
      cancelled: 'text-gray-800',
    };
    return colorMap[status] || 'text-gray-800';
  };

  const legendItems = RESERVATION_STATUS_OPTIONS.filter((opt) =>
    ['pending', 'approved', 'picked_up', 'overdue'].includes(opt.value)
  );

  const renderDateHeader = () => (
    <div className="flex border-b border-gray-200 bg-gray-50">
      <div className="w-56 flex-shrink-0 p-3 border-r border-gray-200 font-medium text-gray-700">
        设备
      </div>
      {dateRange.map((date, idx) => {
        const isToday = date.isSame(dayjs(), 'day');
        const isWeekend = date.day() === 0 || date.day() === 6;
        return (
          <div
            key={idx}
            className={`flex-1 min-w-24 p-3 text-center border-r border-gray-200 last:border-r-0 ${
              isToday ? 'bg-primary-50' : ''
            }`}
          >
            <div
              className={`text-sm font-medium ${
                isToday ? 'text-primary-600' : isWeekend ? 'text-red-500' : 'text-gray-700'
              }`}
            >
              {date.format('MM-DD')}
            </div>
            <div
              className={`text-xs ${
                isToday ? 'text-primary-500' : isWeekend ? 'text-red-400' : 'text-gray-500'
              }`}
            >
              {date.format('ddd')}
            </div>
            {isToday && (
              <div className="mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-600 text-white">
                  今天
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderScheduleCard = (item: ScheduleItem, date: dayjs.Dayjs) => {
    const startTime = dayjs(item.start_time);
    const endTime = dayjs(item.end_time);
    const cellStart = date.startOf('day');
    const cellEnd = date.endOf('day');

    const displayStart = startTime.isBefore(cellStart) ? cellStart : startTime;
    const displayEnd = endTime.isAfter(cellEnd) ? cellEnd : endTime;

    return (
      <div
        key={item.id}
        onClick={() => handleReservationClick(item.id)}
        className={`mb-1 p-2 rounded border cursor-pointer transition-colors ${getStatusBgColor(
          item.status
        )}`}
      >
        <div className={`text-xs font-semibold truncate ${getStatusTextColor(item.status)}`}>
          {item.task_title || item.purpose || '设备预约'}
        </div>
        <div className="text-xs text-gray-600 mt-0.5">
          {formatTime(displayStart.toDate())} - {formatTime(displayEnd.toDate())}
        </div>
        <div className="text-xs text-gray-500 truncate">{item.requester_name}</div>
      </div>
    );
  };

  const renderGrid = () => {
    if (filteredEquipments.length === 0) {
      return (
        <EmptyState
          title="暂无设备"
          description={
            categoryFilter || statusFilter
              ? '当前筛选条件下没有设备，请调整筛选条件'
              : '还没有添加任何设备'
          }
        />
      );
    }

    return (
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {renderDateHeader()}
          {filteredEquipments.map((equipment) => (
            <div
              key={equipment.id}
              className={`flex border-b border-gray-200 last:border-b-0 hover:bg-gray-50 ${
                selectedEquipment === equipment.id ? 'bg-primary-50' : ''
              }`}
              onClick={() => setSelectedEquipment(equipment.id)}
            >
              <div className="w-56 flex-shrink-0 p-3 border-r border-gray-200">
                <div className="font-medium text-gray-900 truncate">{equipment.name}</div>
                <div className="text-xs text-gray-500 mt-1">{equipment.code}</div>
                <div className="flex items-center gap-2 mt-2">
                  <StatusBadge status={equipment.status} className="text-xs" />
                  <span className="text-xs text-gray-400">{equipment.category}</span>
                </div>
              </div>
              {dateRange.map((date, idx) => {
                const cellSchedule = getScheduleForCell(equipment.id, date);
                const isIdle = isIdleSlot(equipment.id, date);
                const isToday = date.isSame(dayjs(), 'day');

                return (
                  <div
                    key={idx}
                    className={`flex-1 min-w-24 p-2 border-r border-gray-200 last:border-r-0 min-h-24 relative ${
                      isToday ? 'bg-primary-50/30' : ''
                    } ${isIdle ? 'bg-green-50/50' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (cellSchedule.length === 0) {
                        handleQuickCreate(equipment.id, date);
                      }
                    }}
                  >
                    {isIdle && (
                      <div className="absolute inset-0 border-2 border-dashed border-green-300 rounded m-1 opacity-50 pointer-events-none" />
                    )}
                    {cellSchedule.length > 0 ? (
                      <div className="relative z-10">
                        {cellSchedule.map((item) => renderScheduleCard(item, date))}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        {isIdle && (
                          <span className="text-xs text-green-600 font-medium opacity-70">
                            可预约
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-full">
      <Header
        title="设备档期看板"
        subtitle="查看和管理所有设备的预约档期"
        actions={
          <button
            onClick={() => navigate('/reservations')}
            className="btn-primary"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            新建预约
          </button>
        }
      />

      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  onClick={handleToday}
                  className="btn-secondary text-sm px-4 py-2"
                >
                  今天
                </button>
                <button
                  onClick={handleNext}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
                <span className="text-lg font-semibold text-gray-900 ml-4">
                  {viewMode === 'month'
                    ? currentDate.format('YYYY年MM月')
                    : `${currentDate.startOf('week').format('YYYY年MM月DD日')} - ${currentDate
                        .endOf('week')
                        .format('MM月DD日')}`}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('week')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'week'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    周视图
                  </button>
                  <button
                    onClick={() => setViewMode('month')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'month'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    月视图
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-wrap items-center gap-4">
              <div className="w-40">
                <label className="form-label text-sm">设备分类</label>
                <select
                  className="form-select text-sm"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">全部分类</option>
                  {EQUIPMENT_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-32">
                <label className="form-label text-sm">设备状态</label>
                <select
                  className="form-select text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">全部状态</option>
                  {EQUIPMENT_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end ml-auto gap-6">
                {legendItems.map((item) => (
                  <div key={item.value} className="flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded ${STATUS_COLORS[item.value]?.replace(
                        'text-',
                        'bg-'
                      )}`}
                    />
                    <span className="text-sm text-gray-600">
                      {STATUS_LABELS[item.value] || item.label}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded border-2 border-dashed border-green-400 bg-green-50" />
                  <span className="text-sm text-gray-600">可预约</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="py-16">
                <Loading text="加载档期数据中..." />
              </div>
            ) : errorState ? (
              <ErrorState message={errorState} onRetry={fetchCalendar} />
            ) : (
              renderGrid()
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
