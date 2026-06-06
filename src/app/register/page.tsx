'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  registerShipment,
  getMedicines,
  getCarriers,
  getProbes,
  collectTemperatureData,
} from '@/lib/services'
import { Package, Truck, Thermometer, Hash, Save, Plus, Trash2, Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import { useRole } from '@/context/RoleContext'
import { Role, ShipmentStatus } from '@/lib/types'
import type { ShipmentListItem } from '@/lib/services'

interface TempReading {
  id: string
  timestamp: string
  temperature: string
  isOffline: boolean
}

export default function RegisterPage() {
  const router = useRouter()
  const { currentRole, currentUserId } = useRole()
  const [medicines, setMedicines] = useState<Array<{ id: string; name: string; minTemp: number; maxTemp: number }>>([])
  const [carriers, setCarriers] = useState<Array<{ id: string; name: string }>>([])
  const [probes, setProbes] = useState<Array<{ id: string; serialNumber: string; model: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [step, setStep] = useState<'register' | 'temperature'>('register')
  const [registeredShipment, setRegisteredShipment] = useState<ShipmentListItem | null>(null)

  const [formData, setFormData] = useState({
    batchNumber: '',
    medicineId: '',
    quantity: '',
    carrierId: '',
    probeId: '',
  })

  const [readings, setReadings] = useState<TempReading[]>([])
  const [readingType, setReadingType] = useState<'temperature' | 'offline'>('temperature')
  const [newReadingTime, setNewReadingTime] = useState('')
  const [newReadingTemp, setNewReadingTemp] = useState('')
  const [offlineStart, setOfflineStart] = useState('')
  const [offlineEnd, setOfflineEnd] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        const [meds, carrs, prbs] = await Promise.all([
          getMedicines(),
          getCarriers(),
          getProbes(),
        ])
        setMedicines(meds)
        setCarriers(carrs)
        setProbes(prbs)
      } catch (err) {
        setError('加载数据失败')
      }
    }
    loadData()
  }, [])

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (currentRole !== Role.WAREHOUSE_CLERK) {
        throw new Error('只有仓库经办人可以进行入库登记')
      }

      const result = await registerShipment({
        batchNumber: formData.batchNumber,
        medicineId: formData.medicineId,
        quantity: parseInt(formData.quantity),
        carrierId: formData.carrierId,
        probeId: formData.probeId,
        warehouseClerkId: currentUserId,
      })

      const selectedMedicine = medicines.find((m) => m.id === formData.medicineId)
      const selectedCarrier = carriers.find((c) => c.id === formData.carrierId)

      setRegisteredShipment({
        ...result,
        medicineName: selectedMedicine?.name || '',
        carrierName: selectedCarrier?.name || '',
        deviationType: 'NONE',
        deviationLevel: 'NONE',
        currentHandlerName: null,
      })

      setStep('temperature')
    } catch (err) {
      setError(err instanceof Error ? err.message : '登记失败')
    } finally {
      setLoading(false)
    }
  }

  const generateId = () => Math.random().toString(36).substring(2, 11)

  const addTemperatureReading = () => {
    if (!newReadingTime) {
      setError('请选择时间')
      return
    }
    if (readingType === 'temperature' && !newReadingTemp) {
      setError('请输入温度值')
      return
    }

    setError(null)

    if (readingType === 'temperature') {
      setReadings((prev) => [
        ...prev,
        {
          id: generateId(),
          timestamp: newReadingTime,
          temperature: newReadingTemp,
          isOffline: false,
        },
      ])
      setNewReadingTime('')
      setNewReadingTemp('')
    }
  }

  const addOfflineReading = () => {
    if (!offlineStart || !offlineEnd) {
      setError('请选择离线开始和结束时间')
      return
    }

    const start = new Date(offlineStart)
    const end = new Date(offlineEnd)
    if (start >= end) {
      setError('结束时间必须晚于开始时间')
      return
    }

    setError(null)

    setReadings((prev) => [
      ...prev,
      {
        id: generateId(),
        timestamp: offlineStart,
        temperature: '',
        isOffline: true,
      },
      {
        id: generateId(),
        timestamp: offlineEnd,
        temperature: '',
        isOffline: true,
      },
    ])

    setOfflineStart('')
    setOfflineEnd('')
  }

  const removeReading = (id: string) => {
    setReadings((prev) => prev.filter((r) => r.id !== id))
  }

  const handleTemperatureSubmit = async () => {
    if (!registeredShipment) return
    if (readings.length === 0) {
      setError('请至少添加一条温度记录')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const formattedReadings = readings.map((r) => ({
        timestamp: new Date(r.timestamp),
        temperature: r.isOffline ? null : parseFloat(r.temperature),
        isOffline: r.isOffline,
      }))

      await collectTemperatureData({
        shipmentId: registeredShipment.id,
        readings: formattedReadings,
        clerkId: currentUserId,
      })

      setStep('register')
      setFormData({
        batchNumber: '',
        medicineId: '',
        quantity: '',
        carrierId: '',
        probeId: '',
      })
      setReadings([])
      setRegisteredShipment(null)

      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : '温度数据提交失败')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const sortedReadings = [...readings].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  const selectedMedicine = medicines.find((m) => m.id === formData.medicineId)

  if (step === 'temperature' && registeredShipment) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">温控记录录入</h1>
          <p className="mt-1 text-sm text-gray-600">
            录入批次 {registeredShipment.batchNumber} 的温度数据和探头离线记录
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{registeredShipment.batchNumber}</p>
              <p className="text-sm text-gray-500">{registeredShipment.medicineName}</p>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              已登记，待采集温度
            </span>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Thermometer className="w-5 h-5 mr-2 text-blue-600" />
            添加记录
          </h2>

          <div className="flex space-x-4 mb-4">
            <button
              type="button"
              onClick={() => setReadingType('temperature')}
              className={`flex-1 py-2 px-4 rounded-md border transition-colors ${
                readingType === 'temperature'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              <Thermometer className="w-4 h-4 inline mr-2" />
              温度点记录
            </button>
            <button
              type="button"
              onClick={() => setReadingType('offline')}
              className={`flex-1 py-2 px-4 rounded-md border transition-colors ${
                readingType === 'offline'
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              <AlertTriangle className="w-4 h-4 inline mr-2" />
              探头离线记录
            </button>
          </div>

          {readingType === 'temperature' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  时间 <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={newReadingTime}
                  onChange={(e) => setNewReadingTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Thermometer className="w-4 h-4 inline mr-1" />
                  温度 (℃) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newReadingTemp}
                  onChange={(e) => setNewReadingTemp(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="如 5.2"
                  disabled={loading}
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={addTemperatureReading}
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  添加
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  离线开始 <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={offlineStart}
                  onChange={(e) => setOfflineStart(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  离线结束 <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={offlineEnd}
                  onChange={(e) => setOfflineEnd(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  disabled={loading}
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={addOfflineReading}
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-orange-600 text-white font-medium rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  添加离线段
                </button>
              </div>
            </div>
          )}

          {selectedMedicine && (
            <p className="mt-3 text-xs text-gray-500">
              药品储存温度范围：{selectedMedicine.minTemp}℃ ~ {selectedMedicine.maxTemp}℃
            </p>
          )}
        </div>

        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
            已录入记录 ({sortedReadings.length} 条)
          </h2>

          {sortedReadings.length === 0 ? (
            <div className="text-center py-8">
              <Thermometer className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">暂无温度记录，请在上方添加</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      时间
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      类型
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      温度
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedReadings.map((reading) => (
                    <tr key={reading.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {new Date(reading.timestamp).toLocaleString('zh-CN')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {reading.isOffline ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            探头离线
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            温度正常
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {reading.isOffline ? '-' : `${reading.temperature}℃`}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={() => removeReading(reading.id)}
                          className="text-red-600 hover:text-red-800"
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => {
              setStep('register')
              setReadings([])
              setRegisteredShipment(null)
            }}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            返回登记
          </button>
          <button
            type="button"
            onClick={handleTemperatureSubmit}
            disabled={loading || sortedReadings.length === 0}
            className="inline-flex items-center px-6 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? '提交中...' : '提交温度数据'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">入库登记</h1>
        <p className="mt-1 text-sm text-gray-600">
          仓库经办人登记到货批次信息和温控记录
        </p>
      </div>

      {currentRole !== Role.WAREHOUSE_CLERK && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-700">
            当前角色为：{currentRole}。入库登记功能仅对仓库经办人开放。请切换到仓库经办人角色。
          </p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleRegisterSubmit} className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="batchNumber" className="block text-sm font-medium text-gray-700 mb-2">
              <Hash className="w-4 h-4 inline mr-1" />
              批次号 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="batchNumber"
              name="batchNumber"
              value={formData.batchNumber}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="请输入批次号"
              disabled={currentRole !== Role.WAREHOUSE_CLERK || loading}
            />
          </div>

          <div>
            <label htmlFor="medicineId" className="block text-sm font-medium text-gray-700 mb-2">
              <Package className="w-4 h-4 inline mr-1" />
              药品 <span className="text-red-500">*</span>
            </label>
            <select
              id="medicineId"
              name="medicineId"
              value={formData.medicineId}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={currentRole !== Role.WAREHOUSE_CLERK || loading}
            >
              <option value="">请选择药品</option>
              {medicines.map((med) => (
                <option key={med.id} value={med.id}>
                  {med.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
              <Package className="w-4 h-4 inline mr-1" />
              数量 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              required
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="请输入数量"
              disabled={currentRole !== Role.WAREHOUSE_CLERK || loading}
            />
          </div>

          <div>
            <label htmlFor="carrierId" className="block text-sm font-medium text-gray-700 mb-2">
              <Truck className="w-4 h-4 inline mr-1" />
              承运商 <span className="text-red-500">*</span>
            </label>
            <select
              id="carrierId"
              name="carrierId"
              value={formData.carrierId}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={currentRole !== Role.WAREHOUSE_CLERK || loading}
            >
              <option value="">请选择承运商</option>
              {carriers.map((carrier) => (
                <option key={carrier.id} value={carrier.id}>
                  {carrier.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="probeId" className="block text-sm font-medium text-gray-700 mb-2">
              <Thermometer className="w-4 h-4 inline mr-1" />
              温度探头 <span className="text-red-500">*</span>
            </label>
            <select
              id="probeId"
              name="probeId"
              value={formData.probeId}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={currentRole !== Role.WAREHOUSE_CLERK || loading}
            >
              <option value="">请选择温度探头</option>
              {probes.map((probe) => (
                <option key={probe.id} value={probe.id}>
                  {probe.serialNumber} - {probe.model}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={currentRole !== Role.WAREHOUSE_CLERK || loading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? '登记中...' : '下一步：录入温控记录'}
          </button>
        </div>
      </form>
    </div>
  )
}
