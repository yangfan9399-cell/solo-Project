import { ArrowLeft, MapPin, User, FileText, Calculator, CheckSquare, History, AlertTriangle, Lock, Clock } from 'lucide-react'
import prisma from '@/lib/prisma'
import { Agreement } from '@/types'
import { formatCurrency, formatDate, formatDateTime, getStatusText, getStatusColor, getNodeTypeText } from '@/utils/format'

export default function AgreementDetail({ agreement }: { agreement: Agreement }) {
  const sortedHistory = [...(agreement.historyNodes || [])].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  const getNodeIcon = (nodeType: string) => {
    const iconMap: Record<string, typeof Clock> = {
      AGREEMENT_REGISTERED: FileText,
      AGREEMENT_SIGNED: FileText,
      EVALUATION_CONFIRMED: Calculator,
      AREA_DISPUTE: AlertTriangle,
      ACCEPTANCE_PASSED: CheckSquare,
      ACCEPTANCE_FAILED: AlertTriangle,
      COMPENSATION_REVIEWED: Calculator,
      COMPENSATION_APPROVED: CheckSquare,
      COMPENSATION_PAID: CheckSquare,
      FROZEN: Lock,
      REVIEW_REQUESTED: Clock,
    }
    return iconMap[nodeType] || Clock
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors">
              <ArrowLeft size={20} />
              <span>返回列表</span>
            </a>
            <div className="h-6 w-px bg-gray-200" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">协议详情</h1>
              <p className="text-gray-500 text-sm">协议编号：{agreement.agreementNo}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {agreement.frozen && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-2">
              <Lock className="text-red-500" size={20} />
              <span className="font-medium text-red-700">补偿已冻结</span>
              {agreement.freezeReason && (
                <span className="text-red-600">原因：{agreement.freezeReason}</span>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <User className="text-primary-600" size={20} />
              <h2 className="font-semibold text-gray-900">居民信息</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">姓名</span>
                <span className="font-medium">{agreement.resident?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">身份证号</span>
                <span className="font-mono text-sm">{agreement.resident?.idCardNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">联系电话</span>
                <span>{agreement.resident?.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">住址</span>
                <span className="text-right max-w-[200px] truncate">{agreement.resident?.address}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="text-primary-600" size={20} />
              <h2 className="font-semibold text-gray-900">房屋信息</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">房屋编号</span>
                <span className="font-medium">{agreement.house?.houseNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">房屋类型</span>
                <span>{agreement.house?.buildingType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">所在片区</span>
                <span>{agreement.house?.district}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">小区名称</span>
                <span>{agreement.house?.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">建筑面积</span>
                <span>{agreement.house?.area} m²</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="text-primary-600" size={20} />
            <h2 className="font-semibold text-gray-900">协议信息</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-gray-500 text-sm">协议编号</div>
              <div className="font-medium">{agreement.agreementNo}</div>
            </div>
            <div>
              <div className="text-gray-500 text-sm">签约日期</div>
              <div className="font-medium">{formatDate(agreement.signingDate)}</div>
            </div>
            <div>
              <div className="text-gray-500 text-sm">征收经办人</div>
              <div className="font-medium">{agreement.handlerName}</div>
            </div>
            <div>
              <div className="text-gray-500 text-sm">协议状态</div>
              <span className={`badge ${getStatusColor(agreement.status)}`}>
                {getStatusText(agreement.status)}
              </span>
            </div>
            <div>
              <div className="text-gray-500 text-sm">发放状态</div>
              <span className={`badge ${getStatusColor(agreement.paymentStatus)}`}>
                {getStatusText(agreement.paymentStatus)}
              </span>
            </div>
            <div>
              <div className="text-gray-500 text-sm">补偿金额</div>
              <div className="font-medium text-primary-600">
                {agreement.totalCompensation > 0 ? formatCurrency(agreement.totalCompensation) : '-'}
              </div>
            </div>
          </div>
        </div>

        {agreement.evaluation && (
          <div className="card mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="text-primary-600" size={20} />
              <h2 className="font-semibold text-gray-900">评估明细</h2>
              {agreement.evaluation.status === 'DISPUTED' && (
                <span className="ml-auto badge badge-danger">{getStatusText(agreement.evaluation.status)}</span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div>
                <div className="text-gray-500 text-sm">评估人员</div>
                <div className="font-medium">{agreement.evaluation.evaluatorName}</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm">建筑面积</div>
                <div className="font-medium">{agreement.evaluation.grossArea} m²</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm">套内面积</div>
                <div className="font-medium">{agreement.evaluation.netArea} m²</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm">评估单价</div>
                <div className="font-medium">{formatCurrency(agreement.evaluation.unitPrice)}/m²</div>
              </div>
            </div>
            <div className="flex justify-between items-center py-3 border-t border-gray-100">
              <span className="text-gray-500">评估总价</span>
              <span className="text-xl font-bold text-primary-600">
                {formatCurrency(agreement.evaluation.totalAmount)}
              </span>
            </div>
            {agreement.evaluation.disputeReason && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertTriangle size={18} />
                  <span className="font-medium">争议原因</span>
                </div>
                <p className="mt-2 text-amber-700">{agreement.evaluation.disputeReason}</p>
              </div>
            )}
            {agreement.evaluation.reviewed && agreement.evaluation.reviewResult && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckSquare size={18} />
                  <span className="font-medium">复核结果</span>
                </div>
                <p className="mt-2 text-green-700">{agreement.evaluation.reviewResult}</p>
                <p className="mt-1 text-sm text-green-600">复核日期：{formatDate(agreement.evaluation.reviewDate)}</p>
              </div>
            )}
          </div>
        )}

        {agreement.acceptance && (
          <div className="card mb-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckSquare className="text-primary-600" size={20} />
              <h2 className="font-semibold text-gray-900">验收结果</h2>
              <span className={`ml-auto badge ${getStatusColor(agreement.acceptance.status)}`}>
                {getStatusText(agreement.acceptance.status)}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-gray-500 text-sm">验收人员</div>
                <div className="font-medium">{agreement.acceptance.inspectorName}</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm">验收日期</div>
                <div className="font-medium">{formatDate(agreement.acceptance.checkDate)}</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm">验收状态</div>
                <div className={`font-medium ${agreement.acceptance.status === 'PASSED' ? 'text-green-600' : 'text-red-600'}`}>
                  {getStatusText(agreement.acceptance.status)}
                </div>
              </div>
            </div>
            {agreement.acceptance.remarks && (
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="text-gray-500 text-sm mb-1">备注</div>
                <p className="text-gray-700">{agreement.acceptance.remarks}</p>
              </div>
            )}
          </div>
        )}

        {agreement.compensation && (
          <div className="card mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="text-primary-600" size={20} />
              <h2 className="font-semibold text-gray-900">补偿复核</h2>
              <span className={`ml-auto badge ${getStatusColor(agreement.compensation.status)}`}>
                {getStatusText(agreement.compensation.status)}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="text-gray-500 text-sm">复核人员</div>
                <div className="font-medium">{agreement.compensation.reviewerName}</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm">复核日期</div>
                <div className="font-medium">{formatDate(agreement.compensation.reviewDate)}</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm">复核金额</div>
                <div className="font-medium text-primary-600">{formatCurrency(agreement.compensation.amount)}</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm">发放日期</div>
                <div className="font-medium">
                  {agreement.compensation.paymentDate ? formatDate(agreement.compensation.paymentDate) : '-'}
                </div>
              </div>
            </div>
            {agreement.compensation.remarks && (
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="text-gray-500 text-sm mb-1">备注</div>
                <p className="text-gray-700">{agreement.compensation.remarks}</p>
              </div>
            )}
          </div>
        )}

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <History className="text-primary-600" size={20} />
            <h2 className="font-semibold text-gray-900">历史节点</h2>
          </div>
          <div className="space-y-3">
            {sortedHistory.map((node, index) => {
              const Icon = getNodeIcon(node.nodeType)
              return (
                <div key={node.id} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      index === 0 ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <Icon size={18} />
                    </div>
                    {index < sortedHistory.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-200 mt-2" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{getNodeTypeText(node.nodeType)}</span>
                      <span className="text-sm text-gray-500">{formatDateTime(node.timestamp)}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">操作人：{node.operatorName}</div>
                    {node.remarks && (
                      <div className="text-sm text-gray-600 mt-1">{node.remarks}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}

export async function getServerSideProps(context: { params: { id: string } }) {
  const { id } = context.params

  const agreement = await prisma.agreement.findUnique({
    where: { id },
    include: {
      resident: true,
      house: true,
      evaluation: true,
      acceptance: true,
      compensation: true,
      historyNodes: true,
    },
  })

  if (!agreement) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      agreement: JSON.parse(JSON.stringify(agreement)),
    },
  }
}
