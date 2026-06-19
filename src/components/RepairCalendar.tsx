import { useMemo } from 'react';
import { useAppStore } from '@/store';
import { StatusBadge } from './StatusBadge';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  isSameMonth, isSameDay, format, parseISO, isWithinInterval, addMonths, subMonths,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import type { WorkOrder } from '@/types';

export function RepairCalendar() {
  const { workOrders, ui, setSelectedDate, selectWorkOrder, conflicts } = useAppStore();
  const selectedDate = parseISO(ui.selectedDate);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(monthStart);
    const start = startOfWeek(monthStart, { weekStartsOn: 1 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [selectedDate]);

  const workOrdersForDay = (day: Date): WorkOrder[] => {
    return workOrders.filter((wo) => {
      try {
        return isWithinInterval(day, {
          start: parseISO(wo.startTime),
          end: parseISO(wo.endTime),
        });
      } catch {
        return false;
      }
    });
  };

  const hasConflict = (woId: string) =>
    conflicts.some((c) => c.workOrderIds.includes(woId));

  return (
    <div className="panel flex flex-col h-full">
      <div className="panel-header flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-industrial-copper-400" />
          <h2 className="font-display text-lg tracking-wider text-industrial-copper-300">
            检修日历
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn btn-ghost !p-1"
            onClick={() => setSelectedDate(subMonths(selectedDate, 1).toISOString())}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-display text-xl tracking-widest text-deep-sea-50 min-w-[140px] text-center">
            {format(selectedDate, 'yyyy 年 M 月', { locale: zhCN })}
          </span>
          <button
            className="btn btn-ghost !p-1"
            onClick={() => setSelectedDate(addMonths(selectedDate, 1).toISOString())}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-deep-sea-700">
        {['一', '二', '三', '四', '五', '六', '日'].map((d) => (
          <div
            key={d}
            className="px-2 py-1.5 text-center font-mono text-[10px] uppercase tracking-wider text-industrial-copper-400 border-r border-deep-sea-700 last:border-r-0"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 flex-1 overflow-hidden">
        {calendarDays.map((day, idx) => {
          const inMonth = isSameMonth(day, selectedDate);
          const isSelected = isSameDay(day, selectedDate);
          const list = workOrdersForDay(day);
          return (
            <div
              key={idx}
              onClick={() => setSelectedDate(day.toISOString())}
              className={`
                relative border-r border-b border-deep-sea-800 last:border-r-0 p-1.5 cursor-pointer transition-colors
                ${!inMonth ? 'bg-deep-sea-950/40 opacity-40' : 'bg-deep-sea-900/30 hover:bg-deep-sea-800/60'}
                ${isSelected ? 'ring-1 ring-inset ring-industrial-copper-500 bg-deep-sea-800/80' : ''}
              `}
            >
              <div className={`
                font-mono text-[11px] mb-1
                ${isSelected ? 'text-industrial-copper-400 glow-copper font-bold' : 'text-deep-sea-300'}
              `}>
                {format(day, 'd')}
              </div>
              <div className="space-y-0.5">
                {list.slice(0, 3).map((wo) => {
                  const isConflict = hasConflict(wo.id);
                  return (
                    <div
                      key={wo.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        selectWorkOrder(wo.id);
                      }}
                      className={`
                        text-[10px] font-mono px-1 py-0.5 border truncate transition-all
                        ${isConflict
                          ? 'bg-alert-red-700/70 border-alert-red-500 text-white conflict-pulse'
                          : 'bg-deep-sea-700/80 border-deep-sea-500 text-deep-sea-100 hover:bg-industrial-copper-700 hover:border-industrial-copper-500 hover:text-white'}
                      `}
                      title={`${wo.code} · ${wo.turbineId} · ${wo.title}`}
                    >
                      <span className="opacity-70 mr-1">{wo.code.slice(-4)}</span>
                      <span>{wo.turbineId}</span>
                    </div>
                  );
                })}
                {list.length > 3 && (
                  <div className="text-[10px] font-mono text-industrial-copper-400 px-1">
                    +{list.length - 3} 更多
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
