import Link from 'next/link'
import { getShipments } from '@/lib/services'
import { StatusBadge } from '@/components/StatusBadge'
import { Package, Calendar, User, Thermometer } from 'lucide-react'

export default async function ShipmentsPage() {
  const shipments = await getShipments()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">批次列表</h1>
        <p className="mt-1 text-sm text-gray-600">
          查看所有冷链药品批次的入库、温度、偏差和处置状态
        </p>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  批次号
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  药品名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  承运商
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  偏差类型
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  偏差等级
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  当前状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  当前责任人
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {shipments.map((shipment) => (
                <tr key={shipment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Package className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="font-medium text-blue-600 hover:text-blue-800">
                        <Link href={`/shipments/${shipment.id}`}>
                          {shipment.batchNumber}
                        </Link>
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      数量: {shipment.quantity}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {shipment.medicineName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {shipment.carrierName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge type="deviation-type" value={shipment.deviationType} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge type="deviation-level" value={shipment.deviationLevel} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge type="shipment" value={shipment.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {shipment.currentHandlerName ? (
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="w-4 h-4 mr-1" />
                        {shipment.currentHandlerName}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">已结案</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/shipments/${shipment.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      查看详情
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">总批次</p>
              <p className="text-2xl font-bold text-gray-900">{shipments.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Thermometer className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">已放行</p>
              <p className="text-2xl font-bold text-gray-900">
                {shipments.filter(s => s.status === 'RELEASED').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">已隔离</p>
              <p className="text-2xl font-bold text-gray-900">
                {shipments.filter(s => s.status === 'ISOLATED').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <User className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">待处理</p>
              <p className="text-2xl font-bold text-gray-900">
                {shipments.filter(s => s.status === 'DEVIATION_JUDGED').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
