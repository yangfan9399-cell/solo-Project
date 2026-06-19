import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Calendar,
  MapPin,
  FileText,
  ArrowRight,
  AlertCircle,
  History,
} from 'lucide-react'
import { useSpecimenStore } from '@/store/useSpecimenStore'
import type { HistoryRecord } from '@/types'

export function ReMeasureHistory() {
  const {
    showHistory,
    closeHistory,
    specimenHistory,
    specimenDetail,
  } = useSpecimenStore()

  const sortedHistory = [...specimenHistory].sort((a, b) => {
    const dateA = a.collection_date ? new Date(a.collection_date).getTime() : 0
    const dateB = b.collection_date ? new Date(b.collection_date).getTime() : 0
    return dateA - dateB
  })

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('zh-CN')
  }

  const generateChangeNarrative = (records: HistoryRecord[]): string => {
    if (records.length === 0) return '暂无历史记录'

    const changes: string[] = []
    let prevBelongsTo: string | undefined

    records.forEach((record, index) => {
      const currentBelongsTo = record.current_belongs_to || record.original_belongs_to
      const originalBelongsTo = record.original_belongs_to

      if (index === 0) {
        changes.push(`该标本最早于 ${formatDate(record.collection_date)}（${record.season}季）采集于 ${record.collection_point || '未知地点'}，最初归属为 ${originalBelongsTo || '未记录'}。`)
      }

      if (currentBelongsTo !== originalBelongsTo) {
        if (prevBelongsTo && prevBelongsTo !== currentBelongsTo) {
          changes.push(`在 ${formatDate(record.collection_date)}（${record.season}季）的复测中，归属由 ${prevBelongsTo} 变更为 ${currentBelongsTo}。`)
        } else if (!prevBelongsTo || prevBelongsTo !== currentBelongsTo) {
          changes.push(`在 ${formatDate(record.collection_date)}（${record.season}季）的复测中，归属由 ${originalBelongsTo} 变更为 ${currentBelongsTo}。`)
        }
      }

      prevBelongsTo = currentBelongsTo
    })

    if (changes.length === 1) {
      changes.push('此后该标本归属未发生变更。')
    }

    const currentRecord = records[records.length - 1]
    if (currentRecord) {
      changes.push(`目前最新记录为 ${formatDate(currentRecord.collection_date)}（${currentRecord.season}季）采集于 ${currentRecord.collection_point || '未知地点'}，当前归属为 ${currentRecord.current_belongs_to || currentRecord.original_belongs_to || '未记录'}。`)
    }

    return changes.join(' ')
  }

  return (
    <Dialog open={showHistory} onOpenChange={(open) => !open && closeHistory()}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            复测历史记录
            {specimenDetail && (
              <Badge variant="secondary" className="font-mono">
                {specimenDetail.specimen_no}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            展示该标本历次复测的归属变更脉络
          </DialogDescription>
        </DialogHeader>

        {sortedHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">暂无历史记录</p>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 min-h-0">
              <div className="relative px-4 py-2">
                <div className="absolute left-6 top-4 bottom-4 w-px bg-border" />

                {sortedHistory.map((record, index) => {
                  const hasChanged = record.current_belongs_to !== record.original_belongs_to

                  return (
                    <div key={`${record.specimen_id}-${index}`} className="relative pl-12 pb-6 last:pb-0">
                      <div className={`absolute left-4 top-1.5 w-4 h-4 rounded-full border-2 border-background ${
                        hasChanged ? 'bg-amber-500' : 'bg-primary'
                      }`} />

                      <Card className={hasChanged ? 'border-amber-200 bg-amber-50/50' : ''}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {record.season}季 · {formatDate(record.collection_date)}
                              </span>
                            </div>
                            <Badge variant="outline" className="font-mono text-xs">
                              {record.specimen_no}
                            </Badge>
                          </div>

                          {hasChanged && (
                            <div className="mb-3">
                              <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
                                归属已变更
                              </Badge>
                            </div>
                          )}

                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <div className="flex items-center gap-2 flex-1">
                                <span className="text-muted-foreground text-sm w-16 shrink-0">原始归属</span>
                                <span className="text-sm">
                                  {record.original_belongs_to || '-'}
                                </span>
                              </div>
                              {hasChanged && (
                                <>
                                  <ArrowRight className="h-4 w-4 text-amber-500 shrink-0" />
                                  <div className="flex items-center gap-2 flex-1">
                                    <span className="text-muted-foreground text-sm w-16 shrink-0">当前归属</span>
                                    <span className="text-sm font-medium text-amber-700">
                                      {record.current_belongs_to || '-'}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>

                            {record.interpreter_opinion && (
                              <div className="flex items-start gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                <div>
                                  <span className="text-muted-foreground text-sm">判读意见</span>
                                  <p className="text-sm mt-0.5">{record.interpreter_opinion}</p>
                                </div>
                              </div>
                            )}

                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                              <div>
                                <span className="text-muted-foreground text-sm">采集点</span>
                                <p className="text-sm mt-0.5">
                                  {record.collection_point || '-'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>

            <Separator />

            <Card className="mx-4 my-4">
              <CardContent className="p-4">
                <h4 className="font-medium text-sm mb-2">归属变化脉络</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {generateChangeNarrative(sortedHistory)}
                </p>
              </CardContent>
            </Card>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={closeHistory}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
