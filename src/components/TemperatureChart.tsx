'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Scatter,
} from 'recharts'
import type { TemperatureReading } from '@/lib/store'

interface TemperatureChartProps {
  readings: TemperatureReading[]
  minTemp: number
  maxTemp: number
}

export function TemperatureChart({ readings, minTemp, maxTemp }: TemperatureChartProps) {
  const data = readings.map((reading) => ({
    time: new Date(reading.timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    temperature: reading.isOffline ? null : reading.temperature,
    isOffline: reading.isOffline,
    fullTime: reading.timestamp,
  }))

  const offlinePoints = readings
    .filter((r) => r.isOffline)
    .map((r) => ({
      time: new Date(r.timestamp).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      temperature: minTemp - 1,
      isOffline: true,
    }))

  const yDomain = [
    Math.min(minTemp - 2, ...readings.map((r) => (r.temperature !== null ? r.temperature : minTemp))),
    Math.max(maxTemp + 2, ...readings.map((r) => (r.temperature !== null ? r.temperature : maxTemp))),
  ]

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <YAxis
            domain={yDomain}
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
            unit="℃"
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload
                return (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                    <p className="text-sm text-gray-600">{data.fullTime && new Date(data.fullTime).toLocaleString('zh-CN')}</p>
                    {data.isOffline ? (
                      <p className="text-sm font-medium text-red-600">探头离线 - 无数据</p>
                    ) : (
                      <p className="text-sm font-medium text-blue-600">
                        温度: {data.temperature?.toFixed(1)}℃
                      </p>
                    )}
                  </div>
                )
              }
              return null
            }}
          />
          <ReferenceLine y={minTemp} stroke="#10b981" strokeDasharray="5 5" label={{ value: `最低 ${minTemp}℃`, fill: '#10b981', fontSize: 11 }} />
          <ReferenceLine y={maxTemp} stroke="#ef4444" strokeDasharray="5 5" label={{ value: `最高 ${maxTemp}℃`, fill: '#ef4444', fontSize: 11 }} />
          <Line
            type="monotone"
            dataKey="temperature"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
          />
          <Scatter dataKey="temperature" data={offlinePoints} fill="#ef4444" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
