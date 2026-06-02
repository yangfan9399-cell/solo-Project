'use client'

import { useState } from 'react'
import { X, User, Check } from 'lucide-react'
import { assignRepairOrder } from '@/app/actions/repairActions'
import { useAuth } from '@/lib/auth'
import Loading from './Loading'

interface Props {
  repairId: string
  workers: any[]
  onClose: () => void
  onAssigned: (repair: any) => void
}

export default function AssignWorkerModal({ repairId, workers, onClose, onAssigned }: Props) {
  const { user } = useAuth()
  const [selectedWorker, setSelectedWorker] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAssign = async () => {
    if (!user || !selectedWorker) return
    setLoading(true)
    try {
      const result = await assignRepairOrder(repairId, selectedWorker, user.id)
      if (result.success) {
        onAssigned(result.data)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold">分配维修师傅</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <div className="space-y-2 mb-6">
            {workers.map((worker) => (
              <button
                key={worker.id}
                onClick={() => setSelectedWorker(worker.id)}
                className={`w-full p-4 border rounded-xl flex items-center gap-3 transition-all ${
                  selectedWorker === worker.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">{worker.name}</p>
                  <p className="text-sm text-gray-500">
                    当前任务：{worker._count?.repairOrdersAssigned || 0} 个
                  </p>
                </div>
                {selectedWorker === worker.id && (
                  <Check className="w-5 h-5 text-primary-600" />
                )}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn btn-secondary flex-1">
              取消
            </button>
            <button
              onClick={handleAssign}
              className="btn btn-primary flex-1"
              disabled={!selectedWorker || loading}
            >
              {loading ? <Loading size="sm" /> : '确认派单'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
