import { useState } from 'react'
import { Search, Filter, Eye, ArrowRight } from 'lucide-react'
import prisma from '@/lib/prisma'
import { Agreement, AgreementStatus, PaymentStatus } from '@/types'
import { formatCurrency, formatDate, getStatusText, getStatusColor } from '@/utils/format'

const districts = ['朝阳区', '海淀区', '西城区', '东城区', '丰台区', '石景山区', '通州区', '顺义区']
const buildingTypes = ['住宅', '商业']
const statusOptions: { value: AgreementStatus; label: string }[] = [
  { value: 'PENDING', label: '待处理' },
  { value: 'SIGNED', label: '已签约' },
  { value: 'EVALUATED', label: '已评估' },
  { value: 'ACCEPTED', label: '已验收' },
  { value: 'COMPENSATED', label: '已发放' },
  { value: 'DISPUTED', label: '争议处理中' },
  { value: 'REVIEWING', label: '复核中' },
]
const paymentStatusOptions: { value: PaymentStatus; label: string }[] = [
  { value: 'UNPAID', label: '未发放' },
  { value: 'PAID', label: '已发放' },
  { value: 'FROZEN', label: '已冻结' },
]

export default function Home({ agreements }: { agreements: Agreement[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState<string>('')
  const [selectedBuildingType, setSelectedBuildingType] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<AgreementStatus>('')
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<PaymentStatus>('')

  const filteredAgreements = agreements.filter((agreement) => {
    const matchesSearch =
      agreement.agreementNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agreement.resident?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agreement.house?.houseNumber.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDistrict = !selectedDistrict || agreement.house?.district === selectedDistrict
    const matchesBuildingType = !selectedBuildingType || agreement.house?.buildingType === selectedBuildingType
    const matchesStatus = !selectedStatus || agreement.status === selectedStatus
    const matchesPaymentStatus = !selectedPaymentStatus || agreement.paymentStatus === selectedPaymentStatus

    return matchesSearch && matchesDistrict && matchesBuildingType && matchesStatus && matchesPaymentStatus
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">城市更新居民签约搬迁与补偿复核系统</h1>
              <p className="text-gray-500 mt-1">管理居民签约、搬迁验收及补偿发放全流程</p>
            </div>
            <nav className="flex items-center gap-4">
              <a href="/" className="text-primary-600 font-medium">签约列表</a>
              <a href="/review" className="text-gray-600 hover:text-primary-600 transition-colors">数据复盘</a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="card mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="搜索协议编号、居民姓名、房屋编号..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-400" />
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="form-select w-36"
              >
                <option value="">全部片区</option>
                {districts.map((district) => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
              
              <select
                value={selectedBuildingType}
                onChange={(e) => setSelectedBuildingType(e.target.value)}
                className="form-select w-28"
              >
                <option value="">房屋类型</option>
                {buildingTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as AgreementStatus)}
                className="form-select w-36"
              >
                <option value="">协议状态</option>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              
              <select
                value={selectedPaymentStatus}
                onChange={(e) => setSelectedPaymentStatus(e.target.value as PaymentStatus)}
                className="form-select w-28"
              >
                <option value="">发放状态</option>
                {paymentStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card text-center">
            <div className="text-3xl font-bold text-primary-600">{agreements.length}</div>
            <div className="text-gray-500 mt-1">协议总数</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-success">{agreements.filter((a) => a.status === 'COMPENSATED').length}</div>
            <div className="text-gray-500 mt-1">已发放</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-warning">{agreements.filter((a) => a.status === 'DISPUTED').length}</div>
            <div className="text-gray-500 mt-1">争议处理中</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-error">{agreements.filter((a) => a.frozen).length}</div>
            <div className="text-gray-500 mt-1">已冻结</div>
          </div>
        </div>

        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">协议编号</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">居民信息</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">房屋信息</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">签约日期</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">补偿金额</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">协议状态</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">发放状态</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredAgreements.map((agreement) => (
                  <tr key={agreement.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4 font-medium text-primary-600">{agreement.agreementNo}</td>
                    <td className="py-4 px-4">
                      <div className="font-medium">{agreement.resident?.name}</div>
                      <div className="text-sm text-gray-500">{agreement.resident?.phone}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-medium">{agreement.house?.houseNumber}</div>
                      <div className="text-sm text-gray-500">{agreement.house?.location} · {agreement.house?.district}</div>
                    </td>
                    <td className="py-4 px-4 text-gray-600">{formatDate(agreement.signingDate)}</td>
                    <td className="py-4 px-4 text-right font-medium">
                      {agreement.totalCompensation > 0 ? formatCurrency(agreement.totalCompensation) : '-'}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`badge ${getStatusColor(agreement.status)}`}>
                        {getStatusText(agreement.status)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`badge ${getStatusColor(agreement.paymentStatus)}`}>
                        {getStatusText(agreement.paymentStatus)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <Link 
                        href={`/agreement/${agreement.id}`}
                        className="flex items-center justify-center gap-1 text-primary-600 hover:text-primary-700 transition-colors"
                      >
                        <Eye size={16} />
                        <span>查看详情</span>
                        <ArrowRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredAgreements.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p>暂无符合条件的协议记录</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export async function getServerSideProps() {
  const agreements = await prisma.agreement.findMany({
    include: {
      resident: true,
      house: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return {
    props: {
      agreements: JSON.parse(JSON.stringify(agreements)),
    },
  }
}
