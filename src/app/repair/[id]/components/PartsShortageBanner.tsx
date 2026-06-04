'use client'

import { useState } from 'react'
import { AlertTriangle, Clock, Package, UserCog, ChevronDown, ChevronUp } from 'lucide-react'
import { resolvePartsShortage, reassignTechnician } from '@/app/actions'
import { formatDate } from '@/lib/utils'

export default function PartsShortageBanner({ order, technicians }: {
  order: {
    id: string
    blockingReason: string | null
    partsNeeded: string | null
    estimatedDelay: number | null
    technicianId: string | null
  }
  technicians: { id: string; name: string }[]
}) {
  const [showOptions, setShowOptions] = useState(false)
  const [selectedTechnician, setSelectedTechnician] = useState('')

  const handleResolve = async () => {
    await resolvePartsShortage(order.id)
  }

  const handleReassign = async () => {
    if (selectedTechnician) {
      await reassignTechnician(order.id, selectedTechnician)
    }
  }

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-orange-800">配件缺货 - 维修进度受阻</h3>
          <p className="text-orange-700 mt-1">{order.blockingReason}</p>
          
          <div className="flex flex-wrap gap-4 mt-3 text-sm">
            {order.partsNeeded && (
              <div className="flex items-center gap-2 text-orange-700">
                <Package className="h-4 w-4" />
                <span>所需配件: {order.partsNeeded}</span>
              </div>
            )}
            {order.estimatedDelay && (
              <div className="flex items-center gap-2 text-orange-700">
                <Clock className="h-4 w-4" />
                <span>预计延期: {order.estimatedDelay} 天</span>
              </div>
            )}
          </div>

          <div className="mt-4">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="flex items-center gap-2 text-orange-600 hover:text-orange-700 text-sm font-medium"
            >
              处理选项
              {showOptions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            
            {showOptions && (
              <div className="mt-3 space-y-3">
                <div className="bg-white rounded-lg p-4 border border-orange-200">
                  <h4 className="font-medium text-gray-900 mb-2">选项一: 等待配件到货后继续</h4>
                  <p className="text-sm text-gray-500 mb-3">配件到货后，继续由当前维修员处理</p>
                  <button
                    onClick={handleResolve}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
                  >
                    标记配件已到货，继续维修
                  </button>
                </div>

                <div className="bg-white rounded-lg p-4 border border-orange-200">
                  <h4 className="font-medium text-gray-900 mb-2">选项二: 改派其他维修员</h4>
                  <p className="text-sm text-gray-500 mb-3">重新分配维修员，尝试其他解决方案</p>
                  <div className="flex gap-2">
                    <select
                      value={selectedTechnician}
                      onChange={(e) => setSelectedTechnician(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="">选择维修员</option>
                      {technicians
                        .filter(t => t.id !== order.technicianId)
                        .map((tech) => (
                          <option key={tech.id} value={tech.id}>
                            {tech.name}
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={handleReassign}
                      disabled={!selectedTechnician}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      改派
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
