import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Package, Building, MapPin, User } from 'lucide-react'
import { getAssets } from '../server/api/assets'
import DataTable from '../components/DataTable'

interface Asset {
  id: number
  assetNo: string
  name: string
  categoryName: string | null
  departmentName: string | null
  location: string | null
  userName: string | null
  purchaseDate: string
  bookValue: string
  tagNumber: string | null
  status: string
}

export default function AssetList() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getAssets()
        setAssets(data as Asset[])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredAssets = assets.filter(
    (asset) =>
      asset.assetNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.userName && asset.userName.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const columns = [
    { key: 'assetNo', label: '资产编号' },
    { key: 'name', label: '资产名称' },
    { key: 'categoryName', label: '资产类别' },
    { key: 'departmentName', label: '所属部门' },
    { key: 'userName', label: '使用人' },
    { key: 'location', label: '存放位置' },
    { key: 'bookValue', label: '账面价值' },
    { key: 'status', label: '状态' },
  ] as { key: string; label: string }[]

  if (loading) {
    return <div className="flex items-center justify-center h-64">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索资产编号、名称或使用人..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Package className="w-4 h-4" />
            资产总数
          </div>
          <div className="text-2xl font-bold text-gray-800">{assets.length}</div>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <User className="w-4 h-4" />
            使用中
          </div>
          <div className="text-2xl font-bold text-green-800">
            {assets.filter((a) => a.status === 'in_use').length}
          </div>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <MapPin className="w-4 h-4" />
            已丢失
          </div>
          <div className="text-2xl font-bold text-red-800">
            {assets.filter((a) => a.status === 'lost').length}
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-blue-600 text-sm">
            <Building className="w-4 h-4" />
            部门数
          </div>
          <div className="text-2xl font-bold text-blue-800">
            {new Set(assets.map((a) => a.departmentName)).size}
          </div>
        </div>
      </div>

      <DataTable
        data={filteredAssets}
        columns={columns}
        onRowClick={(row) => navigate(`/assets/${row.id}`)}
      />
    </div>
  )
}