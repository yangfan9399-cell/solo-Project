import { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  MapPin,
  Phone,
} from 'lucide-react'

interface Inspection {
  id: number
  residentName: string
  phone: string
  address: string
  community: string
  building: string
  floor: number
  room: string
  meterNumber: string
  inspectorName: string
  inspectionDate: string
  status: 'pending' | 'completed' | 'rejected'
  notes: string | null
  hazardCount: number | null
}

export default function HomePage() {
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    async function fetchData() {
      const response = await fetch('/api/inspections')
      const data = await response.json()
      setInspections(data)
      setLoading(false)
    }
    fetchData()
  }, [])

  const filteredInspections = inspections.filter((item) => {
    const matchesSearch =
      item.residentName.includes(searchTerm) ||
      item.address.includes(searchTerm) ||
      item.phone.includes(searchTerm)
    const matchesStatus =
      statusFilter === 'all' || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string, hasHazard: boolean) => {
    const statusConfig = {
      pending: { label: '待处理', color: 'bg-yellow-100 text-yellow-800' },
      completed: hasHazard
        ? { label: '已整改', color: 'bg-green-100 text-green-800' }
        : { label: '已通过', color: 'bg-blue-100 text-blue-800' },
      rejected: { label: '用户拒检', color: 'bg-red-100 text-red-800' },
    }
    return statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      color: 'bg-gray-100 text-gray-800',
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  燃气入户安检系统
                </h1>
                <p className="text-sm text-gray-500">隐患整改与复查管理</p>
              </div>
            </div>
            <nav className="flex items-center gap-6">
              <a
                href="/"
                className="font-medium text-primary border-b-2 border-primary pb-1"
              >
                安检列表
              </a>
              <a
                href="/review"
                className="font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                数据复盘
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索住户姓名、地址、电话..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="all">全部状态</option>
                <option value="pending">待处理</option>
                <option value="completed">已完成</option>
                <option value="rejected">用户拒检</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredInspections.map((item) => {
              const statusBadge = getStatusBadge(item.status, item.hazardCount !== 0)
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() =>
                    (window.location.href = `/inspection/${item.id}`)
                  }
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold text-gray-900">
                            {item.residentName}
                          </span>
                          <span
                            className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusBadge.color}`}
                          >
                            {statusBadge.label}
                          </span>
                        </div>
                        {item.hazardCount && item.hazardCount > 0 && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                            {item.hazardCount} 项隐患
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>
                            {item.community} {item.building} {item.floor}楼
                            {item.room}室
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{item.phone}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span>
                            表具编号: {item.meterNumber}
                          </span>
                          <span>
                            安检员: {item.inspectorName}
                          </span>
                          <span>
                            日期: {new Date(item.inspectionDate).toLocaleDateString()}
                          </span>
                        </div>
                        {item.notes && (
                          <p className="mt-2 text-gray-500">
                            {item.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusIcon(item.status)}
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </div>
              )
            })}
            {filteredInspections.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  未找到相关记录
                </h3>
                <p className="text-gray-500">
                  请尝试调整搜索条件或筛选条件
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
