import { useState } from 'react'
import { XCircle, X, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { useSpecimenStore } from '@/store/useSpecimenStore'

const rejectReasons = [
  '数据不完整',
  '图像质量差',
  '标本污染',
  '信息填写错误',
  '需要重新测量',
  '其他原因',
]

export function BatchRejectDialog() {
  const {
    showRejectDialog,
    closeRejectDialog,
    selectedSpecimenIds,
    specimens,
    isLoading,
    error,
    setError,
    currentUser,
    batchReject,
  } = useSpecimenStore()

  const [reason, setReason] = useState('')
  const [isDeficient, setIsDeficient] = useState(false)

  const selectedSpecimens = specimens.filter((s) =>
    selectedSpecimenIds.includes(s.id)
  )

  const handleSubmit = async () => {
    if (!reason.trim()) return

    await batchReject({
      reason: reason.trim(),
      is_deficient: isDeficient,
      rejected_by: currentUser?.name || '',
    })
    setReason('')
    setIsDeficient(false)
  }

  const handleClose = () => {
    closeRejectDialog()
    setReason('')
    setIsDeficient(false)
    setError(null)
  }

  const handleRemoveSpecimen = (specimenId: number) => {
    const store = useSpecimenStore.getState()
    store.toggleSelectSpecimen(specimenId)
  }

  return (
    <Dialog open={showRejectDialog} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            批量退回标本
          </DialogTitle>
          <DialogDescription>
            将选中的 {selectedSpecimens.length} 个标本退回，此操作需要填写退回原因
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>注意</AlertTitle>
            <AlertDescription>
              退回操作将影响 {selectedSpecimens.length} 个标本，请确认操作无误。
            </AlertDescription>
          </Alert>

          <div>
            <label className="text-sm font-medium mb-2 block">
              已选择的标本
            </label>
            <ScrollArea className="h-32 border rounded-md p-3">
              <div className="flex flex-wrap gap-2">
                {selectedSpecimens.map((specimen) => (
                  <Badge
                    key={specimen.id}
                    variant="destructive"
                    className="flex items-center gap-1"
                  >
                    {specimen.specimen_no}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 hover:bg-transparent text-destructive-foreground"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveSpecimen(specimen.id)
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              退回原因 <span className="text-destructive">*</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {rejectReasons.map((r) => (
                <Button
                  key={r}
                  type="button"
                  variant={reason === r ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setReason(r)}
                >
                  {r}
                </Button>
              ))}
            </div>
            <Textarea
              placeholder="请详细填写退回原因..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is-deficient"
              checked={isDeficient}
              onCheckedChange={(checked) => setIsDeficient(checked as boolean)}
            />
            <label
              htmlFor="is-deficient"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              标记为缺证
            </label>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              退回人
            </label>
            <div className="text-sm text-muted-foreground p-3 border rounded-md bg-muted/50">
              {currentUser?.name || '当前用户'}
            </div>
          </div>

        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!reason.trim() || isLoading}
          >
            {isLoading ? '处理中...' : '确认退回'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
