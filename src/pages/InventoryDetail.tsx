import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, MapPin, User, Calendar, Tag, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import { getInventoryRecordById } from '../server/api/assets'
import { getDisposalProcessById, createDisposalProcess, updateDisposalProcess } from '../server/api/approval'

interface InventoryRecord {
  id: number
  assetId: number
  inventoryDate: string
  discrepancyTypeId: number | null
  actualStatus: string | null
  actualLocation: string | null
  actualUser: string | null
  photoUrl: string | null
  remarks: string | null
  recorderName: string
  createdAt: Date
  assetNo: string
  assetName: string
  assetLocation: string | null
  assetUser: string | null
  assetBookValue: string
  discrepancyTypeName: string | null
  discrepancyTypeCode: string | null
}

interface DisposalProcess {
  id: number
  inventoryRecordId: number
  processType: string
  departmentRemark: string | null
  departmentApprovedAt: Date | null
  departmentApproverId: string | null
  departmentApproverName: string | null
  financeRemark: string | null
  financeApprovedAt: Date | null
  financeApproverId: string | null
  financeApproverName: string | null
  supervisorRemark: string | null
  supervisorApprovedAt: Date | null
  supervisorApproverId: string | null
  supervisorApproverName: string | null
  status: string
  createdAt: Date
}

export default function InventoryDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [record, setRecord] = useState<InventoryRecord | null>(null)
  const [process, setProcess] = useState<DisposalProcess | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'detail' | 'approval'>('detail')
  const [departmentRemark, setDepartmentRemark] = useState('')
  const [financeRemark, setFinanceRemark] = useState('')
  const [supervisorRemark, setSupervisorRemark] = useState('')
  const [processType, setProcessType] = useState('transfer')

  useEffect(() => {
    async function fetchData() {
      try {
        const inventoryData = await getInventoryRecordById(parseInt(id || '0'))
        setRecord(inventoryData as InventoryRecord | null)
        if (inventoryData) {
          const processData = await getDisposalProcessById(inventoryData.id)
          setProcess(processData as DisposalProcess | null)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const handleCreateProcess = async () => {
    if (!record) return
    const newProcess = await createDisposalProcess({
      inventoryRecordId: record.id,
      processType,
    })
    setProcess(newProcess)
  }

  const handleDepartmentApprove = async () => {
    if (!process) return
    const updated = await updateDisposalProcess(process.id, {
      departmentRemark,
      departmentApprovedAt: new Date(),
      departmentApproverId: 'CURRENT_USER',
      departmentApproverName: '当前用户',
    })
    setProcess(updated)
  }

  const handleFinanceApprove = async () => {
    if (!process) return
    const updated = await updateDisposalProcess(process.id, {
      financeRemark,
      financeApprovedAt: new Date(),
      financeApproverId: 'CURRENT_USER',
      financeApproverName: '当前用户',
    })
    setProcess(updated)
  }

  const handleSupervisorApprove = async () => {
    if (!process) return
    const updated = await updateDisposalProcess(process.id, {
      supervisorRemark,
      supervisorApprovedAt: new Date(),
      supervisorApproverId: 'CURRENT_USER',
      supervisorApproverName: '当前用户',
      status: 'approved',
    })
    setProcess(updated)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">加载中...</div>
  }

  if (!record) {
    return <div className="flex items-center justify-center h-64">未找到记录</div>
  }

  const getDiscrepancyColor = (code: string | null) => {
    switch (code) {
      case 'MATCH':
        return 'bg-green-100 text-green-800'
      case 'LOST':
        return 'bg-red-100 text-red-800'
      case 'TRANSFER':
        return 'bg-blue-100 text-blue-800'
      case 'TAG_DAMAGED':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
      >
        <ArrowLeft className="w-5 h-5" />
        返回盘点列表
      </button>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{record.assetName}</h1>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getDiscrepancyColor(record.discrepancyTypeCode)}`}>
              {record.discrepancyTypeCode === 'MATCH' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {record.discrepancyTypeName}
            </span>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">资产编号</div>
            <div className="text-lg font-semibold text-gray-800">{record.assetNo}</div>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('detail')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'detail'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            资产详情
          </button>
          <button
            onClick={() => setActiveTab('approval')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'approval'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            审批流程
          </button>
        </div>

        {activeTab === 'detail' ? (
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                  <User className="w-4 h-4" />
                  使用人
                </div>
                <div className="text-lg font-medium">{record.assetUser}</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                  <MapPin className="w-4 h-4" />
                  账面位置
                </div>
                <div className="text-lg font-medium">{record.assetLocation}</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                  <Tag className="w-4 h-4" />
                  账面价值
                </div>
                <div className="text-lg font-medium">¥{record.assetBookValue}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                  <Camera className="w-4 h-4" />
                  盘点照片
                </div>
                <div className="w-full h-40 bg-gray-200 rounded flex items-center justify-center">
                  <span className="text-gray-400">照片占位</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                  <Calendar className="w-4 h-4" />
                  盘点日期
                </div>
                <div className="text-lg font-medium">{record.inventoryDate}</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                  <FileText className="w-4 h-4" />
                  备注
                </div>
                <div className="text-lg font-medium">{record.remarks}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {!process ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="font-medium text-yellow-800 mb-4">创建处理流程</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">处理类型</label>
                    <select
                      value={processType}
                      onChange={(e) => setProcessType(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="transfer">跨部门调拨</option>
                      <option value="scrap">报废处理</option>
                      <option value="maintain">维护修复</option>
                      <option value="update">信息更新</option>
                    </select>
                  </div>
                  <button
                    onClick={handleCreateProcess}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    创建流程
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-blue-800">使用部门补充说明</span>
                    {process.departmentApprovedAt ? (
                      <span className="text-green-600 text-sm">已完成</span>
                    ) : (
                      <span className="text-yellow-600 text-sm">待处理</span>
                    )}
                  </div>
                  {process.departmentApprovedAt ? (
                    <div className="mt-2">
                      <div className="text-gray-800">{process.departmentRemark}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        审批人: {process.departmentApproverName} | {process.departmentApprovedAt instanceof Date ? process.departmentApprovedAt.toLocaleString() : process.departmentApprovedAt}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <textarea
                        value={departmentRemark}
                        onChange={(e) => setDepartmentRemark(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        rows={3}
                        placeholder="请输入部门处理说明..."
                      />
                      <button
                        onClick={handleDepartmentApprove}
                        className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        提交部门审批
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-green-800">财务复核账务处理</span>
                    {process.financeApprovedAt ? (
                      <span className="text-green-600 text-sm">已完成</span>
                    ) : process.departmentApprovedAt ? (
                      <span className="text-yellow-600 text-sm">待处理</span>
                    ) : (
                      <span className="text-gray-400 text-sm">等待前置审批</span>
                    )}
                  </div>
                  {process.financeApprovedAt ? (
                    <div className="mt-2">
                      <div className="text-gray-800">{process.financeRemark}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        审批人: {process.financeApproverName} | {process.financeApprovedAt instanceof Date ? process.financeApprovedAt.toLocaleString() : process.financeApprovedAt}
                      </div>
                    </div>
                  ) : process.departmentApprovedAt ? (
                    <div className="mt-2">
                      <textarea
                        value={financeRemark}
                        onChange={(e) => setFinanceRemark(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        rows={3}
                        placeholder="请输入财务复核意见..."
                      />
                      <button
                        onClick={handleFinanceApprove}
                        className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        提交财务复核
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 text-gray-400">请先完成部门审批</div>
                  )}
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-purple-800">主管审批调拨或报废</span>
                    {process.supervisorApprovedAt ? (
                      <span className="text-green-600 text-sm">已完成</span>
                    ) : process.financeApprovedAt ? (
                      <span className="text-yellow-600 text-sm">待处理</span>
                    ) : (
                      <span className="text-gray-400 text-sm">等待前置审批</span>
                    )}
                  </div>
                  {process.supervisorApprovedAt ? (
                    <div className="mt-2">
                      <div className="text-gray-800">{process.supervisorRemark}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        审批人: {process.supervisorApproverName} | {process.supervisorApprovedAt instanceof Date ? process.supervisorApprovedAt.toLocaleString() : process.supervisorApprovedAt}
                      </div>
                    </div>
                  ) : process.financeApprovedAt ? (
                    <div className="mt-2">
                      <textarea
                        value={supervisorRemark}
                        onChange={(e) => setSupervisorRemark(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        rows={3}
                        placeholder="请输入主管审批意见..."
                      />
                      <button
                        onClick={handleSupervisorApprove}
                        className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        提交主管审批
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 text-gray-400">请先完成财务复核</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">历史节点</h3>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          <div className="space-y-4">
            <div className="relative flex items-start gap-4 pl-10">
              <div className="absolute left-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">1</span>
              </div>
              <div>
                <div className="font-medium text-gray-800">盘点登记</div>
                <div className="text-sm text-gray-500">{record.recorderName} | {record.createdAt instanceof Date ? record.createdAt.toLocaleString() : record.createdAt}</div>
              </div>
            </div>
            {process && process.departmentApprovedAt && (
              <div className="relative flex items-start gap-4 pl-10">
                <div className="absolute left-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">2</span>
                </div>
                <div>
                  <div className="font-medium text-gray-800">部门审批通过</div>
                  <div className="text-sm text-gray-500">{process.departmentApproverName} | {process.departmentApprovedAt instanceof Date ? process.departmentApprovedAt.toLocaleString() : process.departmentApprovedAt}</div>
                </div>
              </div>
            )}
            {process && process.financeApprovedAt && (
              <div className="relative flex items-start gap-4 pl-10">
                <div className="absolute left-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">3</span>
                </div>
                <div>
                  <div className="font-medium text-gray-800">财务复核通过</div>
                  <div className="text-sm text-gray-500">{process.financeApproverName} | {process.financeApprovedAt instanceof Date ? process.financeApprovedAt.toLocaleString() : process.financeApprovedAt}</div>
                </div>
              </div>
            )}
            {process && process.supervisorApprovedAt && (
              <div className="relative flex items-start gap-4 pl-10">
                <div className="absolute left-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">4</span>
                </div>
                <div>
                  <div className="font-medium text-gray-800">主管审批通过</div>
                  <div className="text-sm text-gray-500">{process.supervisorApproverName} | {process.supervisorApprovedAt instanceof Date ? process.supervisorApprovedAt.toLocaleString() : process.supervisorApprovedAt}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}