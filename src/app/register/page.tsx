'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { registerShipment, getMedicines, getCarriers, getProbes } from '@/lib/services'
import { Package, Truck, Thermometer, Hash, Save } from 'lucide-react'
import { useRole } from '@/context/RoleContext'
import { Role } from '@/lib/types'

export default function RegisterPage() {
  const router = useRouter()
  const { currentRole, currentUserId } = useRole()
  const [medicines, setMedicines] = useState<Array<{ id: string; name: string; minTemp: number; maxTemp: number }>>([])
  const [carriers, setCarriers] = useState<Array<{ id: string; name: string }>>([])
  const [probes, setProbes] = useState<Array<{ id: string; serialNumber: string; model: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    batchNumber: '',
    medicineId: '',
    quantity: '',
    carrierId: '',
    probeId: '',
  })

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

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

      setSuccess(true)
      setFormData({
        batchNumber: '',
        medicineId: '',
        quantity: '',
        carrierId: '',
        probeId: '',
      })

      setTimeout(() => {
        router.push('/')
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : '登记失败')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
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

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">登记成功！正在跳转到列表页...</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 space-y-6">
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
            {loading ? '登记中...' : '提交登记'}
          </button>
        </div>
      </form>
    </div>
  )
}
