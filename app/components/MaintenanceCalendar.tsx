import type { WeatherType } from '~/types/game';
import { WEATHER_ICON, classError } from '~/utils/format';

interface DayStatus {
  day: number;
  weather: WeatherType;
  error: number | null;
}

interface Props {
  totalDays: number;
  currentDay: number;
  days: DayStatus[];
  targetDay?: number | null;
  onDayClick?: (day: number) => void;
}

export default function MaintenanceCalendar({ totalDays, currentDay, days, targetDay, onDayClick }: Props) {
  const statusFor = (d: number) => {
    const info = days.find(x => x.day === d);
    if (!info || info.error == null) return 'pending';
    return classError(info.error, 2, 3);
  };

  const dayWeather = (d: number) => {
    const info = days.find(x => x.day === d);
    return info?.weather ?? 'sunny';
  };

  const dayError = (d: number) => {
    const info = days.find(x => x.day === d);
    return info?.error;
  };

  return (
    <div>
      <div className="calendar-grid">
        {Array.from({ length: totalDays }, (_, i) => i + 1).map(d => {
          const isPast = d < currentDay;
          const isCurrent = d === currentDay;
          const isTarget = targetDay === d;
          const st = statusFor(d);
          const err = dayError(d);
          return (
            <div
              key={d}
              className={`calendar-day ${isPast ? 'past' : ''} ${isCurrent ? 'current' : ''}`}
              onClick={() => onDayClick?.(d)}
              title={err != null ? `Day ${d} 误差: ${err.toFixed(2)}s` : `Day ${d} 未执行`}
              style={isTarget ? { boxShadow: '0 0 0 2px #c84b4b' } : undefined}
            >
              <span className="day-num">{d}</span>
              <span className="weather-icon">{WEATHER_ICON[dayWeather(d)]}</span>
              <span className={`status-dot ${st}`} />
            </div>
          );
        })}
      </div>
      <div className="calendar-legend">
        <span className="legend-item"><span className="legend-dot" style={{ background: '#5a9e5a' }} />达标</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#d47a2a' }} />容差</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#c84b4b' }} />超限</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#8a7a5c' }} />待执行</span>
      </div>
    </div>
  );
}
