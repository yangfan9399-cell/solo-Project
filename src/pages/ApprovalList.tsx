import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, CheckCircle, XCircle, Clock } from 'lucide-react'
import { getDisposalProcesses, getAccountabilityRecords, type DisposalProcess, type AccountabilityRecord } from '../data/mockData'
import DataTable from '../components/DataTable'

export default function ApprovalList() {
  const [processes, setProcesses] = useState<DisposalProcess[]>([])
  const [accountabilityList, setAccountabilityList] = useState<AccountabilityRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'approval' | 'accountability'>('approval')
  const navigate = useNavigate()

  useEffect(() => {
    async function fetchData() {
      try {
        const [processData, accountabilityData] = await Promise.all([
          getDisposalProcesses(),
          getAccountabilityRecords(),
        ])
        setProcesses(processData)
        setAccountabilityList(accountabilityData)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const approvalColumns = [
    { key: 'inventoryRecordId', label: '盘点记录ID' },
    { key: 'processType', label: '处理类型' },
    { key: 'departmentApproverName', label: '部门审批' },
    { key: 'financeApproverName', label: '财务复核' },
    { key: 'supervisorApproverName', label: '主管审批' },
    { key: 'status', label: '状态' },
    { key: 'createdAt', label: '创建时间' },
  ] as { key: string; label: string }[]

  const accountabilityColumns = [
    { key: 'assetNo', label: '资产编号' },
    { key: 'assetName', label: '资产名称' },
    { key: 'responsibleUserName', label: '责任人' },
    { key: 'investigationResult', label: '调查结果' },
    { key: 'compensationAmount', label: '赔偿金额' },
    { key: 'status', label: '状态' },
    { key: 'createdAt', label: '创建时间' },
  ] as { key: string; label: string }[]

  const rowClassName = (row: unknown) => {
    const status = (row as Record<string, unknown>).status as string
    if (status === 'pending') return 'bg-yellow-50'
    if (status === 'approved') return 'bg-green-50'
    if (status === 'rejected') return 'bg-red-50'
    return ''
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('approval')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'approval'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            审批流程
          </span>
        </button>
        <button
          onClick={() => setActiveTab('accountability')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'accountability'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span className="flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            追责流程
          </span>
        </button>
      </div>

      {activeTab === 'approval' ? (
        <>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-gray-500 text-sm">审批总数</div>
              <div className="text-2xl font-bold text-gray-800">{processes.length}</div>
            </div>
            <div className="bg-yellow-50 rounded-lg shadow p-4">
              <div className="flex items-center gap-2 text-yellow-600 text-sm">
                <Clock className="w-4 h-4" />
                待审批
              </div>
              <div className="text-2xl font-bold text-yellow-800">
                {processes.filter((p) => p.status === 'pending').length}
              </div>
            </div>
            <div className="bg-green-50 rounded-lg shadow p-4">
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle className="w-4 h-4" />
                已通过
              </div>
              <div className="text-2xl font-bold text-green-800">
                {processes.filter((p) => p.status === 'approved').length}
              </div>
            </div>
            <div className="bg-red-50 rounded-lg shadow p-4">
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <XCircle className="w-4 h-4" />
                已拒绝
              </div>
              <div className="text-2xl font-bold text-red-800">
                {processes.filter((p) => p.status === 'rejected').length}
              </div>
            </div>
          </div>

          <DataTable
            data={processes}
            columns={approvalColumns}
            onRowClick={(row) => navigate(`/approval/${(row as Record<string, unknown>).id}`)}
            rowClassName={rowClassName}
          />
        </>
      ) : (
        <>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">资产丢失追责流程</p>
                <p className="text-sm text-yellow-700">
                  当资产盘点发现丢失时，必须进入追责流程。系统会自动关联责任人信息，并记录调查结果和赔偿金额。
                </p>
              </div>
            </div>
          </div>

          <DataTable
            data={accountabilityList}
            columns={accountabilityColumns}
          />
        </>
      )}
    </div>
  )
}