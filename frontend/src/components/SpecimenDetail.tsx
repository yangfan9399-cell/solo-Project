import { useState } from 'react'
import {
  Leaf,
  Droplets,
  Mountain,
  MapPin,
  Calendar,
  User,
  Lock,
  Unlock,
  History,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowRight,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSpecimenStore } from '@/store/useSpecimenStore'
import type { SpecimenStatus, SporeDensity } from '@/types'

const statusColors: Record<SpecimenStatus, string> = {
  待接收: 'bg-slate-100 text-slate-700',
  复判中: 'bg-blue-100 text-blue-700',
  已锁定: 'bg-green-100 text-green-700',
  已退回: 'bg-red-100 text-red-700',
}

const sporeDensityValues: Record<SporeDensity, number> = {
  无: 0,
  低: 33,
  中: 66,
  高: 100,
}

export function SpecimenDetail() {
  const {
    showDetailSidebar,
    closeDetail,
    specimenDetail,
    currentUser,
    toggleLock,
    openHistory,
    reviewSpecimen,
    isLoading,
  } = useSpecimenStore()

  const [opinion, setOpinion] = useState('')
  const [status, setStatus] = useState<SpecimenStatus | ''>('')
  const [belongsTo, setBelongsTo] = useState('')

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeDetail()
      setOpinion('')
      setStatus('')
      setBelongsTo('')
    }
  }

  const handleToggleLock = async () => {
    if (!specimenDetail) return
    const isLocked = specimenDetail.status === '已锁定'
    await toggleLock(specimenDetail.id, {
      locked_by: currentUser.name,
      unlock_reason: isLocked ? '需要重新判读' : undefined,
    })
  }

  const handleOpenHistory = () => {
    if (!specimenDetail) return
    openHistory(specimenDetail.id)
  }

  const handleSaveReview = async () => {
    if (!specimenDetail) return
    const data: { interpreter_opinion: string; status?: SpecimenStatus; current_belongs_to?: string } = {
      interpreter_opinion: opinion.trim() || specimenDetail.interpreter_opinion || '',
    }
    if (status) data.status = status
    if (belongsTo.trim()) data.current_belongs_to = belongsTo.trim()

    await reviewSpecimen(specimenDetail.id, data)
    setOpinion('')
    setStatus('')
    setBelongsTo('')
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('zh-CN')
  }

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('zh-CN')
  }

  if (!specimenDetail) return null

  const isLocked = specimenDetail.status === '已锁定'

  return (
    <Sheet open={showDetailSidebar} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0">
        <SheetHeader className="p-4 pb-0">
          <SheetTitle className="flex items-center gap-2">
            <span className="font-mono">{specimenDetail.specimen_no}</span>
            <Badge className={statusColors[specimenDetail.status]}>
              {specimenDetail.status}
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 h-[calc(100vh-8rem)]">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="w-full grid grid-cols-3 px-4">
              <TabsTrigger value="basic">基本信息</TabsTrigger>
              <TabsTrigger value="review">判读意见</TabsTrigger>
              <TabsTrigger value="records">关联记录</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="p-4 space-y-4">
              <Card>
                <CardContent className="p-0">
                  {specimenDetail.micrograph_url ? (
                    <img
                      src={specimenDetail.micrograph_url}
                      alt="显微切片"
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="w-full h-48 bg-muted flex items-center justify-center rounded-t-lg">
                      <span className="text-muted-foreground">暂无图像</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                      <Leaf className="h-3 w-3" />
                      基质
                    </div>
                    <div className="font-medium">{specimenDetail.substrate || '-'}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                      孢子密度
                    </div>
                    <div className="font-medium mb-1">{specimenDetail.spore_density || '-'}</div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${sporeDensityValues[specimenDetail.spore_density || '无']}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                      <Droplets className="h-3 w-3" />
                      湿度暴露
                    </div>
                    <div className="font-medium">{specimenDetail.humidity_exposure || '-'}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                      <MapPin className="h-3 w-3" />
                      采集来源
                    </div>
                    <div className="font-medium">{specimenDetail.collection_source || '-'}</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">采集信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">采集点</span>
                    <span className="font-medium text-sm">
                      {specimenDetail.collection_point || '-'}
                      {specimenDetail.collection_coords && (
                        <span className="text-muted-foreground ml-1 text-xs">
                          ({specimenDetail.collection_coords.lat}, {specimenDetail.collection_coords.lng})
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">
                      <Mountain className="h-3 w-3 inline mr-1" />
                      海拔
                    </span>
                    <span className="font-medium text-sm">
                      {specimenDetail.collection_altitude ? `${specimenDetail.collection_altitude}m` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      采集日期
                    </span>
                    <span className="font-medium text-sm">
                      {formatDate(specimenDetail.collection_date)}
                      {specimenDetail.season && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {specimenDetail.season}季
                        </Badge>
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">归属信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">原始归属</span>
                    <span className="font-medium text-sm">
                      {specimenDetail.original_belongs_to || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">当前归属</span>
                    <span className={`font-medium text-sm ${
                      specimenDetail.current_belongs_to !== specimenDetail.original_belongs_to
                        ? 'text-amber-600'
                        : ''
                    }`}>
                      {specimenDetail.current_belongs_to || '-'}
                    </span>
                  </div>
                  {specimenDetail.is_remeasure && (
                    <div className="flex items-center gap-1 text-amber-600 text-sm">
                      <AlertTriangle className="h-3 w-3" />
                      <span>复测标本</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button
                  variant={isLocked ? 'outline' : 'default'}
                  className="flex-1"
                  onClick={handleToggleLock}
                  disabled={isLoading}
                >
                  {isLocked ? (
                    <>
                      <Unlock className="h-4 w-4 mr-2" />
                      解锁
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      锁定
                    </>
                  )}
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleOpenHistory}>
                  <History className="h-4 w-4 mr-2" />
                  查看历史
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="review" className="p-4 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">当前判读意见</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">
                    {specimenDetail.interpreter_opinion || '暂无判读意见'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">编辑判读意见</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">判读意见</label>
                    <Textarea
                      placeholder="请输入判读意见..."
                      value={opinion}
                      onChange={(e) => setOpinion(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">状态流转</label>
                    <Select value={status} onValueChange={(v) => setStatus(v as SpecimenStatus)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="选择状态（不修改请留空）" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="待接收">待接收</SelectItem>
                        <SelectItem value="复判中">复判中</SelectItem>
                        <SelectItem value="已锁定">已锁定</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">当前归属地</label>
                    <Input
                      placeholder="输入当前归属地（不修改请留空）"
                      value={belongsTo}
                      onChange={(e) => setBelongsTo(e.target.value)}
                    />
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleSaveReview}
                    disabled={isLoading || (!opinion.trim() && !status && !belongsTo.trim())}
                  >
                    {isLoading ? '保存中...' : '保存'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="records" className="p-4 space-y-4">
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />

                {specimenDetail.assignments.map((assignment) => (
                  <div key={`assignment-${assignment.id}`} className="relative pl-8 pb-6">
                    <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-background" />
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-sm text-blue-800">
                          {assignment.assign_from || '-'}
                          <ArrowRight className="h-3 w-3 inline mx-1" />
                          {assignment.assign_to}
                        </span>
                      </div>
                      {assignment.notes && (
                        <p className="text-sm text-blue-700 mb-1">{assignment.notes}</p>
                      )}
                      <div className="flex items-center gap-1 text-xs text-blue-500">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(assignment.assigned_at)}
                      </div>
                    </div>
                  </div>
                ))}

                {specimenDetail.rejections.map((rejection) => (
                  <div key={`rejection-${rejection.id}`} className="relative pl-8 pb-6">
                    <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-red-500 border-2 border-background" />
                    <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="font-medium text-sm text-red-800">
                          {rejection.rejected_by} 退回
                        </span>
                        {rejection.is_deficient && (
                          <Badge variant="destructive" className="text-xs">缺证</Badge>
                        )}
                      </div>
                      <p className="text-sm text-red-700 mb-1">{rejection.reason}</p>
                      <div className="flex items-center gap-1 text-xs text-red-500">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(rejection.rejected_at)}
                      </div>
                    </div>
                  </div>
                ))}

                {specimenDetail.lock_records.map((record) => (
                  <div key={`lock-${record.id}`} className="relative pl-8 pb-6">
                    <div className={`absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-background ${
                      record.is_locked ? 'bg-green-500' : 'bg-yellow-500'
                    }`} />
                    <div className={`border rounded-lg p-3 ${
                      record.is_locked
                        ? 'bg-green-50 border-green-100'
                        : 'bg-yellow-50 border-yellow-100'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        {record.is_locked ? (
                          <Lock className={`h-4 w-4 ${record.is_locked ? 'text-green-600' : 'text-yellow-600'}`} />
                        ) : (
                          <Unlock className="h-4 w-4 text-yellow-600" />
                        )}
                        <span className={`font-medium text-sm ${
                          record.is_locked ? 'text-green-800' : 'text-yellow-800'
                        }`}>
                          {record.locked_by} {record.is_locked ? '锁定' : '解锁'}
                        </span>
                      </div>
                      {record.unlock_reason && (
                        <p className={`text-sm mb-1 ${
                          record.is_locked ? 'text-green-700' : 'text-yellow-700'
                        }`}>
                          {record.unlock_reason}
                        </p>
                      )}
                      <div className={`flex items-center gap-1 text-xs ${
                        record.is_locked ? 'text-green-500' : 'text-yellow-500'
                      }`}>
                        <Clock className="h-3 w-3" />
                        {formatDateTime(record.locked_at)}
                      </div>
                    </div>
                  </div>
                ))}

                {specimenDetail.assignments.length === 0 &&
                 specimenDetail.rejections.length === 0 &&
                 specimenDetail.lock_records.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">暂无关联记录</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
