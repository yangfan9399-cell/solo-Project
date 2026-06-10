import { useState } from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { AlertTriangle, CheckCircle, Clock, FileText, User, Calendar, ChevronRight, Upload, MessageSquare } from 'lucide-react'

interface ClaimDetailType {
  id: number
  batchNumber: string | null
  partNumber: string | null
  partName: string | null
  categoryName: string | null
  supplierName: string | null
  defectType: string | null
  quantityDefective: number
  claimAmount: string
  description: string | null
  status: string | null
  batchTraceable: boolean | null
  repairDeadline: string | null
  repairCompleted: boolean | null
  engineerName: string | null
  createdAt: string | null
  updatedAt: string | null
  evidences: Array<{
    id: number
    type: string | null
    url: string | null
    description: string | null
    uploadedAt: string | null
  }>
  history: Array<{
    id: number
    status: string
    comment: string | null
    operator: string | null
    createdAt: string | null
  }>
  supplierResponse: {
    responseType: string
    comment: string | null
    evidenceUrl: string | null
    createdAt: string | null
  } | null
}

interface ClaimDetailProps {
  claim: ClaimDetailType
  onUpdateStatus: (status: string, comment: string, operator: string) => void
  onSupplierResponse: (responseType: string, comment: string, evidenceUrl: string | null) => void
}

export function ClaimDetail({ claim, onUpdateStatus, onSupplierResponse }: ClaimDetailProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'evidence' | 'history'>('info')
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState<'status' | 'response'>('status')
  const [newStatus, setNewStatus] = useState('')
  const [comment, setComment] = useState('')
  const [responseType, setResponseType] = useState<'accept' | 'reject'>('accept')

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const formatAmount = (amount: string) => {
    return Number(amount).toLocaleString('zh-CN', { minimumFractionDigits: 2 })
  }

  const canProcessPayment = claim.batchTraceable !== false

  const handleSubmit = () => {
    if (actionType === 'status') {
      onUpdateStatus(newStatus, comment, '财务部')
    } else {
      onSupplierResponse(responseType, comment, null)
    }
    setShowActionModal(false)
    setComment('')
  }

  const tabs = [
    { id: 'info' as const, label: '基本信息' },
    { id: 'evidence' as const, label: '证据材料' },
    { id: 'history' as const, label: '历史记录' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">索赔 #{claim.id}</h1>
          <div className="flex items-center gap-3 mt-1">
            <StatusBadge status={claim.status || 'pending'} />
            {claim.batchTraceable === false && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-danger/10 text-danger">
                <AlertTriangle className="h-3 w-3" />
                批次追溯失败
              </span>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          {claim.status === 'supplier_notified' && (
            <Button onClick={() => { setActionType('response'); setShowActionModal(true) }}>
              <MessageSquare className="h-4 w-4 mr-2" />
              供应商回复
            </Button>
          )}
          {claim.status === 'supplier_response' && !canProcessPayment && (
            <Button variant="warning">
              <AlertTriangle className="h-4 w-4 mr-2" />
              需补充追溯证据
            </Button>
          )}
          {claim.status === 'supplier_response' && canProcessPayment && (
            <Button onClick={() => { setActionType('status'); setNewStatus('under_review'); setShowActionModal(true) }}>
              提交财务复核
            </Button>
          )}
          {claim.status === 'under_review' && (
            <Button 
              variant="success" 
              disabled={!canProcessPayment}
              onClick={() => { setActionType('status'); setNewStatus('approved'); setShowActionModal(true) }}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              确认扣款
            </Button>
          )}
        </div>
      </div>

      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-secondary hover:text-foreground hover:border-border'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {activeTab === 'info' && (
          <>
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <h2 className="text-lg font-semibold">零件信息</h2>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-secondary">零件编号</p>
                      <p className="font-medium">{claim.partNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-secondary">零件名称</p>
                      <p className="font-medium">{claim.partName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-secondary">零件类别</p>
                      <p className="font-medium">{claim.categoryName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-secondary">供应商</p>
                      <p className="font-medium">{claim.supplierName}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <h2 className="text-lg font-semibold">批次信息</h2>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-secondary">批次编号</p>
                      <p className="font-medium">{claim.batchNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-secondary">追溯状态</p>
                      <p className={`font-medium ${claim.batchTraceable ? 'text-success' : 'text-danger'}`}>
                        {claim.batchTraceable ? '可追溯' : '追溯失败'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <h2 className="text-lg font-semibold">缺陷详情</h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-secondary">缺陷类型</p>
                      <p className="font-medium">{claim.defectType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-secondary">不良数量</p>
                      <p className="font-medium">{claim.quantityDefective} 件</p>
                    </div>
                    <div>
                      <p className="text-sm text-secondary">问题描述</p>
                      <p className="font-medium">{claim.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {claim.supplierResponse && (
                <Card>
                  <CardHeader className="pb-3">
                    <h2 className="text-lg font-semibold">供应商回复</h2>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-secondary">回复类型</p>
                        <p className={`font-medium ${claim.supplierResponse.responseType === 'accept' ? 'text-success' : 'text-danger'}`}>
                          {claim.supplierResponse.responseType === 'accept' ? '同意索赔' : '反驳索赔'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-secondary">回复内容</p>
                        <p className="font-medium">{claim.supplierResponse.comment}</p>
                      </div>
                      <div>
                        <p className="text-sm text-secondary">回复时间</p>
                        <p className="font-medium">{formatDate(claim.supplierResponse.createdAt)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-danger/5 to-danger/10">
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm text-secondary mb-1">索赔金额</p>
                    <p className="text-4xl font-bold text-danger">¥{formatAmount(claim.claimAmount)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <h2 className="text-lg font-semibold">登记信息</h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-secondary" />
                      <span className="text-sm">{claim.engineerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-secondary" />
                      <span className="text-sm">{formatDate(claim.createdAt)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {claim.repairDeadline && (
                <Card className={new Date(claim.repairDeadline) < new Date() && claim.repairCompleted === false ? 'border-danger' : ''}>
                  <CardHeader className="pb-3">
                    <h2 className="text-lg font-semibold">返修期限</h2>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Clock className={`h-4 w-4 ${new Date(claim.repairDeadline) < new Date() && claim.repairCompleted === false ? 'text-danger' : 'text-secondary'}`} />
                        <span className={`text-sm ${new Date(claim.repairDeadline) < new Date() && claim.repairCompleted === false ? 'text-danger font-medium' : ''}`}>
                          {formatDate(claim.repairDeadline)}
                          {new Date(claim.repairDeadline) < new Date() && claim.repairCompleted === false && ' (已超期)'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className={`h-4 w-4 ${claim.repairCompleted ? 'text-success' : 'text-secondary'}`} />
                        <span className="text-sm">{claim.repairCompleted ? '已完成返修' : '待返修'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {claim.batchTraceable === false && (
                <Card className="border-danger bg-danger/5">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-danger flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-danger">批次追溯失败</p>
                        <p className="text-sm text-secondary mt-1">
                          当前批次无法追溯，需要补充追溯证据后才能进行扣款操作。
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}

        {activeTab === 'evidence' && (
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">证据材料</h2>
                <Button size="sm" variant="secondary">
                  <Upload className="h-4 w-4 mr-2" />
                  上传证据
                </Button>
              </CardHeader>
              <CardContent>
                {claim.evidences.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {claim.evidences.map((evidence) => (
                      <div key={evidence.id} className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                        <FileText className="h-12 w-12 text-primary" />
                        <div className="flex-1">
                          <p className="font-medium">{evidence.type}</p>
                          <p className="text-sm text-secondary">{evidence.description}</p>
                          <p className="text-xs text-secondary mt-1">{formatDate(evidence.uploadedAt)}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-secondary" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <FileText className="h-12 w-12 text-secondary mx-auto mb-3" />
                    <p className="text-secondary">暂无证据材料</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">处理历史</h2>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
                  {claim.history.map((item, index) => (
                    <div key={item.id} className="relative flex gap-4 pb-8 last:pb-0">
                      <div className={`relative flex items-center justify-center w-12 h-12 rounded-full ${
                        index === claim.history.length - 1 ? 'bg-primary text-white' : 'bg-muted text-secondary'
                      }`}>
                        {index === claim.history.length - 1 ? (
                          <CheckCircle className="h-6 w-6" />
                        ) : (
                          <span className="text-sm font-medium">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 pt-2">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={item.status} />
                          <span className="text-sm text-secondary">{formatDate(item.createdAt)}</span>
                        </div>
                        <p className="font-medium mt-1">{item.comment}</p>
                        <p className="text-sm text-secondary">操作人：{item.operator}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {showActionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">
              {actionType === 'status' ? '更新状态' : '供应商回复'}
            </h3>
            
            {actionType === 'status' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">操作</label>
                <p className="text-secondary">确认将状态更新为：{newStatus === 'approved' ? '索赔通过' : newStatus === 'under_review' ? '财务复核中' : newStatus}</p>
              </div>
            )}
            
            {actionType === 'response' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">回复类型</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setResponseType('accept')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      responseType === 'accept' ? 'bg-success text-white' : 'bg-muted hover:bg-border'
                    }`}
                  >
                    同意索赔
                  </button>
                  <button
                    onClick={() => setResponseType('reject')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      responseType === 'reject' ? 'bg-danger text-white' : 'bg-muted hover:bg-border'
                    }`}
                  >
                    反驳索赔
                  </button>
                </div>
              </div>
            )}
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">备注说明</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={3}
                placeholder="请输入备注说明..."
              />
            </div>
            
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setShowActionModal(false)} className="flex-1">
                取消
              </Button>
              <Button onClick={handleSubmit} className="flex-1">
                确认
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
